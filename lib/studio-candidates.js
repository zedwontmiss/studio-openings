import {STUDIO_IDENTITIES} from './studio-identities.js';
import {DISCIPLINE_SLUGS} from './discipline-pages.js';
import {outreachHeld} from './outreach-policy.js';
const norm=v=>String(v||'').normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
function host(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.hostname.toLowerCase().replace(/^www\./,''):'';}catch{return '';}}
function related(a,b){return !!a&&!!b&&(a===b||a.endsWith('.'+b)||b.endsWith('.'+a));}
export function studioCandidates(sources,maps,identities=STUDIO_IDENTITIES){
 const groups=new Map();
 for(const s of sources){
  if(s.status!=='approved'||!s.reviewed_at||!s.employer_name||!DISCIPLINE_SLUGS.includes(s.focus)||outreachHeld(s.employer_name,s.official_url))continue;
  const domain=host(s.official_url);if(!domain)continue;
  const key=norm(s.employer_name)+'|'+domain;
  if(!groups.has(key))groups.set(key,{name:s.employer_name,careerURL:s.official_url,domain,sourceIds:[],disciplines:[],vacancyCities:[],existingMatches:[],status:'review-required'});
  const c=groups.get(key);c.sourceIds.push(s.id);if(!c.disciplines.includes(s.focus))c.disciplines.push(s.focus);
  for(const m of maps.filter(m=>m.source_id===s.id)){
   if(!m.city_name||!m.country_code)continue;
   const place={city:m.city_name,region:m.region_name||'',country:m.country_code,sourceCityId:String(m.city_id||'')};
   if(!c.vacancyCities.some(x=>x.city===place.city&&x.region===place.region&&x.country===place.country))c.vacancyCities.push(place);
  }
 }
 const candidates=[...groups.values()];
 for(const c of candidates){
  c.existingMatches=identities.filter(s=>[s.name,...s.aliases].some(n=>norm(n)===norm(c.name))||related(s.careerHost,c.domain)).map(s=>({id:s.id,name:s.name,slug:s.slug}));
  c.status=c.existingMatches.length?'possible-existing':candidates.filter(x=>norm(x.name)===norm(c.name)).length>1||candidates.filter(x=>x.domain===c.domain).length>1?'identity-conflict':'review-required';
 }
 return candidates.sort((a,b)=>a.name.localeCompare(b.name,'en'));
}
