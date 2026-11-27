// S/O Index v1: internal rubric, not a public ranking or commercial score.
export const VERSION='1.0';
export const DIMENSIONS=Object.freeze([
 {id:'originality',group:'relevance',weight:40,label:'Originality of work'},
 {id:'body-of-work',group:'relevance',weight:35,label:'Distinctive body of work'},
 {id:'cultural-contribution',group:'relevance',weight:25,label:'Cultural contribution'},
 {id:'recent-output',group:'momentum',weight:40,label:'Recent original output'},
 {id:'independent-initiative',group:'momentum',weight:35,label:'Recent self-initiated work'},
 {id:'creative-exchange',group:'momentum',weight:25,label:'Recent collaboration or exchange'}
]);
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const cleanText=(x,min,max)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max&&!/[\u0000-\u001f\u007f]/.test(x);
function source(x){try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port;}catch{return false;}}
export function assessIndex(record,today){
 if(!day(today)||!record||record.version!==VERSION||!day(record.reviewedOn)||record.reviewedOn>today||!record.criteria||typeof record.criteria!=='object'||Array.isArray(record.criteria))return null;
 if(Object.keys(record.criteria).some(k=>!DIMENSIONS.some(d=>d.id===k)))return null;
 const groups={relevance:{coverage:0,total:0},momentum:{coverage:0,total:0}},criteria={};
 const cutoff=new Date(Date.parse(today)-365*86400000).toISOString().slice(0,10);
 for(const d of DIMENSIONS){
  const c=record.criteria[d.id];if(c==null)continue;
  if(!Number.isInteger(c.level)||c.level<0||c.level>4||!cleanText(c.reason,20,600)||!Array.isArray(c.evidence)||!c.evidence.length||c.evidence.length>5)return null;
  const evidence=[];const seen=new Set();
  for(const e of c.evidence){
   if(!e||!source(e.url)||seen.has(e.url)||!['official','independent'].includes(e.kind)||!day(e.checkedOn)||e.checkedOn>record.reviewedOn||!cleanText(e.claim,10,400))return null;
   if(d.group==='momentum'&&(!day(e.eventOn)||e.eventOn>today||e.eventOn<cutoff))return null;
   seen.add(e.url);evidence.push({url:e.url,kind:e.kind,checkedOn:e.checkedOn,claim:e.claim.trim(),...(d.group==='momentum'?{eventOn:e.eventOn}:{})});
  }
  // High scores require corroboration, not simply more self-published material.
  if(c.level>=3&&(!evidence.some(e=>e.kind==='official')||!evidence.some(e=>e.kind==='independent')||new Set(evidence.map(e=>new URL(e.url).hostname.replace(/^www\./,''))).size<2))return null;
  criteria[d.id]={level:c.level,reason:c.reason.trim(),evidence};
  groups[d.group].coverage+=d.weight;groups[d.group].total+=d.weight*c.level/4;
 }
 const stale=Date.parse(today)-Date.parse(record.reviewedOn)>180*86400000;
 const result={version:VERSION,reviewedOn:record.reviewedOn,criteria,stale};
 for(const k of Object.keys(groups)){const g=groups[k];result[k]={coverage:g.coverage,score:!stale&&g.coverage===100?Math.round(g.total):null};}
 return result;
}
