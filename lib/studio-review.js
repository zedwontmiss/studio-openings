import {DISCIPLINE_SLUGS} from './discipline-pages.js';
import {outreachHeld} from './outreach-policy.js';
const norm=v=>String(v||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function host(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u.hostname.replace(/^www\./,''):'';}catch{return '';}}
function related(a,b){return !!a&&!!b&&(a===b||a.endsWith('.'+b)||b.endsWith('.'+a));}
function date(v,today){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&v<=today&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
function str(v,min,max){return typeof v==='string'&&v.trim().length>=min&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);}
export function reviewStudio(candidate,review,existing,today){
 const errors=[],check=(v,m)=>{if(!v)errors.push(m);};
 const r=review?.record||{}, aliases=Array.isArray(r.aliases)?r.aliases:[],offices=Array.isArray(r.offices)?r.offices:[];
 check(candidate?.status==='review-required','Candidate conflict or missing');
 check(review?.decision==='approve','Explicit approval required');
 check(str(r.name,1,120)&&norm(r.name)===norm(candidate?.name),'Employer name mismatch');
 check([r.id,r.slug].every(v=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)),'Stable ID and slug required');
 check(related(host(r.website),candidate?.domain),'Official website domain mismatch');
 check(!!host(r.source?.url)&&r.source.url===candidate?.careerURL&&date(r.source.reviewedOn,today),'Reviewed career source required');
 check(str(r.summary,3,100)&&str(r.overview,20,700),'Factual summary and introduction required');
 check(r.employerVerified===false,'Independent review is not employer verification');
 check(Array.isArray(r.disciplines)&&r.disciplines.length>0&&r.disciplines.every(x=>DISCIPLINE_SLUGS.includes(x)),'Valid disciplines required');
 check(Array.isArray(r.aliases)&&aliases.every(x=>str(x,1,120)),'Reviewed aliases required');
 check(offices.length>0,'Verified office required');
 check(related(host(review?.identityEvidence),host(r.website))&&review?.officeEvidenceReviewed===true&&review?.creativeScopeReviewed===true,'Explicit identity, office and scope evidence review required');
 const cities=new Set();
 for(const o of offices){
  check(o&&/^[A-Z]{2}$/.test(o.country||'')&&str(o.region,0,100)&&str(o.city,1,100)&&o.cityId===[o.country,o.region,o.city].map(slug).join('--')&&o.kind==='office','Canonical office geography required');
  if(!o)continue;
  check(related(host(o.sourceUrl),host(r.website))&&date(o.reviewedOn,today),'Official dated office evidence required');
  check(!cities.has(o.cityId),'Duplicate office city');cities.add(o.cityId);
 }
 const names=[r.name,...aliases].map(norm);
 for(const e of existing){
  check(e.id!==r.id&&e.slug!==r.slug,'Existing ID or slug collision');
  check(![e.name,...(e.aliases||[])].some(n=>names.includes(norm(n))),'Existing employer name overlap');
  check(!related(host(e.website||e.source?.url),host(r.website)),'Existing employer domain overlap');
 }
 check(!outreachHeld(r.name,r.website)&&!outreachHeld(r.name,r.source?.url)&&!aliases.some(a=>outreachHeld(a)),'Employer on outreach hold');
 if(errors.length)return {ok:false,errors:[...new Set(errors)]};
 return {ok:true,record:{id:r.id,slug:r.slug,name:r.name,disciplines:[...new Set(r.disciplines)],summary:r.summary,aliases,offices:offices.map(o=>({country:o.country,region:o.region,city:o.city,sourceUrl:o.sourceUrl,reviewedOn:o.reviewedOn,kind:'office',cityId:o.cityId})),source:{url:r.source.url,reviewedOn:r.source.reviewedOn,reviewStatus:'previously-reviewed-career-source'},employerVerified:false,overview:r.overview,jobQuery:r.name,website:r.website}};
}
