import test from 'node:test';
import assert from 'node:assert/strict';
import {setupRecovery} from './public/recovery.js';
test('graphics loss offers room recovery; recovered transport clears only a connection failure',()=>{
 const listeners={},canvasListeners={},winListeners={},panels=[];
 const create=()=>({style:{},children:[],setAttribute(){},append(child){this.children.push(child)},querySelector(){return this.children[0]},remove(){panels.splice(panels.indexOf(this),1)}});
 const doc={createElement:create,body:{append:p=>panels.push(p)},getElementById:()=>({addEventListener:(type,fn)=>canvasListeners[type]=fn}),addEventListener:(type,fn)=>listeners[type]=fn,exitPointerLock(){}};
 let reloaded=false,tick;const win={location:{reload:()=>reloaded=true},addEventListener:(type,fn)=>winListeners[type]=fn,setInterval:fn=>{tick=fn;return 1},clearInterval(){}};
 setupRecovery({win,doc});listeners['cs16-connection-stalled']({detail:'Connection stalled'});assert.equal(panels.length,1);
 listeners['cs16-connection-restored']();assert.equal(panels.length,0);
 let prevented=false;canvasListeners.webglcontextlost({preventDefault(){prevented=true}});assert(prevented);assert.equal(panels.length,1);
 listeners['cs16-connection-restored']();assert.equal(panels.length,1);panels[0].children[1].onclick();assert(reloaded);
 win.xash={running:true};tick();win.xash.exited=true;tick();assert.equal(panels.length,1);
});
