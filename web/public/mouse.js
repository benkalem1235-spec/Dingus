export function setupMouseCapture(doc=document,win=window){
 const canvas=doc.getElementById('canvas');if(!canvas)return;
 const tools=doc.getElementById('room-tools'),button=doc.createElement('button');button.id='lock-mouse';button.textContent='Lock mouse';tools?.prepend(button);
 const prompt=doc.createElement('button');prompt.id='mouse-capture-prompt';prompt.type='button';prompt.textContent='Click to lock mouse · Esc releases it';doc.body.append(prompt);
 const active=()=>doc.body.classList.contains('playing')&&!doc.querySelector('dialog[open]');
 let requesting=false;
 function update(){const locked=doc.pointerLockElement===canvas;doc.body.classList.toggle('free-mouse',!locked);prompt.hidden=locked||!active();button.hidden=locked;if(locked){requesting=false;try{if(win.xash?.running&&!win.xash.exited){win.xash.Cmd_ExecuteString('m_ignore 0');win.xash.Cmd_ExecuteString('+mlook');}}catch{}}}
 function failed(){requesting=false;prompt.textContent='Mouse not locked · Click again, or open the game in Chrome / Firefox';update();}
 function capture(){
  if(!active()||doc.pointerLockElement===canvas||requesting)return;
  const request=canvas.requestPointerLock||canvas.webkitRequestPointerLock;if(!request){failed();return;}
  canvas.focus();requesting=true;
  try{const result=request.call(canvas);if(result?.then)result.then(()=>{requesting=false;update();}).catch(failed);else requesting=false;}catch{failed();}
 }
 canvas.addEventListener('pointerdown',e=>{if(e.button===0)capture();});button.onclick=prompt.onclick=capture;
 doc.addEventListener('pointerlockchange',update);doc.addEventListener('pointerlockerror',failed);doc.addEventListener('cs16-team-joined',update);
 // The engine may start before its team-join callback; visibility follows the playing class too.
 const observer=new win.MutationObserver(update);observer.observe(doc.body,{attributes:true,attributeFilter:['class']});update();
 return {capture,update};
}
