/** Studio Openings v1.0 — canonical paid placement rules (manual-invoice launch). */
const DAY=86400000;
export const PAID_PLANS=Object.freeze({
 standard:Object.freeze({label:'Standard Job',priceUSD:149,days:30}),
 featured:Object.freeze({label:'Featured Job',priceUSD:349,days:90})
});
export function planOf(value){return Object.prototype.hasOwnProperty.call(PAID_PLANS,value)?PAID_PLANS[value]:null;}
export function publicationEligible(row,now=Date.now()){
 if(!row||row.submission_type!=='employer')return true;
 const plan=planOf(row.order_tier);
 if(!plan||row.order_status!=='paid'||!row.order_published_at)return false;
 const published=Date.parse(String(row.order_published_at).replace(' ','T')+'Z');
 return Number.isFinite(published)&&published<=now+DAY&&now-published<plan.days*DAY;
}
