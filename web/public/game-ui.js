import {setupRecording,setupDirector} from '/record.js';
import {setupBuy} from '/buy.js';
import {entrarAlEquipo} from '/team.js';
const params=new URLSearchParams(location.search);const share=document.getElementById('share-room');
share.onclick=async()=>{const url=new URL('/play',window.CS16_SHARE_ORIGIN||location.href);url.searchParams.set('room',params.get('room'));try{await navigator.clipboard.writeText(url.href);share.textContent='Copied ✓';}catch{window.prompt('Copy this room link:',url.href);}setTimeout(()=>share.textContent='Copy room invite ↗',2500);};
document.getElementById('fullscreen-game').onclick=()=>document.documentElement.requestFullscreen().catch(()=>{});
document.addEventListener('pointerlockchange',()=>document.body.classList.toggle('free-mouse',!document.pointerLockElement));
// The core engine retains the game menu and all standard CS controls.

document.getElementById('form').addEventListener('submit',()=>{entrarAlEquipo(document.getElementById('team').value).then(joined=>{if(joined)document.dispatchEvent(new Event('cs16-team-joined'));}).catch(console.error);});
window.addEventListener('beforeunload',()=>{try{window.xash?.disconnectTransport();}catch{}});

setupBuy();

const eventButton=document.createElement('button');eventButton.id='event-vote';eventButton.textContent='Vote: headcrab wave';document.getElementById('room-tools').prepend(eventButton);
eventButton.onclick=async()=>{
 eventButton.disabled=true;
 try{const r=await fetch('/api/event?sala='+encodeURIComponent(window.cs16Sala)+'&event=headcrabs',{method:'POST',headers:{'X-Game-Session':window.xash?.session||''}});const d=await r.json();const toast=document.getElementById('toast');toast.textContent=d.message||d.error;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),7000);}
 catch{const toast=document.getElementById('toast');toast.textContent='Could not reach the event host.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),5000);}
 finally{eventButton.disabled=false;}
};

const recorder=setupRecording();setupDirector(recorder);

// Use an optional account name as the pre-game nickname; guests can still choose their own.
fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(d=>{const input=document.getElementById('name');if(d.user&&input&&!window.xash?.running)input.value=d.user.username;}).catch(()=>{});

const armory=document.createElement('a');armory.href='/shop.html';armory.target='_blank';armory.rel='noopener';armory.textContent='Armory · Credits';document.getElementById('room-tools').prepend(armory);armory.onclick=()=>document.exitPointerLock?.();
async function updateCredits(){try{const r=await fetch('/api/shop',{cache:'no-store'});if(r.ok){const d=await r.json();armory.textContent='Armory · '+d.credits+' credits';}}catch{}}
updateCredits();setInterval(updateCredits,5000);
