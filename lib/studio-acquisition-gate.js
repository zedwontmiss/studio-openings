// Offline qualification only. Evidence must be independently reviewed by an operator.
const markets=new Set('US CA GB AU SG NL DE FR FI DK SE NO CH BE AT IT ES PT IE NZ'.split(' '));
const norm=x=>String(x||'').trim().toLowerCase();
function validDate(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;}
function host(x){try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u.hostname.replace(/^www\./,''):'';}catch{return '';}}
function official(a,b){return !!a&&!!b&&(a===b||a.endsWith('.'+b)||b.endsWith('.'+a));}
export function qualifyStudio(record,review,today){
 const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg);};
 const r=record||{},v=review||{},h=host(r.website);
 check(validDate(today),'Invalid review date');
 const evidence=e=>!!e&&official(host(e.url),h)&&validDate(e.reviewedOn)&&e.reviewedOn<=today&&e.confirmed===true;
 const offices=Array.isArray(r.offices)?r.offices:[];
 check(offices.length>0,'Office required');
 for(const o of offices){const allowed=markets.has(o.country)||(o.country==='JP'&&norm(o.city)==='tokyo')||(o.country==='KR'&&norm(o.city)==='seoul');check(allowed||v.geographyException?.approved===true&&typeof v.geographyException.reason==='string'&&v.geographyException.reason.trim().length>=20,'Geography requires explicit exception');}
 check(evidence(v.identity)&&evidence(v.portfolio)&&evidence(v.operatingStatus),'Reviewed official identity, portfolio and operating status required');
 const y=r.foundingYear,year=Number(String(today).slice(0,4));
 check(Number.isInteger(y)&&y>=1800&&y<=year&&evidence(v.founding),'Documented founding year required');
 let young=Number.isInteger(y)&&y>year-10&&y<=year;
 if(y===year-10&&validDate(v.foundingDate)&&Number(v.foundingDate.slice(0,4))===y){young=v.foundingDate.slice(5)>today.slice(5);}
 if(v.foundingDate)check(validDate(v.foundingDate)&&Number(v.foundingDate.slice(0,4))===y&&v.foundingDate<=today,'Founding date inconsistent');
 check(young||v.establishedException?.approved===true&&typeof v.establishedException.reason==='string'&&v.establishedException.reason.trim().length>=20,'Under-ten-year priority requires exception or exact boundary date');
 check(!r.foundingYearNote||v.foundingConflictResolved===true,'Resolve conflicting founding evidence');
 const kinds=new Set(['recruitment','commercial-work','team-growth','funded-development','sponsorship-fit','editorial','community','collaboration']);
 const relationships=Array.isArray(v.relationships)?v.relationships:[];
 check(relationships.some(x=>kinds.has(x.kind)&&evidence(x)&&typeof x.rationale==='string'&&x.rationale.trim().length>=20),'Evidence-backed relationship opportunity required');
 for(const x of relationships)if(x.kind==='recruitment')check(validDate(x.vacancyPostedOn)&&x.vacancyPostedOn<=today&&Date.parse(today)-Date.parse(x.vacancyPostedOn)<=90*86400000&&x.activeConfirmed===true,'Recruitment requires current dated vacancy evidence');
 return {ok:errors.length===0,errors:[...new Set(errors)]};
}
