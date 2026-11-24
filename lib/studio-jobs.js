import {STUDIO_IDENTITIES} from './studio-identities.js';
import {readInventory,publicURL} from './public-inventory.js';
import {readSnapshots} from './feed-snapshot.js';
import {outreachHeld} from './outreach-policy.js';
import {esc} from './seo-jobs.js';
const norm=value=>String(value||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
function officialHost(value,host){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.toLowerCase().replace(/^www\./,'')===host;}catch{return false;}
}
export function matchStudio(job,identities=STUDIO_IDENTITIES){
 if(!job||!job.company||outreachHeld(job.company,job.url))return null;
 const company=norm(job.company);
 const candidates=identities.filter(s=>[s.name,...s.aliases].some(name=>norm(name)===company)&&[job.url,job.sourceUrl].some(url=>officialHost(url,s.careerHost)));
 return candidates.length===1?candidates[0].id:null;
}
export function associatedJobs(studioId,batches,now=Date.now()){
 const jobs=[],seen=new Set(),links=new Set();
 for(const batch of batches){
  for(const j of batch.jobs||[]){
   if(matchStudio(j)!==studioId||!j.id||!j.title||!j.location||seen.has(j.id)||j.expiresAt&&!(Date.parse(j.expiresAt)>now))continue;
   if(j.applicationMethod&&j.applicationMethod!=='external')continue;
   const url=publicURL(j.url);if(!url||links.has(url))continue;
   seen.add(j.id);links.add(url);
   jobs.push({id:j.id,title:j.title,location:j.location,type:j.type||'',mode:j.mode||'',salary:j.salary||'',url});
  }
 }
 return jobs;
}
export async function studioJobInventory(context,id){
 const [inventory,snapshots]=await Promise.all([readInventory(context),readSnapshots(context)]);
 return associatedJobs(id,inventory.sources.concat(Object.values(snapshots.sources||{})));
}
export function studioJobsHTML(jobs){
 if(!jobs.length)return '';
 return '<h2>Indexed openings</h2><ul>'+jobs.slice(0,20).map(j=>'<li><a href="'+esc(j.url)+'" rel="noopener noreferrer">'+esc(j.title)+'</a><span class="growth-note"> · '+esc([j.location,j.mode,j.type,j.salary].filter(Boolean).join(' · '))+'</span></li>').join('')+'</ul><p class="growth-note">Matched by employer identity and official source domain. Check the original vacancy for current availability. Coverage is partial.</p>';
}
export async function seedStudioJobs(response,context,slug){
 if(typeof HTMLRewriter==='undefined'||response.status!==200||!response.headers.get('content-type')?.startsWith('text/html'))return response;
 const studio=STUDIO_IDENTITIES.find(s=>s.slug===slug);if(!studio)return response;
 try{
  const html=studioJobsHTML(await studioJobInventory(context,studio.id));if(!html)return response;
  const headers=new Headers(response.headers);headers.delete('content-length');headers.delete('etag');headers.set('cache-control','no-store');
  return new HTMLRewriter().on('#studio-associated-jobs',{element(el){el.setInnerContent(html,{html:true});el.removeAttribute('hidden');}}).transform(new Response(response.body,{status:response.status,statusText:response.statusText,headers}));
 }catch{return response;}
}
