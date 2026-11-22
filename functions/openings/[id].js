import {sourceSeoJob} from '../../lib/source-seo-policy.js';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const HEAD={'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=180','x-content-type-options':'nosniff'};
export async function onRequestGet({params,env,request}){
 const id=String(params?.id||'');
 if(!/^[a-z0-9-]{8,160}$/i.test(id))return new Response('Job not found',{status:404,headers:{'x-robots-tag':'noindex'}});
 if(env?.SOURCE_SEO_ENABLED!=='true')return new Response('Job not found',{status:404,headers:{'x-robots-tag':'noindex'}});
 if(!env?.JOBS_DB)return new Response('Temporarily unavailable',{status:503,headers:{'x-robots-tag':'noindex'}});
 let row;
 try{
  row=await env.JOBS_DB.prepare("SELECT j.job_json,j.state AS snapshot_state,j.last_seen_at,s.status AS source_status FROM source_job_snapshots j JOIN creative_sources s ON s.id=j.source_id WHERE json_extract(j.job_json,'$.id')=? LIMIT 1").bind(id).first();
 }catch{return new Response('Temporarily unavailable',{status:503,headers:{'x-robots-tag':'noindex'}});}
 const job=sourceSeoJob(row);
 if(!job)return new Response('This job is no longer available',{status:404,headers:{'x-robots-tag':'noindex'}});
 const preview=new URL(request.url).hostname!=='s-o.app',origin='https://s-o.app';
 const paragraphs=job.description.split(/\n\n+/).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(job.title)} at ${esc(job.company)} | Studio Openings</title>
<meta name="description" content="${esc(('Explore the '+job.title+' opening at '+job.company+' in '+job.location+'. Verified source information.').slice(0,155))}">
<link rel="canonical" href="${origin}/openings/${encodeURIComponent(job.id)}">
<style>html{font:14px/1.6 Arial,Helvetica,sans-serif;color:#202020}body{max-width:760px;margin:0 auto;padding:0 20px}header{border-bottom:1px solid #ddd;padding:18px 0}header a{font-size:17px;font-weight:bold;text-decoration:none;color:#111}main{padding:25px 0}h1{font-size:27px;line-height:1.25;margin:0 0 6px}.sub{color:#666}.description{border-top:1px solid #ddd;margin-top:22px;padding-top:12px}.description p{margin:0 0 15px}.apply{display:inline-block;padding:11px 17px;background:#111;color:#fff;text-decoration:none;margin:12px 0}footer{border-top:1px solid #ddd;padding:20px 0;color:#777;font-size:12px}</style></head>
<body><header><a href="/">studio openings</a></header><main>
<p class="sub">creative jobs / official careers</p><h1>${esc(job.title)}</h1>
<p>${esc(job.company)} · ${esc(job.location)}</p>
<p class="sub">Verified source: ${esc(job.source)} · Last editorial verification: ${esc(job.verifiedAt)}</p>
<h2>Role description</h2><div class="description">${paragraphs}</div>
<a class="apply" href="${esc(job.url)}" target="_blank" rel="noopener noreferrer">View original vacancy &amp; apply</a>
<p class="sub">Recruitment is managed by the original employer. Confirm availability and applicant eligibility on their official site.</p></main>
<footer><a href="/">All creative openings</a> · <a href="/contact.html">Contact</a></footer></body></html>`;
 return new Response(html,{headers:preview?{...HEAD,'x-robots-tag':'noindex, nofollow'}:HEAD});
}
