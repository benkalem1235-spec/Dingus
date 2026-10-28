import {crates,finishes,crateContents} from '/catalog.mjs';
import {buildReel,winningSlot,reelOffset} from '/crate-reel.mjs';
const $=id=>document.getElementById(id);let state=null,busy=false,pendingSell=null,spin=null;
const say=s=>$('shop-status').textContent=s;
const button=(text,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.onclick=fn;return b;};
function art(s){const el=document.createElement('div');el.className='skin-art';el.style.setProperty('--finish',s.color);if(s.weapon==='knife'){const span=document.createElement('span');span.className='knife-symbol';span.textContent='†';el.append(span);}else{const img=document.createElement('img');img.src='/weapons/'+({deagle:'deserteagle'}[s.weapon]||s.weapon)+'.png';img.alt=s.label;img.style.filter='sepia(1) saturate(2.2) hue-rotate('+({1:-20,2:125,3:235,4:0}[s.variant]||0)+'deg)';el.append(img);}return el;}
async function refresh(){try{const r=await fetch('/api/shop',{cache:'no-store'});if(r.status===401){state=null;$('guest').hidden=false;render();return;}if(!r.ok)throw Error('Could not load the armory.');state=await r.json();$('guest').hidden=true;render();}catch(e){say(e.message);}}
async function transact(action,body){if(busy)return;busy=true;render();try{
 const requestId=crypto.randomUUID();const payload=JSON.stringify({...body,requestId});let r;
 // One retry uses the same ID: a lost response cannot charge or sell twice.
 for(let n=0;n<2;n++){try{r=await fetch('/api/shop/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:payload});break;}catch(e){if(n)throw e;}}
 const d=await r.json();if(!r.ok)throw Error(d.error||'Transaction failed.');state=d;say(d.message);if(action==='open'){const crate=(state.crates||crates).find(c=>c.id===body.crate);try{await animateOpening(crate,d.item);}catch{say('Your finish has been saved in your collection.');}showResult(d.item);}return d;
 }catch(e){say(e.message||'Could not reach the shop.');}finally{busy=false;render();}}
function oddsFor(crate){const odds=document.createElement('div');odds.className='odds';finishes.forEach((f,i)=>{if(!crate.odds[i])return;const label=document.createElement('span');label.textContent=f.rarity+' '+crate.odds[i]+'%';label.style.color=f.color;odds.append(label);});return odds;}
function preview(crate){
 $('contents-title').textContent=crate.name;
 $('contents-description').textContent=crate.description;
 $('contents-odds').replaceChildren(oddsFor(crate));
 $('contents-list').replaceChildren();
 for(const skin of crateContents(crate)){
  const card=document.createElement('article');card.className='skin-card preview-card';card.style.setProperty('--finish',skin.color);
  const title=document.createElement('h3');title.textContent=skin.label;
  const rarity=document.createElement('small');rarity.textContent=skin.rarity;
  const chance=document.createElement('p');chance.className='skin-chance';chance.textContent=Number(skin.chance.toFixed(2))+'% drop chance';
  card.append(art(skin),rarity,title,chance);$('contents-list').append(card);
 }
 const open=$('contents-open');open.textContent=!state?'Sign in to open':state.credits<crate.price?'Need '+(crate.price-state.credits)+' more points':'Open · '+crate.price+' points';
 open.disabled=busy||!state||state.credits<crate.price;
 open.onclick=()=>{$('contents-dialog').close();transact('open',{crate:crate.id});};
 $('contents-dialog').showModal();
}
async function animateOpening(crate,item){
 const dialog=$('opening-dialog'),track=$('reel-track'),viewport=$('reel-viewport');
 $('opening-title').textContent=crate.name;track.replaceChildren();track.style.transform='translateX(0px)';
 for(const skin of buildReel(crate,item.skin)){
  const card=document.createElement('div');card.className='reel-card';card.style.setProperty('--finish',skin.color);
  const label=document.createElement('strong');label.textContent=skin.label;
  const rarity=document.createElement('small');rarity.textContent=skin.rarity;card.append(art(skin),label,rarity);track.append(card);
 }
 dialog.showModal();
 try{
  const width=track.firstElementChild.getBoundingClientRect().width,gap=parseFloat(getComputedStyle(track).gap)||0;
  const start=reelOffset(2,width,gap,viewport.clientWidth),end=reelOffset(winningSlot,width,gap,viewport.clientWidth);
  spin=track.animate([{transform:`translateX(${start}px)`},{transform:`translateX(${end}px)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?150:4600,easing:'cubic-bezier(.12,.72,.15,1)',fill:'forwards'});
  $('opening-skip').onclick=()=>spin?.finish();
  await spin.finished;
 }finally{spin?.cancel();spin=null;dialog.close();}
}
$('opening-dialog').addEventListener('cancel',event=>{event.preventDefault();spin?.finish();});
$('contents-close').onclick=()=>$('contents-dialog').close();
function showResult(item){const s=item.skin;$('result').style.setProperty('--finish',s.color);$('result-art').replaceChildren(art(s));$('result-title').textContent=s.label;$('result-rarity').textContent=s.rarity+' · Sell-back value '+s.sell+' points';$('result-equip').onclick=async()=>{await transact('equip',{item:item.id});$('result').close();};$('result').showModal();}
function render(){
 $('balance').textContent=state?.credits?.toLocaleString()??'0';$('item-count').textContent=state?.inventory?.length??0;
 $('crate-list').replaceChildren();for(const c of (state?.crates||crates)){const card=document.createElement('article');card.className='crate-card '+c.id;card.style.setProperty('--crate-color',c.color);
 const visual=document.createElement('div');visual.className='crate-art';const crateImage=document.createElement('img');crateImage.src='/crate-'+c.id+'.svg';crateImage.alt=c.name;crateImage.className='crate-render';visual.append(crateImage);const h=document.createElement('h3');h.textContent=c.name;const p=document.createElement('p');p.textContent=c.description;const odds=oddsFor(c);const b=button(busy?'Working…':!state?'Sign in to open':state.credits<c.price?'Need '+(c.price-state.credits)+' more points':'Open · '+c.price+' points',()=>transact('open',{crate:c.id}),'primary crate-buy');b.disabled=busy||!state||state.credits<c.price;const contents=button('View contents · '+crateContents(c).length+' skins',()=>preview(c),'crate-contents');card.append(visual,h,p,odds,contents,b);$('crate-list').append(card);}
 $('inventory-list').replaceChildren();let list=state?.inventory||[];if($('weapon-filter').value!=='all')list=list.filter(i=>i.skin.weapon===$('weapon-filter').value);
 for(const item of list){const s=item.skin,card=document.createElement('article');card.className='skin-card';card.style.setProperty('--finish',s.color);const rarity=document.createElement('small');rarity.textContent=s.rarity.toUpperCase();const h=document.createElement('h3');h.textContent=s.label;const actions=document.createElement('div');actions.className='skin-actions';const equipped=state.equipped[s.weapon]===item.id;const eq=button(equipped?'Equipped · Restore original':'Equip',()=>transact(equipped?'unequip':'equip',equipped?{weapon:s.weapon}:{item:item.id}),equipped?'equipped':'');const sell=button('Sell · '+s.sell,()=>{pendingSell=item;$('sell-description').textContent=s.label+' → '+s.sell+' points';$('sell-dialog').showModal();});eq.disabled=sell.disabled=busy;actions.append(eq,sell);card.append(art(s),rarity,h,actions);$('inventory-list').append(card);}
 if(!list.length){const p=document.createElement('p');p.className='shop-note';p.textContent='No finishes here yet. Play a few rounds, then open your first crate.';$('inventory-list').append(p);}
 $('history-list').replaceChildren();for(const e of state?.history||[]){const row=document.createElement('div');row.className='history-row';const text=document.createElement('span');text.textContent=e.label;const time=document.createElement('small');time.textContent=new Date(e.at).toLocaleString();text.append(time);const amount=document.createElement('strong');amount.textContent=(e.amount>0?'+':'')+e.amount+' points';row.append(text,amount);$('history-list').append(row);}
}
for(const b of document.querySelectorAll('[data-panel]'))b.onclick=()=>{for(const t of document.querySelectorAll('[data-panel]'))t.classList.toggle('active',t===b);for(const panel of document.querySelectorAll('.shop-panel'))panel.hidden=panel.id!==b.dataset.panel;};
$('weapon-filter').onchange=render;$('result-close').onclick=$('result-keep').onclick=()=>$('result').close();$('sell-cancel').onclick=()=>$('sell-dialog').close();$('sell-confirm').onclick=async()=>{const item=pendingSell;$('sell-dialog').close();if(item)await transact('sell',{item:item.id});};
refresh();setInterval(()=>{if(!busy&&!document.hidden)refresh();},5000);
