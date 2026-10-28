import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Economy} from './economy.mjs';
function fixture(run){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dingus-market-'));try{const e=new Economy(dir,()=>0);e.player('seller').credits=500;const item=e.transaction('seller','open',{crate:'field',requestId:'aaaaaaaaaaaaaaaa'}).item;return run(e,item,dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
const requestId='bbbbbbbbbbbbbbbb';
test('a seller sets the price; listing escrows and unequips without paying points',()=>fixture((e,item)=>{
 e.transaction('seller','equip',{item:item.id,requestId:'1111111111111111'});
 const body={item:item.id,price:321,requestId},result=e.transaction('seller','list',body,{username:'Seller One'});
 assert.deepEqual(e.transaction('seller','list',body),result);assert.equal(e.snapshot('seller').credits,0);assert.equal(e.snapshot('seller').inventory.length,0);assert.equal(e.selection('seller')[0],0);
 const listing=e.snapshot('buyer').market[0];assert.equal(listing.price,321);assert.equal(listing.seller,'Seller One');assert.equal(listing.mine,false);assert(!('item' in listing));assert(!JSON.stringify(listing).includes('seller":"seller"'));
 assert.equal(e.snapshot('seller').market[0].mine,true);
 assert.throws(()=>e.transaction('seller','list',{...body,requestId:'cccccccccccccccc'}),/already listed/);
}));
test('purchase transfers one exact copy and points to the seller, survives restart, and cannot be bought twice',()=>fixture((e,item,dir)=>{
 const {listingId}=e.transaction('seller','list',{item:item.id,price:321,requestId});e.player('buyer').credits=500;e.player('other').credits=500;
 const body={listing:listingId,price:1,requestId:'cccccccccccccccc'},result=e.transaction('buyer','buy',body);
 assert.equal(e.snapshot('buyer').credits,179);assert.equal(e.snapshot('seller').credits,321);assert.equal(e.snapshot('buyer').inventory[0].id,item.id);assert.equal(e.snapshot('seller').market.length,0);
 assert.deepEqual(e.transaction('buyer','buy',body),result);assert.equal(e.snapshot('seller').credits,321);
 assert.throws(()=>e.transaction('other','buy',{...body,requestId:'dddddddddddddddd'}),/no longer/);assert.equal(e.snapshot('other').credits,500);
 const restored=new Economy(dir);assert.deepEqual(restored.transaction('buyer','buy',body),result);assert.equal(restored.snapshot('seller').credits,321);assert.equal(restored.snapshot('buyer').inventory.length,1);
}));
test('cancellation returns the copy; only the seller can cancel and self-buy is rejected',()=>fixture((e,item)=>{
 const {listingId}=e.transaction('seller','list',{item:item.id,price:1,requestId});
 assert.throws(()=>e.transaction('buyer','cancel',{listing:listingId,requestId:'cccccccccccccccc'}),/Only the seller/);
 assert.throws(()=>e.transaction('seller','buy',{listing:listingId,requestId:'dddddddddddddddd'}),/own listing/);
 e.transaction('seller','cancel',{listing:listingId,requestId:'eeeeeeeeeeeeeeee'});assert.equal(e.snapshot('seller').inventory[0].id,item.id);assert.equal(e.snapshot('seller').credits,0);
 assert.throws(()=>e.transaction('buyer','buy',{listing:listingId,requestId:'ffffffffffffffff'}),/no longer/);
}));
test('price validation, insufficient funds, full inventory and failed persistence leave trade state unchanged',()=>fixture((e,item)=>{
 for(const price of [0,-1,1.5,NaN,Infinity,'10',1000001])assert.throws(()=>e.transaction('seller','list',{item:item.id,price,requestId}),/whole-point/);
 const {listingId}=e.transaction('seller','list',{item:item.id,price:50,requestId});const body={listing:listingId,requestId:'cccccccccccccccc'};
 assert.throws(()=>e.transaction('buyer','buy',body),/Not enough/);assert.equal(e.snapshot('seller').market.length,1);
 e.player('buyer').credits=100;e.player('buyer').inventory=Array.from({length:500},(_,i)=>({id:'existing'+i,skinId:'ak47_1'}));assert.throws(()=>e.transaction('buyer','buy',body),/Inventory full/);assert.equal(e.snapshot('buyer').credits,100);
 e.player('buyer').inventory=[];const save=e.save;e.save=()=>{throw Error('disk failed')};assert.throws(()=>e.transaction('buyer','buy',body),/disk failed/);e.save=save;assert.equal(e.snapshot('buyer').credits,100);assert.equal(e.snapshot('seller').credits,0);assert.equal(e.snapshot('seller').market.length,1);
}));
