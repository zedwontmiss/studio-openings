import {eligibleJob,toSchema,esc} from '../../lib/seo-jobs.js';
const HEADERS={'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=60','x-content-type-options':'nosniff'};
export async function onRequestGet({params,env,request}){
 const id=String(params?.id||'');
 if(!/^SO-[A-Z0-9-]{6,45}$/i.test(id))return new Response('Job not found',{status:404});
 if(!env?.JOBS_DB)return new Response('Temporarily unavailable',{status:503});
 let row;try{row=await env.JOBS_DB.prepare("SELECT s.id,s.status,s.submission_type,s.job_data,s.reviewed_at,o.tier AS order_tier,o.status AS order_status,o.published_at AS order_published_at FROM job_submissions s LEFT JOIN job_orders o ON o.submission_id=s.id WHERE s.id=? LIMIT 1").bind(id).first();}
 catch{return new Response('Temporarily unavailable',{status:503});}
 const job=eligibleJob(row);
 if(!job)return new Response('This job is no longer available',{status:404,headers:{'X-Robots-Tag':'noindex'}});
 const url=new URL(request.url), origin='https://'+url.hostname;
 const schema=toSchema(job,origin);
 const json=JSON.stringify(schema).replace(/</g,'\\u003c');
 const detail=job.description.split(/\n\n+/).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
 const place=job.location||job.ref.label;
 const auth=job.workAuthorization==='required'?'Work authorization required':job.workAuthorization==='not_required'?'Work authorization not required':'';
 const visa=job.visaSponsorship==='available'?'Visa sponsorship available':job.visaSponsorship==='unavailable'?'No visa sponsorship':'';
 const info=[job.mode,job.type,place,job.eligibility,auth,visa].filter(Boolean).map(x=>'<span>'+esc(x)+'</span>').join(' · ');
 const href=esc(job.applyURL), jobTitle=esc(job.title),company=esc(job.company);
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${jobTitle} at ${company} | Studio Openings</title><meta name="description" content="${esc(('Explore the '+job.title+' opening at '+job.company+'. '+place+'. Read the full job description and apply.').slice(0,155))}">
<link rel="canonical" href="${origin}/jobs/${encodeURIComponent(job.id)}"><script type="application/ld+json">${json}</script>
<style>html{font-family:Arial,Helvetica,sans-serif;color:#202020;font-size:14px;line-height:1.6}body{max-width:760px;padding:0 20px;margin:0 auto}header{padding:18px 0;border-bottom:1px solid #ddd}header a{font-weight:bold;color:#111;text-decoration:none;font-size:16px}main{padding:25px 0}h1{font-size:28px;line-height:1.2;margin:0 0 6px}.company{font-size:16px;margin:0 0 12px}.meta{font-size:12px;color:#666}.description{border-top:1px solid #ddd;margin-top:22px;padding-top:14px;white-space:normal}.description p{margin:0 0 14px}.apply{display:inline-block;margin:18px 0;border:1px solid #222;background:#222;color:white;padding:10px 16px;text-decoration:none;font-size:13px}.fine{font-size:12px;color:#666}footer{border-top:1px solid #ddd;margin-top:36px;padding:20px 0;color:#777;font-size:12px}</style></head>
<body><header><a href="/">studio openings</a></header><main><div class="fine"><a href="/">All creative jobs</a> / Employer opening</div><h1>${jobTitle}</h1><p class="company">${company}</p>
<p class="meta">${info}</p><p class="fine">Published ${esc(job.datePosted)} · Verified employer submission · Visible through ${esc(job.validThrough)}</p>
<h2>Job description</h2><div class="description">${detail}</div>
<a class="apply" href="${href}"${job.applicationMethod==='external'?' target="_blank" rel="noopener noreferrer"':''}>Apply for this job</a>
<p class="fine">Applications are handled by the hiring organization. Confirm the vacancy and eligibility before applying.</p></main>
<footer>Studio Openings · <a href="/privacy.html">Privacy</a></footer></body></html>`;
 return new Response(html,{status:200,headers:HEADERS});
}
