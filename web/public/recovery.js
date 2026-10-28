// A lost WebGL/WASM instance cannot safely be reused. Keep recovery outside the engine.
export function setupRecovery({win=window,doc=document}={}){
 let panel,wasRunning=false,fatal=false;
 function show(message,isFatal=true){
  fatal=fatal||isFatal;
  if(!panel){
   panel=doc.createElement('div');panel.id='game-recovery';panel.setAttribute('role','alert');
   Object.assign(panel.style,{position:'fixed',inset:'0',zIndex:'10000',background:'#10140ff5',color:'#fff',display:'grid',placeContent:'center',gap:'16px',padding:'24px',textAlign:'center'});
   const text=doc.createElement('p');text.className='recovery-message';panel.append(text);
   const retry=doc.createElement('button');retry.textContent='Reconnect to this room';retry.onclick=()=>win.location.reload();panel.append(retry);
   const hub=doc.createElement('a');hub.href='/hub.html';hub.textContent='Return to game hub';panel.append(hub);doc.body.append(panel);
  }
  panel.querySelector('.recovery-message').textContent=message;
  doc.exitPointerLock?.();
 }
 const canvas=doc.getElementById('canvas');
 canvas?.addEventListener('webglcontextlost',event=>{event.preventDefault();show('The graphics device stopped responding. Reconnect to resume your game.');});
 win.addEventListener('error',event=>{if(/out of memory|memory access out of bounds|unreachable|abort\(/i.test(event.message||''))show('The game engine stopped. Reconnect to resume your game.');});
 win.addEventListener('unhandledrejection',event=>{if(/out of memory|memory access out of bounds|unreachable|abort\(/i.test(String(event.reason)))show('The game engine stopped. Reconnect to resume your game.');});
 doc.addEventListener('cs16-connection-stalled',event=>show(event.detail,false));
 doc.addEventListener('cs16-connection-restored',()=>{if(panel&&!fatal){panel.remove();panel=null;}});
 const timer=win.setInterval(()=>{const engine=win.xash;if(engine?.running)wasRunning=true;if(wasRunning&&engine?.exited)show('The game engine stopped. Reconnect to resume your game.');},2000);
 return ()=>win.clearInterval(timer);
}
