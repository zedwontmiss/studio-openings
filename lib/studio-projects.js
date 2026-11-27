// Project evidence is independent of advertising, ranking and publication.
const types=new Set(['canonical-project','owned-platform','original-product','research','cultural-initiative']);
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text=(x,min,max)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max&&!/[\u0000-\u001f\u007f]/.test(x);
function date(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;}
function url(x){try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u:null;}catch{return null;}}
function normalized(x){const u=url(x);if(!u)return '';u.hash='';u.search='';return u.hostname.replace(/^www\./,'')+u.pathname.replace(/\/$/,'');}
export function validateStudioProjects(records,studios,today){
 const errors=[],ids=new Set(),keys=new Set(),studioIds=new Set(studios.map(s=>s.id));
 const check=(ok,msg)=>{if(!ok)errors.push(msg);};
 if(!Array.isArray(records))return {ok:false,errors:['Expected project array']};
 check(date(today),'Invalid assessment date');
 for(const p of records){
  if(!p||typeof p!=='object'){errors.push('Invalid project');continue;}
  const label=String(p.id||'unknown');
  const c=(ok,msg)=>check(ok,label+': '+msg);
  c(typeof p.id==='string'&&slug.test(p.id)&&!ids.has(p.id),'Unique stable ID required');ids.add(p.id);
  c(Array.isArray(p.studioIds)&&p.studioIds.length>0&&new Set(p.studioIds).size===p.studioIds.length&&p.studioIds.every(id=>studioIds.has(id)),'Known credited studio IDs required');
  c(types.has(p.type),'Unknown project type');
  c(text(p.title,1,180)&&text(p.summary,20,600),'Original factual title and summary required');
  c(!!url(p.url),'HTTPS project source required');
  const key=normalized(p.url);c(!keys.has(key),'Duplicate project URL');keys.add(key);
  c(['candidate','reviewed','retired'].includes(p.status),'Unknown evidence status');
  c(['owner','creator','collaborator','commissioned','unknown'].includes(p.relationship),'Explicit studio relationship required');
  if(p.type==='owned-platform')c(p.relationship==='owner','Platform ownership must be explicit');
  c(Array.isArray(p.evidence)&&p.evidence.length>0&&p.evidence.every(e=>e&&url(e.url)&&['official','independent'].includes(e.kind)&&date(e.reviewedOn)&&e.reviewedOn<=today&&text(e.claim,10,400)),'Dated evidence required');
  if(p.status==='reviewed')c(p.relationship!=='unknown'&&p.evidence?.some(e=>e.kind==='official')&&p.reviewConfirmed===true,'Reviewed official attribution required');
  if(p.year!==undefined)c(Number.isInteger(p.year)&&p.year>=1800&&p.year<=Number(today.slice(0,4)),'Invalid project year');
  c(!('score'in p)&&!('salesPriority'in p)&&!('contact'in p),'Private assessments excluded');
 }
 return {ok:errors.length===0,errors};
}
