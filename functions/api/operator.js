/** Studio Openings v1.0 — owner-only editorial + manual invoice workflow.
 * Access: 32+ character OPERATOR_ACCESS_TOKEN (Cloudflare Secret).
 * Public employer publication is impossible without a paid job_orders record.
 * No payment provider, credit-card fields, automated invoicing, or email sending.
 */
import {planOf} from '../../lib/paid-plans.js';
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'no-store, private','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEAD});
const fail=(status,message)=>reply({ok:false,error:message},status);
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function goodDate(s){return typeof s==='string'&&DATE.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
function equal(a,b){const e=new TextEncoder(),x=e.encode(a),y=e.encode(b);let d=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);return d===0;}
function auth(req,env){const key=env?.OPERATOR_ACCESS_TOKEN;return typeof key==='string'&&key.length>=32&&equal(req.headers.get('authorization')||'','Bearer '+key);}
function originOK(req){const origin=req.headers.get('origin');if(!origin)return false;try{return new URL(origin).origin===new URL(req.url).origin;}catch{return false;}}
const idOf=x=>typeof x==='string'&&/^SO-[A-Z0-9-]{6,45}$/i.test(x)?x:'';
function cleanSubmission(row){let job={};try{job=JSON.parse(row.job_data||'{}')||{};}catch{}
 return {id:row.id,status:row.status,kind:row.submission_type,title:row.job_title,company:row.company,
  email:row.contact_email,createdAt:row.created_at,reviewedAt:row.reviewed_at||'',
  featuredRequested:row.order_tier==='featured',postingPackage:row.order_tier||'',
  priceUSD:row.price_usd||0,paymentStatus:row.order_status||'',
  reviewConfirmedAt:row.order_reviewed_at||'',invoiceSentAt:row.invoice_sent_at||'',paymentConfirmedAt:row.payment_confirmed_at||'',
  paymentReference:row.payment_reference||'',publishedAt:row.order_published_at||'',
  applicationURL:row.application_url||'',closesOn:job.closesOn||'',location:job.location||'',role:job.role||'',
  mode:job.mode||'',companyWebsite:job.companyWebsite||'',description:job.description||''};
}
async function list(env){
 const [submissions,campaigns]=await Promise.all([
  env.JOBS_DB.prepare("SELECT s.id,s.status,s.submission_type,s.job_title,s.company,s.application_url,s.contact_email,s.job_data,s.created_at,s.reviewed_at,o.tier AS order_tier,o.price_usd,o.status AS order_status,o.review_confirmed_at AS order_reviewed_at,o.invoice_sent_at,o.payment_confirmed_at,o.payment_reference,o.published_at AS order_published_at FROM job_submissions s LEFT JOIN job_orders o ON o.submission_id=s.id WHERE s.status IN ('pending','approved') ORDER BY s.created_at DESC LIMIT 150").all(),
  env.JOBS_DB.prepare('SELECT submission_id,status,tier,starts_on,ends_on,payment_confirmed_at,updated_at FROM premium_campaigns ORDER BY updated_at DESC LIMIT 150').all()
 ]);
 return reply({ok:true,submissions:(submissions.results||[]).map(cleanSubmission),campaigns:(campaigns.results||[]).map(x=>({submissionId:x.submission_id,status:x.status,tier:x.tier,startsOn:x.starts_on,endsOn:x.ends_on,paymentConfirmedAt:x.payment_confirmed_at,updatedAt:x.updated_at})),premiumLimit:10,payments:'manual invoice and independent reconciliation; no card payment',automaticEmails:false});
}
async function action(env,input){
 if(!input||typeof input!=='object'||Array.isArray(input))return fail(422,'Invalid action.');
 const id=idOf(input.id);if(!id)return fail(422,'Invalid submission reference.');
 const row=await env.JOBS_DB.prepare("SELECT s.id,s.status,s.submission_type,s.job_data,o.tier,o.price_usd,o.status AS payment_status,o.review_confirmed_at,o.invoice_sent_at,o.payment_confirmed_at,o.published_at FROM job_submissions s LEFT JOIN job_orders o ON o.submission_id=s.id WHERE s.id=? LIMIT 1").bind(id).first();
 if(!row)return fail(404,'Submission not found.');
 const action=String(input.action||'');
 if(action==='approve'){
  // Free visitor suggestions remain independent from employer orders.
  if(row.submission_type!=='suggest')return fail(403,'Employer jobs require invoice, paid order and Publish action.');
  if(row.status!=='pending'||input.reviewConfirmed!==true)return fail(409,'Verify the source before approving a pending visitor suggestion.');
  const r=await env.JOBS_DB.prepare("UPDATE job_submissions SET status='approved',reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND submission_type='suggest'").bind(id).run();
  return r.success&&r.meta?.changes?reply({ok:true,message:'Visitor suggestion approved after editorial verification.'}):fail(409,'Approval was not saved.');
 }
 if(action==='review'){
  if(row.submission_type!=='employer'||row.status!=='pending'||row.payment_status!=='pending_review')return fail(409,'Only a new employer request may be reviewed.');
  if(input.reviewConfirmed!==true)return fail(422,'Confirm you checked the employer and original vacancy.');
  const r=await env.JOBS_DB.prepare("UPDATE job_orders SET status='ready_to_invoice',review_confirmed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status='pending_review'").bind(id).run();
  return r.success&&r.meta?.changes?reply({ok:true,message:'Editorial review passed. Prepare and send the actual invoice outside Studio Openings. Job is NOT public.'}):fail(409,'Review was not saved.');
 }
 if(action==='invoice_sent'){
  if(row.submission_type!=='employer'||row.status!=='pending'||row.payment_status!=='ready_to_invoice')return fail(409,'Editorial review must pass before an invoice can be sent.');
  if(input.invoiceSentConfirmed!==true)return fail(422,'Confirm you actually sent a valid invoice to the employer.');
  const r=await env.JOBS_DB.prepare("UPDATE job_orders SET status='awaiting_payment',invoice_sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status='ready_to_invoice' AND review_confirmed_at IS NOT NULL").bind(id).run();
  return r.success&&r.meta?.changes?reply({ok:true,message:'Invoice marked as sent. Await independently verified payment. Job is NOT public.'}):fail(409,'Invoice status was not saved.');
 }
 if(action==='mark_paid'){
  if(row.submission_type!=='employer'||row.status!=='pending'||row.payment_status!=='awaiting_payment'||!row.invoice_sent_at)return fail(409,'Only invoiced employer orders can be marked paid.');
  if(input.paymentConfirmed!==true)return fail(422,'Confirm the exact amount was received in your bank or payment-provider account.');
  const reference=String(input.paymentReference||'').trim();
  if(reference.length<4||reference.length>90||!/^[\w .:/#-]+$/.test(reference))return fail(422,'Enter a private payment reconciliation reference (4–90 characters).');
  const plan=planOf(row.tier);
  if(!plan||plan.priceUSD!==row.price_usd)return fail(409,'Order price mismatch. Do not publish; investigate the order.');
  const r=await env.JOBS_DB.prepare("UPDATE job_orders SET status='paid',payment_confirmed_at=CURRENT_TIMESTAMP,payment_reference=?,updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status='awaiting_payment' AND invoice_sent_at IS NOT NULL").bind(reference,id).run();
  return r.success&&r.meta?.changes?reply({ok:true,message:'Payment attested by operator. Review and publish separately; no automated payment verification occurred.'}):fail(409,'Payment status was not saved.');
 }
 if(action==='publish'){
  if(row.submission_type!=='employer'||row.status!=='pending'||row.payment_status!=='paid'||!row.payment_confirmed_at||!row.review_confirmed_at)return fail(409,'Publication requires a paid employer order and completed editorial review.');
  const plan=planOf(row.tier);if(!plan||plan.priceUSD!==row.price_usd)return fail(409,'Invalid paid plan or price.');
  if(input.reviewConfirmed!==true)return fail(422,'Recheck employer, application route and current vacancy before publication.');
  let data;try{data=JSON.parse(row.job_data);}catch{return fail(422,'Invalid job information.');}
  if(data.closesOn && data.closesOn<new Date().toISOString().slice(0,10))return fail(409,'Vacancy already closed.');
  if(plan===planOf('featured')&&env.PREMIUM_ACTIVATION_ENABLED!=='true')return fail(403,'Featured publishing is disabled. Set PREMIUM_ACTIVATION_ENABLED=true only after testing the Featured release.');
  const ops=[
   env.JOBS_DB.prepare("UPDATE job_submissions SET status='approved',reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND submission_type='employer' AND EXISTS (SELECT 1 FROM job_orders WHERE submission_id=? AND status='paid' AND review_confirmed_at IS NOT NULL AND payment_confirmed_at IS NOT NULL)").bind(id,id),
   env.JOBS_DB.prepare("UPDATE job_orders SET published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status='paid' AND published_at IS NULL").bind(id)
  ];
  if(row.tier==='featured')ops.push(env.JOBS_DB.prepare("INSERT INTO premium_campaigns (submission_id,status,tier,starts_on,ends_on,payment_confirmed_at,updated_at) SELECT ?,'active','featured',date('now'),date('now','+89 days'),CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM job_orders WHERE submission_id=? AND status='paid' AND tier='featured' AND published_at IS NOT NULL)").bind(id,id));
  const results=await env.JOBS_DB.batch(ops);
  if(!results.every(x=>x?.success===true)||results[0].meta?.changes!==1||results[1].meta?.changes!==1)return fail(409,'Publication could not be verified; check D1 records before retrying.');
  return reply({ok:true,message:row.tier==='featured'?'Paid Featured job published; 90-day campaign started. Verify vacancy every 30 days.':'Paid Standard job published for 30 days. No automated email was sent.'});
 }
 if(action==='reject'){
  if(row.status!=='pending'||input.reviewConfirmed!==true)return fail(422,'Confirm this pending submission should be rejected.');
  if(row.submission_type==='employer'&&row.payment_status==='paid')return fail(409,'Paid requests require refund/reconciliation before rejection.');
  const ops=[env.JOBS_DB.prepare("UPDATE job_submissions SET status='rejected',reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(id)];
  if(row.submission_type==='employer')ops.push(env.JOBS_DB.prepare("UPDATE job_orders SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status!='paid'").bind(id));
  const r=await env.JOBS_DB.batch(ops);
  return r.every(x=>x?.success===true)?reply({ok:true,message:'Submission rejected. Send a manual status email to the contact.'}):fail(503,'Rejection not saved.');
 }
 if(action==='close'){
  if(input.reviewConfirmed!==true)return fail(422,'Confirm that this vacancy has closed.');
  if(row.status==='closed')return reply({ok:true,message:'Vacancy already closed.'});
  if(row.status!=='approved')return fail(409,'Only a published vacancy can be closed.');
  await env.JOBS_DB.batch([
   env.JOBS_DB.prepare("UPDATE job_submissions SET status='closed' WHERE id=? AND status='approved'").bind(id),
   env.JOBS_DB.prepare("UPDATE premium_campaigns SET status='ended',updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status IN ('active','paused')").bind(id)
  ]);
  return reply({ok:true,message:'Vacancy closed and removed from active listings.'});
 }
 if(action==='reverify'){
  if(row.status!=='approved'||input.reviewConfirmed!==true)return fail(409,'Recheck a currently published vacancy first.');
  const r=await env.JOBS_DB.prepare("UPDATE job_submissions SET reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='approved'").bind(id).run();
  return r.success&&r.meta?.changes?reply({ok:true,message:'Freshness check updated. Paid listing duration does not reset.'}):fail(409,'Re-verification not saved.');
 }
 if(['pause','end','resume'].includes(action)){
  if(row.submission_type!=='employer'||row.status!=='approved'||row.payment_status!=='paid'||row.tier!=='featured')return fail(403,'Only paid published Featured jobs can be managed.');
  if(action==='resume'){
   const r=await env.JOBS_DB.prepare("UPDATE premium_campaigns SET status='active',updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status='paused' AND ends_on>=date('now')").bind(id).run();
   return r.success&&r.meta?.changes?reply({ok:true,message:'Featured campaign resumed.'}):fail(409,'No valid paused campaign.');
  }
  const next=action==='pause'?'paused':'ended';
  const r=await env.JOBS_DB.prepare("UPDATE premium_campaigns SET status=?,updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status IN ('active','paused')").bind(next,id).run();
  return r.success&&r.meta?.changes?reply({ok:true,message:next==='paused'?'Campaign paused.':'Campaign ended.'}):fail(409,'No active/paused campaign found.');
 }
 return fail(422,'Unsupported operator action.');
}
export async function onRequestGet({request,env}){
 if(!auth(request,env))return fail(401,'Operator access unavailable or invalid.');
 if(!env?.JOBS_DB)return fail(503,'JOBS_DB is not configured.');
 try{return await list(env);}catch{return fail(503,'Required private order tables are not installed. Run the v1.0 D1 migration.');}
}
export async function onRequestPost({request,env}){
 if(!auth(request,env))return fail(401,'Operator access unavailable or invalid.');
 if(!originOK(request))return fail(403,'Invalid request origin.');
 if(!env?.JOBS_DB)return fail(503,'JOBS_DB is not configured.');
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return fail(415,'JSON required.');
 if(Number(request.headers.get('content-length')||0)>6000)return fail(413,'Request too large.');
 let input;try{const raw=await request.text();if(raw.length>6000)return fail(413,'Request too large.');input=JSON.parse(raw);}catch{return fail(400,'Invalid JSON.');}
 try{return await action(env,input);}catch{return fail(503,'Operator action failed; no success confirmed. Inspect D1 before retrying.');}
}
export function onRequestOptions(){return fail(405,'Method not allowed.');}
