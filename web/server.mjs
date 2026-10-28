// Same-origin game host with optional accounts. Engine UDP ports stay inside the container network.
import http from 'node:http';
import {createAuth} from './auth.mjs';
import {Economy} from './economy.mjs';
import {watchEconomy} from './economy-events.mjs';
import {botCommands} from './bot-policy.mjs';
import {RoomLifecycle} from './room-lifecycle.mjs';
const auth=createAuth();
const installedCosmetics=JSON.parse(fs.readFileSync('/data/skins.json'));
const economy=new Economy('/accounts',undefined,{features:installedCosmetics.features||[]});
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { RtcBridge } from './rtc.mjs';
import {SocketBridge} from './socket-bridge.mjs';
import { rcon, consultarInfo } from './consulta.mjs';
const onDemand=process.env.DINGUS_ON_DEMAND==='1';
const control=process.env.DINGUS_CONTROL_DIR||'/control';
const maximumRooms=Math.max(1,Math.min(3,Number(process.env.DINGUS_MAX_ROOMS)||3));
const maximumHumans=Number(process.env.DINGUS_MAX_HUMANS)||8;
const httpPort=Number(process.env.PORT)||27016;
if(onDemand)fs.mkdirSync(control,{recursive:true});
const rooms=JSON.parse(fs.readFileSync('/config/rooms.json'));
const halfLifeMaps=new Set(["arena_crossfire", "arena_stalkyard", "arena_officecomplex", "arena_bootcamp", "arena_bounce", "arena_datacore", "arena_frenzy", "arena_lambda", "arena_rapidcore", "arena_snarkpit", "arena_subtransit", "arena_undertow"]);
if(onDemand)for(const r of rooms)fs.rmSync(path.join(control,r.id+'.run'),{force:true});
const adminPassword=fs.readFileSync('/config/server.cfg','utf8').match(/rcon_password "([^"]+)"/)?.[1];
const assets=JSON.parse(fs.readFileSync('/data/assets.json'));
const states=new Map(),lastHealthy=new Map(),startupErrors=new Map(),headcrabTimers=new Map();
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
const economyEvents=watchEconomy(economy,rooms,sockets.peers);
const cosmeticPack=installedCosmetics;
let syncingEquipment=false;
async function syncEquipment(){if(syncingEquipment||!adminPassword)return;syncingEquipment=true;try{for(const p of sockets.peers){if(!p.open||!p.address)continue;const user=p.identity?.();const variants=user?economy.selection(user.id):[0,0,0,0];const room=rooms.find(r=>r.id===p.room);if(room)await rcon(room.puerto,adminPassword,"dingus_equip "+p.address+" "+variants.join(" "));}}finally{syncingEquipment=false;}}
setInterval(()=>syncEquipment().catch(()=>{}),3000).unref();
const count=id=>bridge.contarSala(id)+sockets.contarSala(id);
const lookup=token=>rooms.find(r=>r.token===token);
const requestRoom=r=>{const f=path.join(control,r.id+'.run');fs.writeFileSync(f+'.tmp',r.mapa+'\n');fs.renameSync(f+'.tmp',f);};
const leases=new RoomLifecycle({maximum:maximumRooms,count,start:requestRoom,touch:requestRoom,stop:r=>{fs.rmSync(path.join(control,r.id+'.run'),{force:true});states.delete(r.id);lastHealthy.delete(r.id);}});
const startingRooms=new Map();
async function startRoom(r){
 if(!onDemand)return;
 if(states.has(r.id))return;
 if(startingRooms.has(r.id))return startingRooms.get(r.id);
 startupErrors.delete(r.id);
 const pending=(async()=>{
  try{
   leases.acquire(r);
   for(let n=0;n<180;n++){
    const info=await consultarInfo(r.puerto,700);
    if(info?.map===r.mapa){states.set(r.id,info);lastHealthy.set(r.id,Date.now());return;}
    await new Promise(ok=>setTimeout(ok,500));
   }
   throw Error('The server did not answer in time. Please retry.');
  }catch(e){
   if(leases.active.has(r.id))leases.release(r.id);
   startupErrors.set(r.id,e.message||'The room could not start. Please retry.');
   throw e;
  }
 })();
 startingRooms.set(r.id,pending);
 try{return await pending;}finally{startingRooms.delete(r.id);}
}
if(onDemand)setInterval(()=>leases.tick(),10000).unref();
let updating=false;
async function update(){if(updating)return;updating=true;try{await Promise.all(rooms.map(async r=>{if(onDemand&&!leases.active.has(r.id)){states.delete(r.id);lastHealthy.delete(r.id);return;}const info=await consultarInfo(r.puerto,onDemand?3000:1500);if(info){states.set(r.id,info);lastHealthy.set(r.id,Date.now());}else if(Date.now()-(lastHealthy.get(r.id)||0)>15000)states.delete(r.id);}));}finally{updating=false;}}
await update();setInterval(update,5000).unref();
let settingBots=false;
async function maintainBots(){
 if(settingBots||!adminPassword)return;
 settingBots=true;
 try{for(const r of rooms){
  const info=states.get(r.id);if(!info)continue;
  // Reapply after engine restarts and graph generation (both reset quota).
  for(const cmd of botCommands(Math.min(r.maxJugadores,(info.maxPlayers||33)-1)))await rcon(r.puerto,adminPassword,cmd);
 }}finally{settingBots=false;}
}
setInterval(()=>maintainBots().catch(console.error),30000).unref();
setTimeout(()=>maintainBots().catch(console.error),7000).unref();

