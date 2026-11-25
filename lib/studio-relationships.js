export const STAGES=['uncontacted','researching','editorial-prospect','commercial-prospect','contacted','replied','in-discussion','partner','closed'];
export const INTENTS=['undecided','editorial','recruitment','sponsorship','premium-coverage'];
export const CHANNELS=['email','contact-form','meeting','other'];
export const EVENT_TYPES=['note','outreach-sent','reply-received','meeting','proposal','opt-out'];
export function validDay(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;}
function field(x,n){return typeof x==='string'&&x.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x);}
export function cleanRelationship(x){
 if(!x||!STAGES.includes(x.stage)||!INTENTS.includes(x.intent)||typeof x.doNotContact!=='boolean')return null;
 for(const [k,n] of Object.entries({contactPage:300,notes:1500,nextFollowup:10}))if(!field(x[k],n))return null;
 if(x.contactPage){try{const u=new URL(x.contactPage);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;}catch{return null;}}
 if(x.nextFollowup&&!validDay(x.nextFollowup))return null;
 return {stage:x.stage,intent:x.intent,contactPage:x.contactPage.trim(),notes:x.notes.trim(),nextFollowup:x.doNotContact?'':x.nextFollowup,doNotContact:x.doNotContact};
}
export function cleanRelationshipEvent(x,today){
 if(!x||!EVENT_TYPES.includes(x.kind)||!field(x.summary,600)||!x.summary.trim()||!validDay(x.happenedOn)||x.happenedOn>today)return null;
 return {kind:x.kind,summary:x.summary.trim(),happenedOn:x.happenedOn};
}
