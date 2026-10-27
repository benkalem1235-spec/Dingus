// CSGOMod-style model selection, adapted to a small browser collection.
export const weapons=['ak47','m4a1','deagle','knife'];
export const finishes=[
 {name:'Copper',rarity:'Common',color:'#d26c3e',sell:20},
 {name:'Tidal',rarity:'Rare',color:'#25b8ad',sell:55},
 {name:'Violet',rarity:'Epic',color:'#a450db',sell:150},
 {name:'Aurum',rarity:'Legendary',color:'#ebb736',sell:450}
];
export const skins=weapons.flatMap((weapon,wi)=>finishes.map((f,i)=>({...f,id:weapon+'_'+(i+1),weapon,weaponIndex:wi,variant:i+1,label:({ak47:'AK-47',m4a1:'M4A1',deagle:'Desert Eagle',knife:'Knife'})[weapon]+' · '+f.name})));
export const crates=[{id:'field',name:'Field crate',price:100,odds:[70,25,4,1],description:'A classic finish, with a chance of something rare.'},{id:'elite',name:'Elite crate',price:250,odds:[0,75,22,3],description:'Rare or better. Every weapon in the collection is eligible.'}];
export const rewards={kill:20,bot:5,round:25,win:15};
