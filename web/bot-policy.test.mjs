import {test} from 'node:test';
import assert from 'node:assert/strict';
import {populationTarget,botCommands} from './bot-policy.mjs';
test('every map keeps the configured playable capacity without population churn',()=>{
 for(const map of ['de_dust2','cs_office','arena_officecomplex','unknown']){
  for(const phase of [0,1,2,100])assert.equal(populationTarget(map,12,phase),12);
 }
 assert.equal(populationTarget('',32),31);
 assert.equal(populationTarget('',4),4);
});
test('fill replaces humans, keeps a connection slot and adapts bots alongside humans',()=>{
 const commands=botCommands(12);
 for(const cmd of ['yb_quota 12','yb_quota_mode fill','yb_autovacate_keep_slots 1','yb_kick_after_player_connect 1','yb_difficulty_auto 2','yb_join_after_player 1'])assert(commands.includes(cmd));
});
