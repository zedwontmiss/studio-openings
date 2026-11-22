import {eligibleJob} from '../lib/seo-jobs.js';
import {DISCIPLINE_SLUGS} from '../lib/discipline-pages.js';
import {sourceSeoJob} from '../lib/source-seo-policy.js';
const escapeXML=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function onRequestGet({request,env}){
 const canonical=(env?.PUBLIC_CANONICAL_HOST||'studio-openings.pages.dev').toLowerCase().trim();
 const host=/^[a-z0-9.-]+$/.test(canonical)?canonical:'studio-openings.pages.dev';
 const root='https://'+host;
 const rows=[{url:root+'/'},{url:root+'/privacy.html'},{url:root+'/coverage.html'},{url:root+'/post-a-job.html'},{url:root+'/about.html'},{url:root+'/contact.html'},{url:root+'/terms.html'}];
 for(const slug of DISCIPLINE_SLUGS)rows.push({url:root+'/disciplines/'+slug});
 if(env?.JOBS_DB){
  try{const r=await env.JOBS_DB.prepare("SELECT s.id,s.status,s.submission_type,s.job_data,s.created_at,s.reviewed_at,o.tier AS order_tier,o.status AS order_status,o.published_at AS order_published_at FROM job_submissions s LEFT JOIN job_orders o ON o.submission_id=s.id WHERE s.status='approved' AND s.submission_type='employer' ORDER BY s.reviewed_at DESC LIMIT 250").all();
   const now=Date.now();
   for(const row of r.results||[]){const j=eligibleJob(row,now);if(j)rows.push({url:root+'/jobs/'+encodeURIComponent(j.id),lastmod:j.datePosted});}
  }catch{ /* Jobs are optional, never invent public URLs. */ }
 }
 // Source-backed pages are listed only after explicit publication permission,
 // live snapshot verification, and SOURCE_SEO_ENABLED=true. Default stays off.
 if(env?.SOURCE_SEO_ENABLED==='true'&&env?.JOBS_DB){
  try{
   const result=await env.JOBS_DB.prepare("SELECT j.job_json,j.state AS snapshot_state,j.last_seen_at,s.status AS source_status FROM source_job_snapshots j JOIN creative_sources s ON s.id=j.source_id WHERE j.state='active' AND s.status='approved' AND j.last_seen_at>=datetime('now','-72 hours') ORDER BY j.last_seen_at DESC LIMIT 200").all();
   const seen=new Set();
   for(const row of result.results||[]){
    const job=sourceSeoJob(row);
    if(job&&!seen.has(job.id)){
     rows.push({url:root+'/openings/'+encodeURIComponent(job.id)});
     seen.add(job.id);
    }
   }
  }catch{ /* Never expose unverified or unavailable source jobs. */ }
 }
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+rows.map(x=>'  <url><loc>'+escapeXML(x.url)+'</loc>'+(x.lastmod?'<lastmod>'+x.lastmod+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n';
 return new Response(xml,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'public, max-age=300','x-content-type-options':'nosniff'}});
}
