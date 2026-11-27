import {inspect} from './launch-readiness.js';
import {inspectRepair,repairMissing} from '../../lib/preview-schema-repair.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';import {reviewHost} from '../../lib/release-scope.js';import {previewReadiness} from '../../lib/preview-readiness.js';
export async function onRequestGet({request,env}){if(!reviewHost(new URL(request.url).hostname)||!env?.JOBS_DB||!operatorAuthorized(request,env))return sceneReply({error:'Authenticated Preview required'},403);try{return sceneReply({...await previewReadiness(env),coreComparison:(await inspect(env.JOBS_DB)).detail.coverage_requests,repair:await inspectRepair(env.JOBS_DB),repairEnabled:env.PREVIEW_D1_ISOLATED==='true'});}catch{return sceneReply({error:'Read-only readiness inspection unavailable'},503);}}

export async function onRequestPost({request,env}){
 if(!reviewHost(new URL(request.url).hostname)||!env?.JOBS_DB||env.PREVIEW_D1_ISOLATED!=='true'||!operatorAuthorized(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Authenticated isolated Preview and same origin required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const raw=await request.text();if(raw.length>500)throw Error();x=JSON.parse(raw);}catch{return sceneReply({error:'Invalid request'},400);}
 if(x.confirm!=='create-missing-preview-tables'||x.separateDatabaseConfirmed!==true)return sceneReply({error:'Explicit independent database verification and setup confirmation required'},422);
 try{const r=await repairMissing(env.JOBS_DB);return sceneReply(r,r.ok?200:409);}catch{return sceneReply({error:'Setup not confirmed; reload readiness before retrying'},503);}
}
