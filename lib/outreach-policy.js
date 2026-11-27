import {SELECTED_SOURCING_RULES} from './selected-sourcing-rules.js';
// Owner-confirmed active paid-listing outreach. Keep these employers out of
// automatically sourced inventory until the outreach decision is resolved.
// This is an operational hold, not a claim that the employer has no vacancies.
export const OUTREACH_HOLDS=Object.freeze([
  {name:'Koto',aliases:['koto','koto studio'],hosts:['koto.com','koto.studio'],boards:[]},
  {name:'Runway',aliases:['runway','runway ml','runwayml'],hosts:['runwayml.com'],boards:['runway-ml']},
  {name:'Linear',aliases:['linear'],hosts:['linear.app'],boards:['linear']}
]);
function key(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/[.,_-]+/g,' ').replace(/\s+/g,' ').trim();}
export function outreachHeld(name,url=''){
  const company=key(name);let parsed;try{parsed=new URL(url);}catch{/* Company match is sufficient. */}
  return OUTREACH_HOLDS.concat(SELECTED_SOURCING_RULES).some(hold=>hold.aliases.some(alias=>key(alias)===company)||parsed&&(
    hold.hosts.some(host=>parsed.hostname===host||parsed.hostname.endsWith('.'+host))||
    parsed.hostname==='jobs.ashbyhq.com'&&(hold.boards||[]).includes(parsed.pathname.split('/')[1])
  ));
}
export const SOURCED_FEEDS=new Set(['/api/jobs','/api/ai-jobs','/api/source-jobs','/api/firm-jobs','/api/editorial-jobs','/api/indexed-jobs','/api/direct-jobs']);
export async function applyOutreachPolicy(response,pathname){
  if(!SOURCED_FEEDS.has(pathname)||response.status!==200)return response;
  const data=await response.clone().json();if(!Array.isArray(data.jobs))return response;
  data.jobs=data.jobs.filter(job=>!outreachHeld(job.company,job.url));
  if(Array.isArray(data.sources))data.sources=data.sources.filter(name=>!outreachHeld(String(name).replace(/^Official careers · /,'')));
  const headers=new Headers(response.headers);headers.delete('content-length');headers.delete('etag');
  return new Response(JSON.stringify(data),{status:response.status,headers});
}
