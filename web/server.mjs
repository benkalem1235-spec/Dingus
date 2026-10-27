// Guest-only, same-origin game host. Engine UDP ports stay inside the container network.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { RtcBridge } from './rtc.mjs';
import {SocketBridge} from './socket-bridge.mjs';
import { rcon, consultarInfo } from './consulta.mjs';
const rooms=JSON.parse(fs.readFileSync('/config/rooms.json'));
const adminPassword=fs.readFileSync('/config/server.cfg','utf8').match(/rcon_password "([^"]+)"/)?.[1];
const assets=JSON.parse(fs.readFileSync('/data/assets.json'));
const states=new Map();
function shareOrigin(req){
 const forwarded=req.headers['x-forwarded-proto'];
 // Public visitors keep the HTTPS origin that served them; local visitors get the LAN invite.
 const host=String(req.headers.host||'');
 if(/^[a-z0-9-]+\.trycloudflare\.com$/.test(host))return 'https://'+host;
 return process.env.PUBLIC_URL|| (process.env.PUBLIC_IP?'http://'+process.env.PUBLIC_IP+':27016':null);
}
const cfg={httpPort:27016,webrtcPort:27018,publicIp:process.env.PUBLIC_IP||'',maxPeers:90,maxPorIp:16};
const bridge=new RtcBridge(cfg);
const sockets=new SocketBridge();
const count=id=>bridge.contarSala(id)+sockets.contarSala(id);
const lookup=token=>rooms.find(r=>r.token===token);
async function update(){await Promise.all(rooms.map(async r=>states.set(r.id,await consultarInfo(r.puerto))));}
await update();setInterval(update,5000).unref();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.wasm':'application/wasm','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.zip':'application/zip'};
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin'};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':mime['.json'],'Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
function file(req,res,file){let stat;try{stat=fs.statSync(file);if(!stat.isFile())throw Error();}catch{return json(res,404,{error:'Not found'});}
 const tag='"'+stat.size+'-'+Math.floor(stat.mtimeMs)+'"';if(req.headers['if-none-match']===tag){res.writeHead(304,headers);return res.end();}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':file.includes('/assets/')?'public, max-age=31536000, immutable':'no-cache','ETag':tag,...headers});if(req.method==='HEAD')return res.end();fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);}
const detail=r=>{const s=states.get(r.id);return {id:r.token,name:r.nombre,map:s?.map||r.mapa,players:count(r.id),bots:s?.bots||0,max:r.maxJugadores,online:!!s,private:r.private,mode:r.mode||(r.mapa.startsWith('arena_')?'team_elimination':r.mapa.startsWith('cs_')?'hostage':'bomb')};};
const rate=new Map();
const eventVotes=new Map(),eventCooldowns=new Map();
const server=http.createServer(async(req,res)=>{
 try{
 const u=new URL(req.url,'http://local');let p;try{p=decodeURIComponent(u.pathname);}catch{return json(res,400,{error:'Invalid URL'});}
 if(req.method==='POST'&&p==='/api/event'){
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return json(res,403,{error:'Origin rejected'});
  const r=lookup(u.searchParams.get('sala')),session=req.headers['x-game-session'];
  if(!r||u.searchParams.get('event')!=='headcrabs')return json(res,400,{error:'Unknown event or room.'});
  const peers=[...sockets.peers].filter(p=>p.open&&p.room===r.id);
  if(!session||!peers.some(p=>p.session===session))return json(res,403,{error:'Join this room before voting for an event.'});
  const now=Date.now(),until=eventCooldowns.get(r.id)||0;
  if(until>now)return json(res,429,{error:'Next event available in '+Math.ceil((until-now)/1000)+' seconds.'});
  let vote=eventVotes.get(r.id);if(!vote||now-vote.since>30000)vote={since:now,sessions:new Set()};
  vote.sessions.add(session);eventVotes.set(r.id,vote);
  const current=new Set(peers.map(p=>p.session));const votes=[...vote.sessions].filter(s=>current.has(s)).length,needed=Math.floor(peers.length/2)+1;
  if(votes<needed)return json(res,200,{started:false,votes,needed,message:`Headcrab event: ${votes}/${needed} votes. Voting lasts 30 seconds.`});
  if(!adminPassword)return json(res,503,{error:'Events are unavailable on this host.'});
  eventCooldowns.set(r.id,now+90000);eventVotes.delete(r.id);
  const result=await rcon(r.puerto,adminPassword,'dingus_headcrabs');
  const spawned=result.match(/Headcrab wave spawned: (\d+)/);
  if(!spawned){eventCooldowns.delete(r.id);return json(res,409,{error:result.includes('No living')?'No living players. Try after the next round starts.':'No safe spawn space, or the event is cooling down. Try again later.'});}
  return json(res,200,{started:true,spawned:Number(spawned[1]),message:'Headcrab wave! Watch your feet. They despawn after 60 seconds.'});
 }
 if(req.method==='POST'&&p==='/api/rooms'){
  // Only same-origin pages may allocate a room. No arbitrary ports, servers or commands.
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return json(res,403,{error:'Origin rejected'});
  const ip=req.socket.remoteAddress,now=Date.now();if(now-(rate.get(ip)||0)<3000)return json(res,429,{error:'Please wait a moment.'});rate.set(ip,now);
  const map=u.searchParams.get('map');
  if(!rooms.some(r=>!r.private&&r.mapa===map))return json(res,400,{error:'Choose an available map.'});
  const r=rooms.find(r=>r.private&&!count(r.id)&&(!r.allocated||now-r.allocated>=2*60*60*1000));
  if(!r)return json(res,409,{error:'All invite rooms are in use. Try a classic room or return later.'});
  r.allocated=now;r.token=(await import('node:crypto')).randomBytes(18).toString('base64url');
  const current=await consultarInfo(r.puerto,500);
  if(current?.map!==map){
   if(!adminPassword){r.allocated=0;return json(res,503,{error:'Map switching is unavailable.'});}
   await rcon(r.puerto,adminPassword,'changelevel '+map);
   let ready=false;
   for(let n=0;n<20;n++){
    await new Promise(ok=>setTimeout(ok,500));const info=await consultarInfo(r.puerto,500);
    if(info?.map===map){states.set(r.id,info);ready=true;break;}
   }
   if(!ready){r.allocated=0;return json(res,503,{error:'The map is still starting. Please try again.'});}
  }
  r.mapa=map;
  return json(res,201,detail(r));
 }
 if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 if(p==='/api/rooms')return json(res,200,{shareOrigin:shareOrigin(req),maps:rooms.filter(r=>!r.private).map(r=>({id:r.mapa,name:r.nombre.split(' · ')[0]})),rooms:rooms.filter(r=>!r.private).map(detail)});
 if(p==='/api/room'){const r=lookup(u.searchParams.get('room'));return r?json(res,200,detail(r)):json(res,404,{error:'Room link is invalid or expired.'});}
 if(p==='/api/status'){
  const r=lookup(u.searchParams.get('sala'));if(!r)return json(res,404,{error:'Invalid room'});
  return json(res,200,{hostname:r.nombre,map:states.get(r.id)?.map||r.mapa,maxPlayers:r.maxJugadores,webPlayers:count(r.id),needsPassword:false,serverOnline:!!states.get(r.id),assets,sala:r.token});
 }
 if(p==='/game/valve.zip')return file(req,res,'/data/valve.zip');
 if(p==='/play'){
  const r=lookup(u.searchParams.get('room'));if(!r)return json(res,404,{error:'Room link is invalid or expired. Return to the lobby.'});
  let html=fs.readFileSync('/app/public/index.html','utf8');html=html.replace('<head>','<head><script>window.cs16Sala='+JSON.stringify(r.token)+';window.CS16_SHARE_ORIGIN='+JSON.stringify(shareOrigin(req))+';</script>');
  res.writeHead(200,{'Content-Type':mime['.html'],'Cache-Control':'no-store',...headers});return res.end(req.method==='HEAD'?undefined:html);
 }
 const root='/app/public',f=path.resolve(root,p==='/'?'lobby.html':'.'+p);
 if(!f.startsWith(root+'/'))return json(res,403,{error:'Forbidden'});return file(req,res,f);
 }catch(e){console.error(e);if(!res.headersSent)json(res,500,{error:'Server error'});else res.destroy();}
});
const ws=new WebSocketServer({noServer:true,maxPayload:65536});
server.on('upgrade',(req,socket,head)=>{try{const u=new URL(req.url,'http://local'),r=lookup(u.searchParams.get('sala'));
 if(!['/signal','/game-socket'].includes(u.pathname)||!r||!states.get(r.id)||count(r.id)>=r.maxJugadores)return socket.destroy();
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return socket.destroy();
 const ip=req.headers['cf-connecting-ip']||req.socket.remoteAddress;
 ws.handleUpgrade(req,socket,head,w=>u.pathname==='/game-socket'?sockets.handle(w,ip,r):bridge.handle(w,ip,r));}catch{socket.destroy();}});
server.listen(27016,'0.0.0.0',()=>console.log('CS 1.6 webgame ready on :27016; game servers are internal.'));
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{sockets.closeAll();bridge.closeAll();server.close();setTimeout(()=>process.exit(0),300).unref();});
