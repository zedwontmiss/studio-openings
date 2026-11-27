import {STUDIO_IDENTITIES} from './studio-identities.js';
import {validDate} from './editorial-draft.js';
export function cleanPlacement(x){
 if(!x||!STUDIO_IDENTITIES.some(s=>s.id===x.studioId)||!validDate(x.startsOn)||!validDate(x.endsOn)||x.endsOn<x.startsOn||Date.parse(x.endsOn)-Date.parse(x.startsOn)>365*86400000||!Number.isSafeInteger(x.amountCents)||x.amountCents<1||x.amountCents>100000000)return null;
 // Independent published articles must never be converted into sponsored content.
 return {studioId:x.studioId,startsOn:x.startsOn,endsOn:x.endsOn,amountCents:x.amountCents};
}
export function publicPlacements(rows,today){
 return rows.filter(r=>r.state==='active'&&r.payment_reference&&cleanPlacement({studioId:r.studio_id,startsOn:r.starts_on,endsOn:r.ends_on,amountCents:r.amount_cents})&&r.starts_on<=today&&r.ends_on>=today).map(r=>({path:'/studio/'+STUDIO_IDENTITIES.find(s=>s.id===r.studio_id).slug,endsOn:r.ends_on}));
}
