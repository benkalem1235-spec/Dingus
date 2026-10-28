import {randomBytes} from 'node:crypto';
import {skins} from './catalog.mjs';
export const maximumPrice=1_000_000;
export function marketSnapshot(economy,id){
 return Object.values(economy.db.market||{}).map(listing=>({id:listing.id,price:listing.price,createdAt:listing.createdAt,seller:listing.sellerName||'Player',mine:listing.seller===id,available:economy.availableSkins.some(s=>s.id===listing.item.skinId),skin:skins.find(s=>s.id===listing.item.skinId)})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function trade(economy,id,action,body,actor={}){
 const market=economy.db.market??={},player=economy.player(id);
 if(action==='list'){
  if(!Number.isSafeInteger(body.price)||body.price<1||body.price>maximumPrice)throw Error('Set a whole-point price from 1 to 1,000,000.');
  if(Object.values(market).filter(l=>l.seller===id).length>=100)throw Error('You can list up to 100 skins at a time.');
  if(Object.keys(market).length>=1000)throw Error('The marketplace is full. Try again later.');
  const index=player.inventory.findIndex(item=>item.id===body.item);if(index<0)throw Error('You do not own that skin, or it is already listed.');
  const item=player.inventory[index],skin=skins.find(s=>s.id===item.skinId);
  if(!economy.availableSkins.some(s=>s.id===skin.id))throw Error('This cosmetic model pack is not installed on this host.');
  player.inventory.splice(index,1);
  if(player.equipped[skin.weapon]===item.id)delete player.equipped[skin.weapon];
  const listing={id:randomBytes(16).toString('hex'),seller:id,sellerName:String(actor.username||'Player').slice(0,32),item,price:body.price,createdAt:new Date().toISOString()};
  market[listing.id]=listing;economy.note(player,'listing',0,skin.label+' · Listed for '+listing.price+' points');
  return {listingId:listing.id,message:'Listed '+skin.label+' for '+listing.price+' points. You receive points when another player buys it.'};
 }
 if(typeof body.listing!=='string'||!/^[a-f0-9]{32}$/.test(body.listing))throw Error('Invalid listing identifier.');
 const listing=market[body.listing];if(!listing)throw Error('That listing is no longer available.');
 const skin=skins.find(s=>s.id===listing.item.skinId);
 if(action==='cancel'){
  if(listing.seller!==id)throw Error('Only the seller can cancel this listing.');
  if(player.inventory.length>=500)throw Error('Inventory full. Make room before cancelling.');
  player.inventory.push(listing.item);delete market[listing.id];economy.note(player,'cancel',0,skin.label+' · Listing cancelled');
  return {message:'Listing cancelled. The skin is back in your collection.'};
 }
 if(action!=='buy')throw Error('Unknown marketplace action.');
 if(listing.seller===id)throw Error('You cannot buy your own listing.');
 if(!economy.availableSkins.some(s=>s.id===skin.id))throw Error('This cosmetic model pack is not installed on this host.');
 if(player.credits<listing.price)throw Error('Not enough points.');
 if(player.inventory.length>=500)throw Error('Inventory full. Make room before buying.');
 const seller=economy.player(listing.seller);
 if(!Number.isSafeInteger(seller.credits+listing.price))throw Error('Seller balance limit reached.');
 // Both balances, the item transfer and listing removal are persisted by one economy transaction.
 player.credits-=listing.price;seller.credits+=listing.price;player.inventory.push(listing.item);delete market[listing.id];
 economy.note(player,'purchase',-listing.price,skin.label+' · Player marketplace');economy.note(seller,'sale',listing.price,skin.label+' · Sold to a player');
 return {message:'Bought '+skin.label+' for '+listing.price+' points.',item:{...listing.item,skin}};
}
