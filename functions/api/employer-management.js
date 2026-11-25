import {managementEnabled,operatorAuthorized,sceneReply,validId,createCapability,verifyCapability,employerRow} from '../../lib/employer-management.js';
export async function onRequestPost({request,env}){
 if(!managementEnabled(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Management unavailable'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const raw=await request.text();if(raw.length>3000)throw Error();x=JSON.parse(raw);if(!x||!validId(x.id))throw Error();}catch{return sceneReply({error:'Invalid request'},400);}
 try{
 if(x.action==='issue'){
  if(!operatorAuthorized(request,env))return sceneReply({error:'Operator access required'},403);
  const row=await employerRow(env.JOBS_DB,x.id);if(!row||row.status!=='approved')return sceneReply({error:'Published employer listing required'},404);
  const token=await createCapability(row.id,env.OPERATOR_ACCESS_TOKEN);
  return sceneReply({ok:true,url:new URL('/manage-job#'+encodeURIComponent(row.id)+':'+token,request.url).href});
 }
 if(!await verifyCapability(x.id,x.token,env.OPERATOR_ACCESS_TOKEN))return sceneReply({error:'Invalid or expired private link'},403);
 const row=await employerRow(env.JOBS_DB,x.id);if(!row)return sceneReply({error:'Listing unavailable'},404);
 if(x.action==='read')return sceneReply({ok:true,listing:{id:row.id,title:row.job_title,company:row.company,status:row.status}});
 if(x.action==='close'&&x.confirm===true){
  if(row.status==='closed')return sceneReply({ok:true,status:'closed'});
  if(row.status!=='approved')return sceneReply({error:'Listing unavailable'},409);
  const r=await env.JOBS_DB.batch([env.JOBS_DB.prepare("UPDATE job_submissions SET status='closed' WHERE id=? AND status='approved' AND submission_type='employer'").bind(row.id),env.JOBS_DB.prepare("UPDATE premium_campaigns SET status='ended',updated_at=CURRENT_TIMESTAMP WHERE submission_id=? AND status IN ('active','paused')").bind(row.id)]);
  if(!r.every(v=>v.success)||r[0].meta?.changes!==1)return sceneReply({error:'Closure not confirmed; reload'},409);
  return sceneReply({ok:true,status:'closed'});
 }
 return sceneReply({error:'Unsupported action'},422);
 }catch{return sceneReply({error:'Management unavailable; no success confirmed'},503);}
}
