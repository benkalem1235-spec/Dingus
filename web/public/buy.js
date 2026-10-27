// CS 1.6 prices and buy aliases; the game remains authoritative for cash/team/buy zones.
export const items=[
 ['ak47','AK-47',2500,'Rifles','T','ak47','Hard-hitting classic · 30 rounds'],
 ['m4a1','M4A1',3100,'Rifles','CT','m4a1','Suppressed precision · 30 rounds'],
 ['galil','Galil',2000,'Rifles','T','galil','Economy rifle · 35 rounds'],
 ['famas','FAMAS',2250,'Rifles','CT','famas','Burst-capable · 25 rounds'],
 ['sg552','SG 552',3500,'Rifles','T','sg552','Scoped assault rifle · 30 rounds'],
 ['aug','AUG',3500,'Rifles','CT','aug','Scoped assault rifle · 30 rounds'],
 ['awp','AWP',4750,'Snipers','ALL','awp','Bolt-action · 10 rounds'],
 ['scout','Scout',2750,'Snipers','ALL','scout','Lightweight sniper · 10 rounds'],
 ['deagle','Desert Eagle',650,'Pistols','ALL','deserteagle','Heavy pistol · 7 rounds'],
 ['usp','USP',500,'Pistols','ALL','usp45','Suppressed sidearm · 12 rounds'],
 ['glock','Glock-18',400,'Pistols','ALL','glock18','Burst sidearm · 20 rounds'],
 ['mp5','MP5 Navy',1500,'SMGs','ALL','mp5','Compact all-rounder · 30 rounds'],
 ['p90','P90',2350,'SMGs','ALL','p90','High-capacity SMG · 50 rounds'],
 ['m3','M3',1700,'Heavy','ALL','m3','Pump shotgun · 8 shells'],
 ['xm1014','XM1014',3000,'Heavy','ALL','xm1014','Automatic shotgun · 7 shells'],
 ['m249','M249',5750,'Heavy','ALL','m249','Support weapon · 100 rounds'],
 ['vesthelm','Kevlar + helmet',1000,'Gear','ALL','kevlar_helmet','Body armor and head protection'],
 ['vest','Kevlar vest',650,'Gear','ALL','kevlar','Body armor only'],
 ['defuser','Defuse kit',200,'Gear','CT','defuser','Faster bomb defusal'],
 ['hegren','HE grenade',300,'Grenades','ALL','hegrenade','High explosive'],
 ['flash','Flashbang',200,'Grenades','ALL','flashbang','Blind opponents · carry up to 2'],
 ['sgren','Smoke grenade',300,'Grenades','ALL','smokegrenade','Cover a crossing or block a sightline']
].map(([alias,name,price,category,team,image,description])=>({alias,name,price,category,team,image,description}));
const presets=[
 {name:'T rifle kit',team:'T',list:['ak47','vesthelm','hegren','flash','sgren'],note:'AK-47 + armor + utility'},
 {name:'CT rifle kit',team:'CT',list:['m4a1','vesthelm','defuser','hegren','flash','sgren'],note:'M4A1 + armor + kit + utility'},
 {name:'AWP kit',team:'ALL',list:['awp','deagle','vesthelm'],note:'AWP + Deagle + armor'},
 {name:'Budget kit',team:'ALL',list:['mp5','vest','flash'],note:'MP5 + vest + flashbang'}
];
const byAlias=new Map(items.map(i=>[i.alias,i]));
const money=n=>'$'+n.toLocaleString('en-US');
let category='Rifles',filter='ALL',cart=new Set(),last=[],busy=false,chatTyping=false;
let dialog;
const $=id=>document.getElementById(id);
function command(text){if(window.xash?.running)window.xash.Cmd_ExecuteString(text);}
function status(text){$('buy-feedback').textContent=text;}
function draw(){
 const root=$('buy-grid');root.replaceChildren();
 const search=$('buy-search').value.toLowerCase().trim();
 const visible=items.filter(i=>(category==='All'||i.category===category)&&(!search||(i.name+' '+i.description).toLowerCase().includes(search))&&(filter==='ALL'||i.team==='ALL'||i.team===filter));
 for(const i of visible){
  const b=document.createElement('button');b.type='button';b.className='weapon'+(cart.has(i.alias)?' selected':'');b.setAttribute('aria-pressed',String(cart.has(i.alias)));b.setAttribute('aria-label',`Select ${i.name}, ${money(i.price)}, ${i.team==='ALL'?'both teams':i.team}`);
  const meta=document.createElement('div');meta.className='weapon-meta';const team=document.createElement('span');team.textContent=i.team==='ALL'?'BOTH TEAMS':i.team+' ONLY';team.className=i.team.toLowerCase();const price=document.createElement('strong');price.textContent=money(i.price);meta.append(team,price);
  const img=document.createElement('img');img.src='/weapons/'+i.image+'.png';img.alt='';
  const name=document.createElement('h3');name.textContent=i.name;const desc=document.createElement('p');desc.textContent=i.description;const add=document.createElement('span');add.className='weapon-add';add.textContent=cart.has(i.alias)?'✓ Selected':'+ Add to loadout';
  b.append(meta,img,name,desc,add);b.onclick=()=>{cart.has(i.alias)?cart.delete(i.alias):cart.add(i.alias);draw();};root.append(b);
 }
 if(!visible.length)root.textContent='No weapons match this filter.';
 for(const b of document.querySelectorAll('[data-buy-category]'))b.setAttribute('aria-pressed',String(b.dataset.buyCategory===category));
 const selected=[...cart].map(a=>byAlias.get(a));$('buy-total').textContent=money(selected.reduce((n,i)=>n+i.price,0));$('buy-count').textContent=selected.length+' selected';$('buy-selected').disabled=!selected.length||busy;
 $('buy-cart').textContent=selected.length?selected.map(i=>i.name).join(' · '):'Choose a weapon or a loadout to get started.';
}
async function purchase(aliases){
 if(busy)return;if(!window.xash?.running)return status('Join a match first.');busy=true;draw();
 try{
  const valid=aliases.filter(a=>byAlias.has(a));if(!valid.length)return;
  command('cancelselect');
  for(const alias of valid){command(alias);await new Promise(r=>setTimeout(r,90));}
  command('primammo');command('secammo');last=valid;try{localStorage.setItem('cs16:last-buy',JSON.stringify(last));}catch{}
  const cost=valid.reduce((n,a)=>n+byAlias.get(a).price,0);
  status('Selected: '+valid.map(a=>byAlias.get(a).name).join(', ')+'. Purchases require enough cash and an active buy zone.');
  $('buy-repeat').disabled=false;
 }finally{busy=false;draw();}
}
function close(resume=false){dialog.close();document.getElementById('canvas')?.focus();if(resume)document.getElementById('canvas')?.requestPointerLock?.()?.catch?.(()=>{});}
export function openBuy(){
 if(!window.xash?.running)return;
 for(const cmd of ['-forward','-back','-moveleft','-moveright','-attack','-attack2'])command(cmd);
 document.exitPointerLock?.();command('cancelselect');if(!dialog.open)dialog.showModal();draw();
}
export function setupBuy(){
 const css=document.createElement('link');css.rel='stylesheet';css.href='/buy.css';document.head.append(css);
 dialog=document.createElement('dialog');dialog.id='buy-dialog';dialog.setAttribute('aria-labelledby','buy-heading');
 dialog.innerHTML=`<header class="buy-head"><div><div class="buy-eyebrow">WEAPONS</div><h2 id="buy-heading">Buy weapons</h2></div><button id="buy-close" aria-label="Close buy menu">×</button></header><div class="buy-layout"><aside><div class="buy-team"><label for="buy-team">Weapon roster</label><select id="buy-team"><option value="ALL">Both teams</option><option value="CT">Counter-Terrorists</option><option value="T">Terrorists</option></select></div><nav id="buy-categories" aria-label="Weapon categories"></nav><div class="buy-rule">Buy while alive in your team’s buy zone. Team restrictions and your cash apply.</div></aside><section class="buy-main"><div class="buy-topline"><input id="buy-search" type="search" aria-label="Search weapons" placeholder="Search weapons…"><button id="buy-repeat" disabled>↻ Repeat last buy</button></div><div id="buy-presets" class="buy-presets"></div><div id="buy-grid" class="buy-grid"></div></section></div><footer class="buy-foot"><div class="buy-summary"><span id="buy-count">0 selected</span><strong id="buy-total">$0</strong><small>+ ammo</small><p id="buy-cart"></p></div><button id="buy-selected" disabled>Buy selected ↗</button><button id="buy-resume">Back to game</button></footer><div id="buy-feedback" role="status">Weapon prices are shown before ammo. Armor upgrades can cost less if you already have armor.</div>`;
 document.body.append(dialog);
 for(const c of ['All','Pistols','SMGs','Rifles','Snipers','Heavy','Grenades','Gear']){const b=document.createElement('button');b.dataset.buyCategory=c;b.textContent=c;b.onclick=()=>{category=c;draw();};$('buy-categories').append(b);}
 for(const p of presets){const b=document.createElement('button');b.className='buy-preset';b.innerHTML='<strong></strong><span></span><small></small>';b.querySelector('strong').textContent=p.name;b.querySelector('span').textContent=money(p.list.reduce((n,a)=>n+byAlias.get(a).price,0))+' + ammo';b.querySelector('small').textContent=p.note;b.onclick=()=>{filter=p.team;$('buy-team').value=filter;cart=new Set(p.list);category='All';$('buy-search').value='';draw();status(p.name+' selected. Review it, then click Buy selected.');};$('buy-presets').append(b);}
 try{last=JSON.parse(localStorage.getItem('cs16:last-buy')||'[]').filter(a=>byAlias.has(a));}catch{}$('buy-repeat').disabled=!last.length;
 $('buy-close').onclick=()=>close();$('buy-resume').onclick=()=>close(true);$('buy-selected').onclick=()=>purchase([...cart]);$('buy-repeat').onclick=()=>{cart=new Set(last);draw();purchase(last);};
 $('buy-search').oninput=()=>{if($('buy-search').value)category='All';draw();};$('buy-team').onchange=()=>{filter=$('buy-team').value;draw();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 window.addEventListener('keydown',e=>{
  const input=/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||'');
  if(dialog.open){e.stopImmediatePropagation();if(e.code==='Escape'){e.preventDefault();close();}return;}
  if(input||!document.body.classList.contains('playing'))return;
  if(['Enter','Escape'].includes(e.code))chatTyping=false;
  if(!chatTyping&&['KeyY','KeyU'].includes(e.code))chatTyping=true;
  if(e.code==='KeyB'&&!chatTyping&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)openBuy();}
 },true);
 window.addEventListener('keyup',e=>{if(dialog.open||(e.code==='KeyB'&&!chatTyping)){e.stopImmediatePropagation();}},true);
 const button=document.createElement('button');button.id='buy-open';button.textContent='Buy weapons [B]';button.onclick=openBuy;$('room-tools').prepend(button);
 draw();
}