const mime={'.mp4':'video/mp4','.webm':'video/webm','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.zip':'application/zip'};
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin'};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':mime['.json'],'Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
function file(req,res,file){let stat;try{stat=fs.statSync(file);if(!stat.isFile())throw Error();}catch{return json(res,404,{error:'Not found'});}
 const tag='"'+stat.size+'-'+Math.floor(stat.mtimeMs)+'"';if(req.headers['if-none-match']===tag){res.writeHead(304,headers);return res.end();}
 if(req.headers.range&&/\.(mp4|webm)$/.test(file)){
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range){res.writeHead(416,{'Content-Range':'bytes */'+stat.size,...headers});return res.end();}
  const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
  if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size,...headers});return res.end();}
  res.writeHead(206,{'Content-Type':mime[path.extname(file)],'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Accept-Ranges':'bytes',...headers});if(req.method==='HEAD')return res.end();return fs.createReadStream(file,{start,end}).pipe(res);
 }
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':file.includes('/assets/')?'public, max-age=31536000, immutable':'no-cache','ETag':tag,...headers});if(req.method==='HEAD')return res.end();fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);}
const detail=r=>{const s=states.get(r.id);return {id:r.token,name:r.nombre,map:s?.map||r.mapa,players:count(r.id),bots:s?.bots||0,max:r.maxJugadores,online:!!s,private:r.private,state:s?'live':onDemand?(leases.active.has(r.id)?'starting':'sleeping'):'starting',mode:r.mode||(r.mapa.startsWith('arena_')?'team_elimination':r.mapa.startsWith('cs_')?'hostage':'bomb')};};
const rate=new Map();
const eventVotes=new Map(),eventCooldowns=new Map();
const server=http.createServer(async(req,res)=>{
 try{
 const u=new URL(req.url,'http://local');let p;try{p=decodeURIComponent(u.pathname);}catch{return json(res,400,{error:'Invalid URL'});}
 if(await auth(req,res,p,u))return;
 if(req.method==='GET'&&p==='/healthz'){let ready=rooms.every(r=>!!states.get(r.id));if(onDemand){try{ready=Date.now()-fs.statSync(path.join(control,'ready')).mtimeMs<15000;}catch{ready=false;}}return json(res,ready?200:503,{ready});}
 const signedIn=auth.user(req);
 if(p.startsWith('/api/')&&!signedIn)return json(res,401,{error:'Sign in to continue.'});
 if(req.method==='GET'&&['/','/account.html'].includes(p)&&signedIn){res.writeHead(303,{Location:'/hub.html','Cache-Control':'no-store'});res.end();return;}
 if(req.method==='GET'&&(p==='/hub.html'||p==='/shop.html'||p==='/play')&&!signedIn){res.writeHead(303,{Location:'/account.html?next='+encodeURIComponent(p+u.search),'Cache-Control':'no-store'});res.end();return;}

 if(p.startsWith('/api/shop')){
  const user=auth.user(req);if(!user)return json(res,401,{error:'Sign in to earn credits and use your inventory.'});
  if(req.method==='GET'&&p==='/api/shop')return json(res,200,{username:user.username,...economy.snapshot(user.id)});
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  if(![`http://${req.headers.host}`,`https://${req.headers.host}`].includes(req.headers.origin)||!String(req.headers['content-type']).startsWith('application/json'))return json(res,403,{error:'Request origin rejected'});
  let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>4096)return json(res,413,{error:'Request too large'});}
  try{const body=JSON.parse(text);const result=economy.transaction(user.id,p.slice('/api/shop/'.length),body,{username:user.username});syncEquipment().catch(()=>{});return json(res,200,{...result,...economy.snapshot(user.id)});}catch(e){return json(res,400,{error:e.message});}
 }
 if(req.method==='POST'&&p==='/api/event'){
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return json(res,403,{error:'Origin rejected'});
  const r=lookup(u.searchParams.get('sala')),session=req.headers['x-game-session'];
  if(!r||u.searchParams.get('event')!=='headcrabs')return json(res,400,{error:'Unknown event or room.'});
  if(!halfLifeMaps.has(r.mapa))return json(res,403,{error:'Headcrab events only happen in Half-Life arenas.'});
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
  if(!auth.user(req))return json(res,401,{error:'Sign in to host a room.'});
  // Only same-origin pages may allocate a room. No arbitrary ports, servers or commands.
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return json(res,403,{error:'Origin rejected'});
  const ip=req.socket.remoteAddress,now=Date.now();if(now-(rate.get(ip)||0)<3000)return json(res,429,{error:'Please wait a moment.'});rate.set(ip,now);
  const map=u.searchParams.get('map');
  if(!rooms.some(r=>!r.private&&r.mapa===map))return json(res,400,{error:'Choose an available map.'});
  const r=rooms.find(r=>r.private&&!count(r.id)&&(!r.allocated||now-r.allocated>=2*60*60*1000));
  if(!r)return json(res,409,{error:'All invite rooms are in use. Try a classic room or return later.'});
  r.allocated=now;r.token=(await import('node:crypto')).randomBytes(18).toString('base64url');
  const current=await consultarInfo(r.puerto,500);
  if(onDemand){try{await startRoom({...r,mapa:map});}catch(e){r.allocated=0;return json(res,503,{error:e.message});}}
  else if(current?.map!==map){
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
 if(p==='/api/rooms')return json(res,200,{shareOrigin:shareOrigin(req),onDemand,roomLimit:onDemand?maximumRooms:null,activeRooms:onDemand?leases.active.size:rooms.filter(r=>states.get(r.id)).length,maps:rooms.filter(r=>!r.private).map(r=>({id:r.mapa,name:r.nombre.split(' · ')[0]})),rooms:rooms.filter(r=>!r.private).map(detail)});
 if(p==='/api/room'){const r=lookup(u.searchParams.get('room'));return r?json(res,200,{...detail(r),startupError:startupErrors.get(r.id)||null}):json(res,404,{error:'Room link is invalid or expired.'});}
 if(p==='/api/status'){
  const r=lookup(u.searchParams.get('sala'));if(!r)return json(res,404,{error:'Invalid room'});
  return json(res,200,{hostname:r.nombre,map:states.get(r.id)?.map||r.mapa,maxPlayers:r.maxJugadores,webPlayers:count(r.id),needsPassword:false,serverOnline:!!states.get(r.id),assets,cosmetics:cosmeticPack,sala:r.token});
 }
 if(p==='/game/skins.zip')return file(req,res,'/data/skins.zip');
 if(p==='/game/valve.zip')return file(req,res,'/data/valve.zip');
 if(p==='/play'){
  const r=lookup(u.searchParams.get('room'));if(!r)return json(res,404,{error:'Room link is invalid or expired. Return to the lobby.'});
  if(onDemand&&!states.has(r.id)){startRoom(r).catch(()=>{});const waiting=fs.readFileSync('/app/public/start-room.html','utf8');res.writeHead(200,{'Content-Type':mime['.html'],'Cache-Control':'no-store',...headers});return res.end(req.method==='HEAD'?undefined:waiting);}
  try{await startRoom(r);}catch(e){return json(res,503,{error:e.message});}
  let html=fs.readFileSync('/app/public/index.html','utf8');html=html.replace('<head>','<head><script>window.cs16Sala='+JSON.stringify(r.token)+';window.cs16HeadcrabsEnabled='+JSON.stringify(halfLifeMaps.has(r.mapa))+';window.CS16_SHARE_ORIGIN='+JSON.stringify(shareOrigin(req))+';</script>');
  res.writeHead(200,{'Content-Type':mime['.html'],'Cache-Control':'no-store',...headers});return res.end(req.method==='HEAD'?undefined:html);
 }
 const root='/app/public',f=path.resolve(root,p==='/'?'lobby.html':'.'+p);
 if(!f.startsWith(root+'/'))return json(res,403,{error:'Forbidden'});return file(req,res,f);
 }catch(e){console.error(e);if(!res.headersSent)json(res,500,{error:'Server error'});else res.destroy();}
});
const ws=new WebSocketServer({noServer:true,maxPayload:65536});
server.on('upgrade',(req,socket,head)=>{try{const u=new URL(req.url,'http://local'),r=lookup(u.searchParams.get('sala'));
 if(!auth.user(req)||!['/signal','/game-socket'].includes(u.pathname)||!r||!states.get(r.id)||count(r.id)>=r.maxJugadores||(onDemand&&rooms.reduce((n,r)=>n+count(r.id),0)>=maximumHumans))return socket.destroy();
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return socket.destroy();
 const ip=req.headers['cf-connecting-ip']||req.socket.remoteAddress;
 ws.handleUpgrade(req,socket,head,w=>u.pathname==='/game-socket'?sockets.handle(w,ip,r,()=>auth.user(req)):bridge.handle(w,ip,r));}catch{socket.destroy();}});
server.listen(httpPort,'0.0.0.0',()=>console.log('CS 1.6 webgame ready on :'+httpPort+'; game servers are internal.'));
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{economyEvents.close();if(onDemand)leases.close();sockets.closeAll();bridge.closeAll();server.close();setTimeout(()=>process.exit(0),300).unref();});
