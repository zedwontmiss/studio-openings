import {publicHeader,HEADER_CSS} from '../../lib/public-header.js';
import {sourceSeoJob} from '../../lib/source-seo-policy.js';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const HEAD={'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
export async function onRequestGet({params,env,request}){
 const id=String(params?.id||'');
 if(!/^[a-z0-9-]{8,160}$/i.test(id))return new Response('Job not found',{status:404,headers:{'x-robots-tag':'noindex'}});
 if(env?.SOURCE_SEO_ENABLED!=='true')return new Response('Job not found',{status:404,headers:{'x-robots-tag':'noindex'}});
 if(!env?.JOBS_DB)return new Response('Temporarily unavailable',{status:503,headers:{'x-robots-tag':'noindex'}});
 let row;
 try{
  row=await env.JOBS_DB.prepare("SELECT * FROM reviewed_source_jobs WHERE id=? LIMIT 1").bind(id).first();
 }catch{return new Response('Temporarily unavailable',{status:503,headers:{'x-robots-tag':'noindex'}});}
 const job=sourceSeoJob(row);
 if(!job)return new Response('This job is no longer available',{status:404,headers:{'x-robots-tag':'noindex'}});
 const preview=new URL(request.url).hostname!=='s-o.app',origin='https://s-o.app';
 const paragraphs=job.description.split(/\n\n+/).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="alternate icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<title>${esc(job.title)} at ${esc(job.company)} | Studio Openings</title>
<meta name="description" content="${esc(('Explore the '+job.title+' opening at '+job.company+' in '+job.location+'. Verified source information.').slice(0,155))}">
<link rel="canonical" href="${origin}/openings/${encodeURIComponent(job.id)}">
<style>html{font:14px/1.6 Helvetica,Arial,sans-serif;color:#202020}body{margin:0}main,footer{max-width:760px;margin-left:auto;margin-right:auto;padding-left:20px;padding-right:20px;box-sizing:border-box}main{padding-top:25px;padding-bottom:25px}h1{font-size:27px;line-height:1.25;margin:0 0 6px}.sub{color:#666}.description{border-top:1px solid #ddd;margin-top:22px;padding-top:12px}.description p{margin:0 0 15px}.apply{display:inline-block;padding:11px 17px;background:#111;color:#fff;text-decoration:none;margin:12px 0}footer{border-top:1px solid #ddd;padding-top:20px;padding-bottom:20px;color:#777;font-size:12px}</style>${HEADER_CSS}</head>
<body>${publicHeader('jobs')}<main>
<p class="sub">creative jobs / official careers</p><h1>${esc(job.title)}</h1>
<p>${esc(job.company)} · ${esc(job.location)}</p>
<p class="sub">Verified source: ${esc(job.source)} · Last editorial verification: ${esc(job.verifiedAt)}</p>
<h2>Role description</h2><div class="description">${paragraphs}</div>
<a data-apply-job="${esc(job.id)}" class="apply" href="${esc(job.url)}" target="_blank" rel="noopener noreferrer">View original vacancy &amp; apply</a>
<p class="sub">Recruitment is managed by the original employer. Confirm availability and applicant eligibility on their official site.</p></main>
<footer><a href="/">All creative openings</a> · <a href="/contact.html">Contact</a></footer></body></html>`;
 return new Response(html,{headers:preview?{...HEAD,'x-robots-tag':'noindex, nofollow'}:HEAD});
}
