import {STUDIO_PATHS} from '../lib/studio-routes.js';
import {ARTICLE_PATHS} from '../lib/editorial-routes.js';
import {EMPLOYER_ROWS} from '../lib/job-lifecycle.js';
import {eligibleJob} from '../lib/seo-jobs.js';
import {DISCIPLINE_SLUGS} from '../lib/discipline-pages.js';
import {sourceSeoJob} from '../lib/source-seo-policy.js';
const escapeXML=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function onRequestGet({request,env}){
 const root='https://s-o.app';
 const rows=[{url:root+'/'},{url:root+'/privacy'},{url:root+'/coverage'},{url:root+'/post-a-job'},{url:root+'/advertise'},{url:root+'/about'},{url:root+'/contact'},{url:root+'/terms'}];
 for(const path of ["/studio","/article",...ARTICLE_PATHS,...STUDIO_PATHS])rows.push({url:root+path});
 for(const slug of DISCIPLINE_SLUGS)rows.push({url:root+'/disciplines/'+slug});
 if(env?.JOBS_DB){
  try{const r=await env.JOBS_DB.prepare(EMPLOYER_ROWS+" WHERE s.status='approved' AND s.submission_type='employer' AND s.reviewed_at>=datetime('now','-31 days') ORDER BY s.id").all();
   const now=Date.now();
   for(const row of r.results||[]){const j=eligibleJob(row,now,env.NATIVE_APPLY_ENABLED==='true');if(j)rows.push({url:root+'/jobs/'+encodeURIComponent(j.id),lastmod:j.datePosted});}
  }catch{return new Response('Sitemap temporarily unavailable',{status:503});}
 }
 // Source-backed pages are listed only after explicit publication permission,
 // live snapshot verification, and SOURCE_SEO_ENABLED=true. Default stays off.
 if(env?.SOURCE_SEO_ENABLED==='true'&&env?.JOBS_DB){
  try{
   const result=await env.JOBS_DB.prepare("SELECT * FROM reviewed_source_jobs WHERE last_seen_at>=datetime('now','-72 hours') ORDER BY id").all();
   const seen=new Set();
   for(const row of result.results||[]){
    const job=sourceSeoJob(row);
    if(job&&!seen.has(job.id)){
     rows.push({url:root+'/openings/'+encodeURIComponent(job.id)});
     seen.add(job.id);
    }
   }
  }catch{return new Response('Sitemap temporarily unavailable',{status:503});}
 }
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+rows.map(x=>'  <url><loc>'+escapeXML(x.url)+'</loc>'+(x.lastmod?'<lastmod>'+x.lastmod+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n';
 return new Response(xml,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
