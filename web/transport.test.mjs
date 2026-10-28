import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture(){
 let now=0;const intervals=new Map(),events=[],connections=[];
 class WS{constructor(){this.readyState=1;this.bufferedAmount=0;connections.push(this)}close(){this.readyState=3}send(data){this.sent=data}}
 const ctx={WebSocket:WS,location:{protocol:'https:',host:'game.test'},window:{cs16Sala:'office'},document:{visibilityState:'visible',dispatchEvent:e=>events.push(e.type)},Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type){this.type=type}},Date:{now:()=>now},setTimeout:()=>1,clearTimeout(){},setInterval:fn=>{intervals.set(2,fn);return 2},clearInterval:id=>intervals.delete(id),encodeURIComponent};
 const C=vm.runInNewContext('(class {'+fs.readFileSync(new URL('./browser-transport.txt',import.meta.url),'utf8')+'})',ctx);
 const engine=new C();engine.received=[];engine.lostPeers=[];engine.receive=b=>engine.received.push(b);engine.lost=ws=>engine.lostPeers.push(ws);
 return {engine,events,connections,ctx,tick(t){now=t;for(const fn of intervals.values())fn()},ready(ws){ws.onmessage({data:JSON.stringify({type:'ready',session:'test'})})}};
}
test('connection allows slow asset loading then detects a stalled packet stream',async()=>{
 const f=fixture(),p=f.engine.connectTransport();const ws=f.connections[0];f.ready(ws);await p;
 f.tick(25000);assert.equal(ws.readyState,1);
 ws.onmessage({data:new ArrayBuffer(4)});assert.equal(f.engine.received.length,1);
 f.tick(46000);assert.equal(ws.readyState,3);assert.equal(f.engine.lostPeers.length,1);assert(f.events.includes('cs16-connection-stalled'));
});
test('congested uploads fail explicitly rather than silently dropping every command',async()=>{
 const f=fixture(),p=f.engine.connectTransport(),ws=f.connections[0];f.ready(ws);await p;
 ws.bufferedAmount=1048576;f.engine.channel.send(new Uint8Array(4));assert.equal(ws.readyState,3);assert.equal(f.engine.lostPeers.length,1);
});
test('a replaced socket cannot inject late packets into the current engine',async()=>{
 const f=fixture(),p=f.engine.connectTransport(),old=f.connections[0];f.ready(old);await p;
 const p2=f.engine.connectTransport(),current=f.connections[1];f.ready(current);await p2;
 old.onmessage({data:new ArrayBuffer(4)});old.onclose();assert.equal(f.engine.received.length,0);assert.equal(f.engine.lostPeers.length,0);
});
