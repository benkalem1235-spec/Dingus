const cmd=s=>{const x=window.xash;if(x?.running&&!x.exited)for(const c of s.split(';'))if(c.trim())x.Cmd_ExecuteString(c.trim());};
export function downloadClip(blob){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='dingus-'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm';a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);}
export async function recordClip({seconds=30,hideChat=true,hideHud=false,maskChat=true,onComplete=downloadClip,onState=()=>{}}={}){
 if(!window.xash?.running)throw Error('Join a room before recording.');
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw Error('Recording unavailable in this browser.');
 const source=document.getElementById('canvas');
 const output=document.createElement('canvas');output.width=Math.min(source.width,1280);output.height=Math.round(output.width*source.height/source.width);const ctx=output.getContext('2d',{alpha:false});let raf,done=false,timer,chunks=[];
 if(hideHud)cmd('hud_draw 0');
 if(hideChat)cmd('hud_saytext 0; hud_saytext_internal 0; hud_saytext_console 0; con_notifytime 0');
 const draw=()=>{if(done)return;ctx.drawImage(source,0,0,output.width,output.height);if(hideChat&&maskChat){ctx.fillStyle='#10140f';ctx.fillRect(0,Math.floor(output.height*.68),Math.ceil(output.width*.64),Math.ceil(output.height*.27));}raf=requestAnimationFrame(draw)};draw();
 const stream=output.captureStream(24),mime=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t)),r=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2600000});const stop=()=>{if(r.state!=='inactive')r.stop()};
 r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};r.onstop=async()=>{done=true;clearTimeout(timer);cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());if(hideChat)cmd('hud_saytext 1; hud_saytext_internal 1; hud_saytext_console 1; con_notifytime 3');if(hideHud)cmd('hud_draw 1');onState('saving');try{await onComplete(new Blob(chunks,{type:mime}));onState('saved')}catch(e){onState(e.message)}};
 r.onerror=()=>{done=true;clearTimeout(timer);cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());if(hideChat)cmd('hud_saytext 1; hud_saytext_internal 1; hud_saytext_console 1; con_notifytime 3');onState('Recording failed. Try a shorter clip.');};
 r.start(500);timer=setTimeout(stop,Math.min(seconds,90)*1000);onState('recording');return {stop};
}
export function setupRecording(){
 const b=document.createElement('button');b.id='record-clip';b.textContent='Record clip';document.getElementById('room-tools').append(b);
 const d=document.createElement('dialog');d.className='record-dialog';d.innerHTML='<form method="dialog"><h2>Capture your round.</h2><p>Video only. Saved to your device.</p><label>Clip length <select><option value="15">15 seconds</option><option value="30" selected>30 seconds</option><option value="60">60 seconds</option></select></label><label><input type="checkbox" checked> Hide chat in the saved video</label><small>The chat area is covered, including messages already on screen.</small><div><button value="cancel">Cancel</button><button type="button" id="record-start">Start recording</button></div></form>';document.body.append(d);let active;
 const start=async()=>{if(active)return active.stop();d.close();try{active=await recordClip({seconds:Number(d.querySelector('select').value),hideChat:d.querySelector('input').checked,onState:s=>{b.textContent=s==='recording'?'● Stop & save clip':s==='saving'?'Saving…':s==='saved'?'Clip saved ✓':s;if(s!=='recording'&&s!=='saving'){active=null;setTimeout(()=>b.textContent='Record clip',3500)}}})}catch(e){b.textContent=e.message;active=null}};
 b.onclick=()=>{if(active)return active.stop();document.exitPointerLock?.();d.showModal()};d.querySelector('#record-start').onclick=start;return {toggle:start};
}
export function setupDirector(recorder){
 if(new URLSearchParams(location.search).get('director')!=='1')return;
 const team=document.getElementById('team'),o=document.createElement('option');o.value='6';o.textContent='Spectator / camera';team.append(o);team.value='6';
 const bar=document.createElement('div');bar.id='director-tools';bar.innerHTML='<strong>DIRECTOR KEYS</strong><span>Fly: WASD · SPACE up · F down · Mouse look</span>';
 let ready=false;
 const actions=[['1','Spectate',()=>{cmd('kill');setTimeout(()=>{cmd('jointeam 6');setTimeout(()=>cmd('cmd specmode 4; cmd follownext 0'),500)},400)}],['2','Next player',()=>cmd('dingus_cam_free; cmd follownext 0')],['3','First person',()=>cmd('dingus_cam_free; cmd specmode 4')],['4','Chase camera',()=>cmd('dingus_cam_free; cmd specmode 1')],['5','Pan left',()=>cmd('dingus_cam_free; cmd specmode 3; cl_yawspeed 14; +left')],['6','Stop pan',()=>cmd('-left; cl_yawspeed 210')],['7','Record / stop',recorder.toggle],['8','Fly camera',()=>cmd('dingus_cam_free; cmd specmode 3; cl_forwardspeed 220; cl_sidespeed 220; cl_upspeed 180')],['9','Aerial A',()=>cmd('dingus_cam_a')],['0','Aerial B',()=>cmd('dingus_cam_b')]];
 for(const [key,label,fn] of actions){const b=document.createElement('button');b.innerHTML='<kbd>'+key+'</kbd> '+label;b.onclick=()=>{if(ready)fn()};b.disabled=true;if(key==='1')b.title='Switching from a live team ends your current life.';bar.append(b)}document.body.append(bar);
 const intercept=e=>{if(e.target.closest?.('input,select,textarea,dialog')||!ready||!window.xash?.running||window.xash.exited)return;if(e.code==='Space'||e.code==='KeyF'){e.preventDefault();e.stopImmediatePropagation();cmd((e.type==='keydown'?'+':'-')+(e.code==='Space'?'moveup':'movedown'));return;}const a=actions.find(a=>e.code==='Digit'+a[0]||e.code==='Numpad'+a[0]);if(!a)return;e.preventDefault();e.stopImmediatePropagation();if(e.type==='keydown'&&!e.repeat)a[2]()};window.addEventListener('keydown',intercept,true);window.addEventListener('keyup',intercept,true);
 document.addEventListener('cs16-team-joined',()=>{ready=true;for(const b of bar.querySelectorAll('button'))b.disabled=false;setTimeout(()=>cmd('cmd specmode 4; cmd follownext 0'),500);});
}
