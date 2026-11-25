import {vacancyLinkKey} from './vacancy-identity.js';
import {publicURL,readInventory} from './public-inventory.js';
import {outreachHeld} from './outreach-policy.js';
import {esc} from './seo-jobs.js';
// Only exact city plus corroborating country or region. Never equate remote eligibility with an office.
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const countryNames={US:['united states','usa','us'],CA:['canada','ca'],GB:['united kingdom','uk','gb','england'],AU:['australia','au']};
const regionAliases={'new-york':['ny'],'los-angeles':['ca'],'san-francisco':['ca'],chicago:['il'],london:['greater london'],montreal:['qc'],melbourne:['vic'],portland:['or'],toronto:['on'],vancouver:['bc'],victoria:['bc']};
export function matchesLocalJob(j,c){
 if(!j||!c||!countryNames[c.country]||norm(j.mode)==='remote'||norm(j.locationKind)==='eligibility'||norm(j.locationReference?.kind)==='eligibility')return false;
 const loc=norm(j.location);if(/\b(remote|worldwide|global|eligible)\b/.test(loc))return false;
 const reported=[j.geoCountry,j.locationReference?.countryCode].filter(Boolean).map(v=>String(v).toUpperCase());if(reported.some(v=>v!==c.country))return false;
 const parts=loc.split(',').map(v=>v.trim()),tail=parts.slice(1),aliases=c.slug==='new-york'?['new york','new york city','nyc']:[norm(c.city)];
 const regions=[norm(c.region),...(regionAliases[c.slug]||[])],countries=countryNames[c.country];
 if(!aliases.includes(parts[0])||tail.some(v=>!regions.includes(v)&&!countries.includes(v)))return false;
 if(c.country==='US'&&tail.length===1&&tail[0]==='ca'&&!reported.length)return false;
 return !!reported.length||tail.some(v=>regions.includes(v)||countries.includes(v));
}
export function selectLocalJobs(inventory,city,now=Date.now()){
 const jobs=[],seen=new Set(),links=new Set();
 for(const batch of inventory?.sources||[])for(const j of batch.jobs||[]){
  if(!matchesLocalJob(j,city)||!j.id||!j.title||!j.company||seen.has(j.id)||outreachHeld(j.company,j.url)||j.expiresAt&&!(Date.parse(j.expiresAt)>now))continue;
  // Only authorized canonical detail pages, or direct public external vacancy links.
  const detail=typeof j.detailUrl==='string'&&/^\/(?:jobs\/SO-[A-Z0-9-]{6,45}|openings\/[a-z0-9-]{8,160})$/i.test(j.detailUrl)?j.detailUrl:'';
  const href=detail||((!j.applicationMethod||j.applicationMethod==='external')?publicURL(j.url):'');
  const key=vacancyLinkKey(j)||href;if(!href||links.has(key))continue;seen.add(j.id);links.add(key);
  jobs.push({title:j.title,company:j.company,href,location:j.location});
  if(jobs.length===12)return jobs;
 }return jobs;
}
export function localJobsHTML(jobs){
 return jobs.length?'<ul class="local-job-preview">'+jobs.map(j=>'<li><a href="'+esc(j.href)+'">'+esc(j.title)+'</a><small>'+esc(j.company)+' · '+esc(j.location)+'</small></li>').join('')+'</ul><p class="scene-crumb">Selected openings from available sources. Confirm availability on the original posting.</p>':'';
}
export async function previewCityJobs(context,city){
 if(context.env?.PREVIEW_D1_ISOLATED!=='true'||!context.env?.JOBS_DB)return [];
 try{return selectLocalJobs(await readInventory(context),city);}catch{return [];}
}
