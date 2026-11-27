import {STUDIO_WORKSPACE} from '../../lib/studio-workspace.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {cleanSourcingDecision,compileSourcingRules} from '../../lib/sourcing-decisions.js';
import {SELECTED_SOURCING_RULES} from '../../lib/selected-sourcing-rules.js';
import {outreachHeld} from '../../lib/outreach-policy.js';
const SQL="CREATE TABLE IF NOT EXISTS studio_sourcing_decisions (studio_id TEXT PRIMARY KEY, mode TEXT NOT NULL CHECK(mode IN ('standard','directory-only','commercial-prospect','editorial-prospect')), reason TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)";
const allowed=(req,env)=>reviewHost(new URL(req.url).hostname)&&env?.PREVIEW_D1_ISOLATED==='true'&&!!env?.JOBS_DB&&operatorAuthorized(req,env);
const studios=STUDIO_WORKSPACE.studios.map(s=>({id:s.id,name:s.name,slug:s.slug,discipline:s.disciplines.join(', '),activeMode:SELECTED_SOURCING_RULES.find(r=>r.studioId===s.id)?.mode||'standard',held:outreachHeld(s.name,s.website)||outreachHeld(s.name,s.source.url)}));
async function list(db){const q=await db.prepare('SELECT studio_id,mode,reason,revision,updated_at FROM studio_sourcing_decisions ORDER BY studio_id LIMIT 5001').all();if(q.results.length>5000)throw Error('Capacity exceeded');return q.results.map(r=>({studioId:r.studio_id,mode:r.mode,reason:r.reason,revision:r.revision,updatedAt:r.updated_at}));}
export async function onRequestGet({request,env}){if(!allowed(request,env))return sceneReply({error:'Authenticated isolated Preview required'},403);try{return sceneReply({ok:true,ready:true,studios,decisions:await list(env.JOBS_DB)});}catch{return sceneReply({ok:true,ready:false,studios,decisions:[]});}}
export async function onRequestPost({request,env}){
 if(!allowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Authenticated same-origin isolated Preview required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const raw=await request.text();if(raw.length>5000)throw Error();x=JSON.parse(raw);if(!x||typeof x!=='object')throw Error();}catch{return sceneReply({error:'Invalid request'},400);}
 const db=env.JOBS_DB;
 try{
 if(x.action==='initialize'&&x.confirm==='isolated-preview-only'){await db.prepare(SQL).run();return sceneReply({ok:true});}
 if(x.action==='export'&&x.confirm===true){const decisions=await list(db);compileSourcingRules(decisions,STUDIO_WORKSPACE.studios);return sceneReply({ok:true,version:1,status:'reviewed-sourcing-decisions',decisions:decisions.map(d=>({studioId:d.studioId,mode:d.mode,reason:d.reason}))});}
 if(x.action!=='save'||x.confirm!==true)return sceneReply({error:'Explicit sourcing decision required'},422);
 const d=cleanSourcingDecision(x.decision);if(!d||!studios.some(s=>s.id===d.studioId)||!Number.isInteger(x.revision)||x.revision<0)return sceneReply({error:'Invalid sourcing decision'},422);
 const r=x.revision===0?await db.prepare('INSERT OR IGNORE INTO studio_sourcing_decisions(studio_id,mode,reason) VALUES(?,?,?)').bind(d.studioId,d.mode,d.reason).run():await db.prepare('UPDATE studio_sourcing_decisions SET mode=?,reason=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE studio_id=? AND revision=?').bind(d.mode,d.reason,d.studioId,x.revision).run();
 if(!r.meta?.changes)return sceneReply({error:'Revision conflict; reload'},409);
 return sceneReply({ok:true,decision:{...d,revision:x.revision+1}});
 }catch{return sceneReply({error:'Sourcing storage unavailable or decision invalid'},503);}
}
