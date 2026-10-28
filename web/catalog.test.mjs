import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {crates,skins,crateContents,drawCrateSkin,skinTier} from './catalog.mjs';
import {buildReel,winningSlot,reelOffset} from './public/crate-reel.mjs';
test('server and browser share the same catalog and requested prices',()=>{
 assert.equal(fs.readFileSync(new URL('./catalog.mjs',import.meta.url),'utf8'),fs.readFileSync(new URL('./public/catalog.mjs',import.meta.url),'utf8'));
 assert.equal(crates[0].price,500);assert.equal(crates.find(c=>c.id==='elite').price,750);assert.equal(crates.find(c=>c.id==='elite').name,'Epic crate');assert.equal(crates.length,6);
});
test('all pools have transparent normalized odds and every installed skin is available',()=>{
 const covered=new Set();
 for(const crate of crates){
  assert.equal(crate.odds.reduce((a,b)=>a+b,0),100);
  assert.equal(new Set(crate.skinIds).size,crate.skinIds.length);
  assert(crate.skinIds.every(id=>skins.some(s=>s.id===id)));
  const contents=crateContents(crate);assert(Math.abs(contents.reduce((sum,s)=>sum+s.chance,0)-100)<1e-9);
  for(const s of contents){covered.add(s.id);assert(s.chance>0);}
  // Exhaust all integer rarity rolls and both ends of each weapon pool.
  for(let roll=0;roll<100;roll++)for(const edge of [false,true]){
   let calls=0;const s=drawCrateSkin(crate,n=>calls++===0?roll:edge?n-1:0);
   assert(crate.skinIds.includes(s.id));assert(crate.odds[s.tier-1]>0);
  }
 }
 assert.equal(covered.size,skins.length);
 assert(crateContents(crates.find(c=>c.id==='rifle')).every(s=>['ak47','m4a1'].includes(s.weapon)));
 assert(crateContents(crates.find(c=>c.id==='closequarters')).every(s=>['deagle','knife'].includes(s.weapon)));
});
test('higher broad crates improve rarity and expected resale without allowing point farming',()=>{
 const broad=['field','elite','aurum'].map(id=>crates.find(c=>c.id===id));let previous=0;
 for(const crate of broad){const value=crateContents(crate).reduce((sum,s)=>sum+s.chance*s.sell/100,0);assert(value>previous);assert(value<crate.price);previous=value;}
});
test('the reel lands on the server award, including last-pool skins and mobile sizing',()=>{
 const crate=crates.find(c=>c.id==='elite'),winner=crateContents(crate).at(-1),reel=buildReel(crate,winner,()=>0);
 assert.equal(reel[winningSlot],winner);assert(reel.length>winningSlot+3);assert(reel.every(s=>crate.skinIds.includes(s.id)));
 for(const [width,viewport]of [[150,900],[130,340]]){
  const offset=reelOffset(winningSlot,width,12,viewport);
  assert.equal(offset+winningSlot*(width+12)+width/2,viewport/2);
 }
});

test('knife and glove rarity is always Legendary and low-tier crates never award knives',()=>{
 for(const kind of ['knife','glove','gloves'])for(let variant=1;variant<=4;variant++)assert.equal(skinTier(kind,variant),4);
 for(const skin of skins.filter(s=>s.weapon==='knife')){assert.equal(skin.rarity,'Legendary');assert.equal(skin.tier,4);}
 const field=crates.find(c=>c.id==='field');assert(crateContents(field).every(s=>s.weapon!=='knife'));
 const legendary=crates.find(c=>c.id==='legendary');assert.equal(legendary.price,500);assert.deepEqual(legendary.odds,[0,0,20,80]);
 assert.equal(crateContents(legendary).filter(s=>s.weapon==='knife').length,4);
 for(let roll=0;roll<100;roll++){
  let call=0;const skin=drawCrateSkin(legendary,n=>call++===0?roll:n-1);
  assert.equal(skin.tier,roll<20?3:4);
  if(roll>=20)assert.equal(skin.weapon,'knife');
 }
});
