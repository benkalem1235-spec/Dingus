import {drawCrateSkin} from './catalog.mjs';
export const winningSlot=35;
export function buildReel(crate,winner,random=n=>Math.floor(Math.random()*n)){
 const slots=Array.from({length:43},()=>drawCrateSkin(crate,random));
 slots[winningSlot]=winner;
 return slots;
}
export function reelOffset(slot,width,gap,viewport){return viewport/2-(slot*(width+gap)+width/2);}
