const subjects = new Set(['direct','reddit','x','search','other']);
const empty = status => new Response(null,{status,headers:{'cache-control':'no-store'}});
export async function onRequestPost({env,request}) {
  const url=new URL(request.url);
  if (env.TRAFFIC_ENABLED!=='true' || !(url.hostname==='s-o.app' || (url.hostname==='development.studio-openings.pages.dev' && env.PREVIEW_D1_ISOLATED==='true'))) return empty(204);
  if (request.headers.get('DNT')==='1' || request.headers.get('Sec-GPC')==='1') return empty(204);
  if (request.headers.get('Origin')!==url.origin) return empty(403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return empty(415);
  if (Number(request.headers.get('Content-Length'))>512) return empty(413);
  let value;
  try {
    const raw=await request.text(); if(raw.length>512) return empty(413);
    value=JSON.parse(raw);
  } catch { return empty(400); }
  if (!value || !['apply','view','listing'].includes(value.event) || !subjects.has(value.referral) || typeof value.job!=='string' || value.job.length>160) return empty(422);
  const db=env.JOBS_DB;
  try{
    // Store an actual directory ID or a common bucket. Arbitrary input, full
    // URLs, referrer strings and advertising parameters never enter the table.
    let key='';
    if (/^SO-[A-Z0-9-]{6,45}$/.test(value.job)) {
      key=(await db.prepare("SELECT id FROM job_submissions WHERE status='approved' AND id=?").bind(value.job).first())?.id || '';
    } else if (/^registry-[a-z0-9-]{8,151}$/.test(value.job)) {
      key=(await db.prepare("SELECT id FROM source_job_snapshots WHERE state='active' AND id=?").bind(value.job).first())?.id || '';
    }
    const count=event=>db.prepare("INSERT INTO traffic_daily(day,event,referral,job_key) VALUES(date('now'),?,?,?) ON CONFLICT(day,event,referral,job_key) DO UPDATE SET total=total+1").bind(event,value.referral,key);
    const ops=[count(value.event)];
    if(value.event==='view'&&key)ops.push(count('listing'));
    if(value.entry===true && value.event==='view')ops.push(count('visit'));
    ops.push(db.prepare("DELETE FROM traffic_daily WHERE day<date('now','-89 days')"));
    await db.batch(ops);
    return empty(204);
  } catch { return empty(503); }
}
