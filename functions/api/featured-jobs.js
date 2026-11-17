/** v0.13 — public, read-only active campaigns. No submitter or payment data. */
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=60','x-content-type-options':'nosniff'};
export async function onRequestGet({env}){
 if(!env?.JOBS_DB)return new Response(JSON.stringify({version:1,placements:[]}),{status:503,headers:HEAD});
 try{
  const r=await env.JOBS_DB.prepare(`SELECT p.submission_id,p.starts_on,p.ends_on FROM premium_campaigns p
    JOIN job_submissions s ON s.id=p.submission_id
    WHERE p.status='active' AND p.starts_on<=date('now') AND p.ends_on>=date('now')
      AND s.status='approved' AND s.submission_type='employer'
    ORDER BY p.starts_on DESC LIMIT 250`).all();
  const placements=(r.results||[]).map(x=>({jobId:'direct-'+String(x.submission_id).toLowerCase(),startsOn:x.starts_on,endsOn:x.ends_on,approved:true}));
  return new Response(JSON.stringify({version:1,placements}),{headers:HEAD});
 }catch{return new Response(JSON.stringify({version:1,placements:[]}),{status:503,headers:{...HEAD,'cache-control':'no-store'}});}
}
