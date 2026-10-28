// CSGOMod-style model selection, adapted to a small browser collection.
export const weapons=['ak47','m4a1','deagle','knife'];
export const finishes=[
 {name:'Copper',rarity:'Common',color:'#d26c3e',sell:20},
 {name:'Tidal',rarity:'Rare',color:'#25b8ad',sell:55},
 {name:'Violet',rarity:'Epic',color:'#a450db',sell:150},
 {name:'Aurum',rarity:'Legendary',color:'#ebb736',sell:450}
];
// Item rarity is separate from the model variant: every knife/glove finish is Legendary.
export function skinTier(weapon,variant){return ['knife','glove','gloves'].includes(weapon)?4:variant;}
const baseSkins=weapons.flatMap((weapon,wi)=>finishes.map((f,i)=>{
 const tier=skinTier(weapon,i+1);
 return {...f,id:weapon+'_'+(i+1),weapon,weaponIndex:wi,variant:i+1,tier,rarity:finishes[tier-1].rarity,rarityColor:finishes[tier-1].color,label:({ak47:'AK-47',m4a1:'M4A1',deagle:'Desert Eagle',knife:'Knife'})[weapon]+' · '+f.name};
}));
export const equipmentSlots=[...weapons,'gloves'];
export const skins=[...baseSkins,
 {id:'knife_butterfly',name:'Butterfly',label:'Butterfly Knife · Vanilla',weapon:'knife',weaponIndex:3,variant:5,tier:4,rarity:'Legendary',rarityColor:'#ebb736',color:'#e0c982',sell:450,requires:'butterfly'},
 {id:'gloves_crimson',name:'Crimson Web',label:'Gloves · Crimson Web',weapon:'gloves',variant:1,tier:4,rarity:'Legendary',rarityColor:'#ebb736',color:'#cf4e50',sell:250,requires:'gloves'},
 {id:'gloves_steel',name:'Blue Steel',label:'Gloves · Blue Steel',weapon:'gloves',variant:2,tier:4,rarity:'Legendary',rarityColor:'#ebb736',color:'#6195ba',sell:250,requires:'gloves'}
];
const pool = (eligibleWeapons, tiers) => skins.filter(s => eligibleWeapons.includes(s.weapon) && tiers.includes(s.tier)).map(s => s.id);
export const crates=[
 {id:'field',name:'Field crate',price:500,color:'#d2a65a',odds:[65,35,0,0],skinIds:pool(weapons,[1,2]),description:'Your first collection. Copper and Tidal gun finishes. Knives drop only as Legendary.'},
 {id:'rifle',name:'Rifle crate',price:600,color:'#6ab783',odds:[25,50,20,5],skinIds:pool(['ak47','m4a1'],[1,2,3,4]),description:'AK-47 and M4A1 only. Every finish, from Copper to Aurum.'},
 {id:'closequarters',name:'Close Quarters crate',price:600,color:'#60bcd4',odds:[25,50,20,5],skinIds:pool(['deagle','knife'],[1,2,3,4]),description:'Desert Eagle finishes, plus knives in the Legendary drop pool.'},
 // Keep the original elite ID so bookmarked clients and transaction history stay compatible.
 {id:'elite',name:'Epic crate',price:750,color:'#b785ed',odds:[0,35,55,10],skinIds:pool(equipmentSlots,[2,3,4]),description:'Rare or better, with a 55% chance of an Epic Violet finish.'},
 {id:'aurum',name:'Aurum crate',price:1000,color:'#efc24e',odds:[0,0,80,20],skinIds:pool(equipmentSlots,[3,4]),description:'Epic or Legendary only. A 20% Legendary chance, including knives.'},
 {id:'legendary',name:'Legendary crate',price:500,color:'#f6c651',odds:[0,0,20,80],skinIds:pool(equipmentSlots,[3,4]),description:'80% Legendary, 20% Epic. Legendary drops include all four knife finishes.'}
];
export function crateContents(crate){
 const ids=new Set(crate.skinIds);
 return skins.filter(s=>ids.has(s.id)&&crate.odds[s.tier-1]>0).map(s=>{
  const count=skins.filter(other=>ids.has(other.id)&&other.tier===s.tier).length;
  return {...s,chance:crate.odds[s.tier-1]/count};
 });
}
// Use a cryptographic integer generator on the server; browser draws are decorative only.
export function drawCrateSkin(crate,random){
 let roll=random(100),rarity=0;
 while(rarity<crate.odds.length-1&&roll>=crate.odds[rarity])roll-=crate.odds[rarity++];
 const candidates=crateContents(crate).filter(s=>s.tier===rarity+1);
 if(!candidates.length)throw Error('Crate has no eligible skins for this rarity.');
 return candidates[random(candidates.length)];
}
export const rewards={kill:20,bot:5,round:25,win:15};
