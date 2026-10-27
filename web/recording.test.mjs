import test from 'node:test';import assert from 'node:assert/strict';
test('director waits for a joined game, splits commands and handles flight keys',async()=>{
 const commands=[],timers=[],events={},keys={},buttons=[];const team={append(){},value:'5'};
 globalThis.location={search:'?director=1'};globalThis.window={xash:{running:false,exited:false,Cmd_ExecuteString:s=>commands.push(s)},addEventListener:(k,fn)=>keys[k]=fn};
 globalThis.document={getElementById:id=>id==='team'?team:null,body:{append(){}},addEventListener:(k,fn)=>events[k]=fn,createElement:tag=>{const x={append(){},querySelectorAll:()=>buttons};if(tag==='button')buttons.push(x);return x;}};
 const originalTimeout=globalThis.setTimeout;globalThis.setTimeout=fn=>{timers.push(fn);return 1};
 try{const {setupDirector}=await import('./public/record.js');setupDirector({toggle(){}});assert.equal(buttons.length,10);assert(buttons.every(b=>b.disabled));assert.equal(timers.length,0);assert.equal(commands.length,0);
 window.xash.running=true;assert.equal(commands.length,0);events['cs16-team-joined']();timers.pop()();assert.deepEqual(commands,['cmd specmode 4','cmd follownext 0']);
 const event=(code,type)=>({code,type,target:{closest:()=>null},preventDefault(){},stopImmediatePropagation(){}});keys.keydown(event('Space','keydown'));keys.keyup(event('Space','keyup'));assert.deepEqual(commands.slice(-2),['+moveup','-moveup']);keys.keydown(event('Digit8','keydown'));assert.deepEqual(commands.slice(-5),['dingus_cam_free','cmd specmode 3','cl_forwardspeed 220','cl_sidespeed 220','cl_upspeed 180']);
 window.xash.exited=true;const n=commands.length;keys.keydown(event('Digit4','keydown'));assert.equal(commands.length,n);
 }finally{globalThis.setTimeout=originalTimeout;}
});
