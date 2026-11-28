import {DAY,EMPLOYER_ROWS} from '../lib/job-lifecycle.js';
import {PAID_PLANS} from '../lib/paid-plans.js';
import {INDEXABLE_PAGE_PATHS} from '../lib/public-routes.js';
import {eligibleJob} from '../lib/seo-jobs.js';
import {sourceSeoJob} from '../lib/source-seo-policy.js';
const escapeXML=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function onRequestGet({env}){
 const root='https://s-o.app';
 const paths=new Set(INDEXABLE_PAGE_PATHS);
 // Keep stable pages discoverable when a vacancy lookup fails. Never reuse stale job URLs.
 if(env?.JOBS_DB){
  try{
   const now=Date.now();
   const oldestPublication=new Date(now-PAID_PLANS.featured.days*DAY).toISOString();
   const result=await env.JOBS_DB.prepare(EMPLOYER_ROWS+" WHERE s.status='approved' AND s.submission_type='employer' AND o.status='paid' AND datetime(o.published_at)>=datetime(?) ORDER BY s.id").bind(oldestPublication).all();
   for(const row of result.results||[]){
    const job=eligibleJob(row,now,env.NATIVE_APPLY_ENABLED==='true');
    if(job)paths.add('/jobs/'+encodeURIComponent(job.id));
   }
  }catch{
   console.warn('Sitemap: employer job lookup failed');
  }
 }
 // Source-backed pages are listed only after explicit publication permission,
 // live snapshot verification, and SOURCE_SEO_ENABLED=true. Default stays off.
 if(env?.SOURCE_SEO_ENABLED==='true'&&env?.JOBS_DB){
  try{
   const result=await env.JOBS_DB.prepare("SELECT * FROM reviewed_source_jobs WHERE last_seen_at>=datetime('now','-72 hours') ORDER BY id").all();
   for(const row of result.results||[]){
    const job=sourceSeoJob(row);
    if(job)paths.add('/openings/'+encodeURIComponent(job.id));
   }
  }catch{
   console.warn('Sitemap: source job lookup failed');
  }
 }
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+Array.from(paths,path=>'  <url><loc>'+escapeXML(root+path)+'</loc></url>').join('\n')+'\n</urlset>\n';
 return new Response(xml,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
