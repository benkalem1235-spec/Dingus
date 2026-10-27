import fs from 'node:fs';
// Only the native engine writes this directory; browsers cannot submit rewards.
export function watchEconomy(economy,rooms,peers,directory='/events'){
 const cursors=new Map();
 const tick=()=>{for(const room of rooms){try{
  const file=directory+'/'+room.puerto+'.jsonl',size=fs.statSync(file).size;let c=cursors.get(file)||{offset:0,tail:''};if(size<c.offset)c={offset:0,tail:''};if(size===c.offset)continue;
  const fd=fs.openSync(file,'r'),b=Buffer.alloc(Math.min(65536,size-c.offset));let n;try{n=fs.readSync(fd,b,0,b.length,c.offset);}finally{fs.closeSync(fd);}c.offset+=n;const lines=(c.tail+b.subarray(0,n).toString()).split('\n');c.tail=lines.pop();if(c.tail.length>4096)c.tail='';cursors.set(file,c);
  for(const line of lines){let event;try{event=JSON.parse(line);}catch{continue;}
   economy.consume(room.id,event,address=>{const p=[...peers].find(p=>p.open&&p.room===room.id&&p.address===address);return p?.identity?.()?.id;});
  }
 }catch(e){if(e.code!=='ENOENT')console.error('Economy journal read failed:',e.code||e.message);}}};
 const timer=setInterval(tick,500);timer.unref();return {tick,close:()=>clearInterval(timer)};
}
