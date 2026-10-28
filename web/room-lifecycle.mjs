// Browsing/status polling never starts a native game process. Only an explicit join/host does.
export class RoomLifecycle {
 constructor({maximum=3,idleMs=120000,startupGraceMs=600000,now=Date.now,count=()=>0,start=()=>{},touch=()=>{},stop=()=>{}}={}){
  this.maximum=maximum;this.idleMs=idleMs;this.startupGraceMs=startupGraceMs;this.now=now;this.count=count;this.start=start;this.touch=touch;this.stop=stop;this.active=new Map();
 }
 acquire(room){
  if(!/^[a-zA-Z0-9_-]{1,16}$/.test(room.id)||!/^\w+$/.test(room.mapa))throw Error('Invalid room configuration.');
  let entry=this.active.get(room.id);
  if(entry){if(entry.room.mapa!==room.mapa){if(this.count(room.id))throw Error('This room still has players.');this.start(room);entry.room={...room};entry.created=this.now();entry.hadHumans=false;}if(!this.count(room.id)){entry.created=this.now();entry.lastActive=this.now();entry.hadHumans=false;}return;}
  if(this.active.size>=this.maximum)throw Error(`All ${this.maximum} active room slots are in use. Join an existing room or try later.`);
  this.start(room);this.active.set(room.id,{room:{...room},created:this.now(),lastActive:this.now(),hadHumans:false});
 }
 tick(){const time=this.now();for(const [id,e]of this.active){const humans=this.count(id);if(humans){e.hadHumans=true;e.lastActive=time;}
  if(!humans&&time-(e.hadHumans?e.lastActive:e.created)>=(e.hadHumans?this.idleMs:this.startupGraceMs)){this.stop(e.room);this.active.delete(id);}else this.touch(e.room);
 }}
 release(id){const e=this.active.get(id);if(e){this.stop(e.room);this.active.delete(id);}}
 close(){for(const id of this.active.keys())this.release(id);}
}
