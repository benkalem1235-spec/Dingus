// Native/browser adaptation of CSGOMod's owned skins, weighted draws and model selection.
// Original CSGOMod: Dawid Janik, MIT; see licenses/CSGOMod-MIT.txt.
import {trade,marketSnapshot} from './market.mjs';
import fs from 'node:fs';import path from 'node:path';import {randomInt,randomBytes} from 'node:crypto';
import {skins,crates,rewards,weapons,equipmentSlots,drawCrateSkin} from './catalog.mjs';
export class Economy{
 constructor(directory='/accounts',random=randomInt,{features=[]}={}){this.random=random;this.availableSkins=skins.filter(s=>!s.requires||features.includes(s.requires));this.availableCrates=crates.map(c=>({...c,skinIds:c.skinIds.filter(id=>this.availableSkins.some(s=>s.id===id))}));this.file=path.join(directory,'economy.json');this.db=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{players:{},seen:{}};}
 save(){fs.writeFileSync(this.file+'.tmp',JSON.stringify(this.db),{mode:0o600});fs.renameSync(this.file+'.tmp',this.file);}
 player(id){return this.db.players[id]??={credits:0,inventory:[],equipped:{},history:[],requests:{}};}
 snapshot(id){const p=this.player(id);return {credits:p.credits,inventory:p.inventory.map(i=>({...i,available:this.availableSkins.some(s=>s.id===i.skinId),skin:skins.find(s=>s.id===i.skinId)})),equipped:p.equipped,history:p.history.slice(-20).reverse(),market:marketSnapshot(this,id),skins:this.availableSkins,crates:this.availableCrates,rewards};}
 note(p,type,amount,label){p.history.push({type,amount,label,at:new Date().toISOString()});p.history=p.history.slice(-100);}
 transaction(id,action,body,actor={}){const before=structuredClone(this.db);try{return this.perform(id,action,body,actor);}catch(e){this.db=before;throw e;}}
 perform(id,action,body,actor={}){
  if(!/^[a-f0-9-]{16,64}$/.test(body.requestId||''))throw Error('Invalid transaction identifier.');
  const p=this.player(id);if(p.requests[body.requestId])return p.requests[body.requestId];
  let result;
  if(action==='open'){
   const crate=this.availableCrates.find(c=>c.id===body.crate);if(!crate)throw Error('Unknown crate.');if(p.credits<crate.price)throw Error('Not enough points. Earn more from kills and rounds.');if(p.inventory.length>=500)throw Error('Inventory full. Sell a skin first.');
   const skin=drawCrateSkin(crate,this.random);
   const item={id:randomBytes(16).toString('hex'),skinId:skin.id,createdAt:new Date().toISOString()};p.credits-=crate.price;p.inventory.push(item);this.note(p,'crate',-crate.price,crate.name+' → '+skin.label);result={item:{...item,skin},message:'Opened '+skin.label};
  }else if(['list','buy','cancel'].includes(action)){
   result=trade(this,id,action,body,actor);
  }else if(action==='sell'){
   throw Error('Instant sell-back is disabled. Set a price and list your skin for other players.');
  }else if(action==='equip'){
   const item=p.inventory.find(i=>i.id===body.item);if(!item)throw Error('You do not own that skin.');const skin=skins.find(s=>s.id===item.skinId);if(!this.availableSkins.some(s=>s.id===skin.id))throw Error('This cosmetic model pack is not installed on this host.');p.equipped[skin.weapon]=item.id;result={message:'Equipped '+skin.label+'. Switch weapons to see it in game.'};
  }else if(action==='unequip'){
   if(!equipmentSlots.includes(body.weapon))throw Error('Unknown weapon.');delete p.equipped[body.weapon];result={message:'Original model equipped.'};
  }else throw Error('Unknown action.');
  p.requests[body.requestId]=result;const keys=Object.keys(p.requests);for(const k of keys.slice(0,Math.max(0,keys.length-100)))delete p.requests[k];this.save();return result;
 }
 award(id,event){const p=this.player(id),amount=event.kind==='kill'?(event.bot?rewards.bot:rewards.kill):rewards.round+(event.win?rewards.win:0);p.credits+=amount;this.note(p,'reward',amount,event.kind==='kill'?(event.bot?'Bot elimination':'Player elimination'):(event.win?'Round completed · Win bonus':'Round completed'));}
 consume(room,event,resolve){
  if(!/^[a-f0-9]{16,40}$/.test(event.boot)||!Number.isSafeInteger(event.seq)||event.seq<1||!['kill','round'].includes(event.kind))return false;
  const key=room+':'+event.boot;if(event.seq<=(this.db.seen[key]||0))return false;this.db.seen[key]=event.seq;
  const id=resolve(event.actor);if(id)this.award(id,event);this.save();return !!id;
 }
 selection(id){
  const p=this.player(id),selected=weapon=>{const item=p.inventory.find(i=>i.id===p.equipped[weapon]);return this.availableSkins.find(s=>s.id===item?.skinId)?.variant||0;};
  const glove=selected('gloves');return weapons.map(weapon=>selected(weapon)+glove*6);
 }
}
