import {eligibleJob} from '../lib/seo-jobs.js';
const escapeXML=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function onRequestGet({request,env}){
 const canonical=(env?.PUBLIC_CANONICAL_HOST||'studio-openings.pages.dev').toLowerCase().trim();
 const host=/^[a-z0-9.-]+$/.test(canonical)?canonical:'studio-openings.pages.dev';
 const root='https://'+host;
 const rows=[{url:root+'/'},{url:root+'/privacy.html'}];
 if(env?.JOBS_DB){
  try{const r=await env.JOBS_DB.prepare("SELECT id,status,submission_type,job_data,reviewed_at FROM job_submissions WHERE status='approved' AND submission_type='employer' ORDER BY reviewed_at DESC LIMIT 250").all();
   const now=Date.now();
   for(const row of r.results||[]){const j=eligibleJob(row,now);if(j)rows.push({url:root+'/jobs/'+encodeURIComponent(j.id),lastmod:j.datePosted});}
  }catch{ /* Jobs are optional, never invent public URLs. */ }
 }
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+rows.map(x=>'  <url><loc>'+escapeXML(x.url)+'</loc>'+(x.lastmod?'<lastmod>'+x.lastmod+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n';
 return new Response(xml,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'public, max-age=300','x-content-type-options':'nosniff'}});
}
