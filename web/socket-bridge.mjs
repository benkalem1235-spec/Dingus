import dgram from 'node:dgram';
import crypto from 'node:crypto';
import {esRcon} from './paquetes.mjs';
// Each browser gets a separate loopback socket; clients cannot choose a UDP destination.
export class SocketBridge {
 constructor(){this.peers=new Set();this.slots=new Set();}
 contarSala(id){return [...this.peers].filter(p=>p.room===id&&p.open).length;}
 handle(ws,ip,room,identity=()=>null){
  const account=identity();if(account&&[...this.peers].some(p=>p.identity?.()?.id===account.id)){ws.close(1008,"This account is already playing. Close its other game first.");return;}
  if(this.peers.size>=96||this.contarSala(room.id)>=room.maxJugadores||[...this.peers].filter(p=>p.ip===ip).length>=12){ws.close(1013,'Room or connection limit reached');return;}
  let slot=0;while(this.slots.has(slot))slot++;this.slots.add(slot);
  const peer={ws,ip,identity,room:room.id,open:false,session:crypto.randomBytes(24).toString('base64url')};this.peers.add(peer);
  const udp=dgram.createSocket('udp4');let alive=true,closed=false,packets=0,bytes=0;
  const close=()=>{if(closed)return;closed=true;clearInterval(ping);clearInterval(window);this.peers.delete(peer);this.slots.delete(slot);try{udp.close();}catch{}try{ws.close();}catch{}};
  const window=setInterval(()=>{packets=0;bytes=0;},1000);
  const ping=setInterval(()=>{if(!alive)return close();alive=false;try{ws.ping();}catch{close();}},15000);
  udp.on('error',close);
  udp.on('message',(msg,from)=>{if(!peer.open||from.port!==room.puerto||from.address!=='127.0.0.1'||ws.readyState!==1)return;if(ws.bufferedAmount>1<<20){ws.close(1013,'Game connection overloaded; reconnect');return close();}ws.send(msg,{binary:true},error=>{if(error)close();});});
  udp.bind(0,`127.0.${1+Math.floor(slot/254)}.${1+slot%254}`,()=>{peer.address=udp.address().address+":"+udp.address().port;peer.open=true;ws.send(JSON.stringify({type:'ready',session:peer.session}));});
  ws.on('pong',()=>alive=true);
  ws.on('message',(data,binary)=>{if(!binary||!peer.open)return;if(++packets>500||(bytes+=data.length)>1024*1024)return ws.close(1008,'Traffic limit');if(data.length>65507||esRcon(data))return;udp.send(data,room.puerto,'127.0.0.1');});
  ws.on('close',close);ws.on('error',close);
 }
 closeAll(){for(const p of [...this.peers])p.ws.close(1001,'Host restarting');}
}
