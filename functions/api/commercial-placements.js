import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {STUDIO_IDENTITIES} from '../../lib/studio-identities.js';
import {cleanPlacement} from '../../lib/commercial-placements.js';
const SQL="CREATE TABLE IF NOT EXISTS commercial_placements (id TEXT PRIMARY KEY, studio_id TEXT NOT NULL, article_slug TEXT, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, amount_cents INTEGER NOT NULL, payment_reference TEXT, state TEXT NOT NULL CHECK(state IN ('draft','paid','active','ended')), revision INTEGER NOT NULL DEFAULT 1)";
const allowed=(r,e)=>reviewHost(new URL(r.url).hostname)&&e?.PREVIEW_D1_ISOLATED==='true'&&!!e.JOBS_DB&&operatorAuthorized(r,e);
export async function onRequestGet({request,env}){if(!allowed(request,env))return sceneReply({error:'Isolated Preview required'},403);const studios=STUDIO_IDENTITIES.map(s=>({id:s.id,name:s.name}));try{const q=await env.JOBS_DB.prepare('SELECT * FROM commercial_placements ORDER BY starts_on DESC LIMIT 501').all();if(q.results.length>500)return sceneReply({error:'Capacity exceeded'},409);return sceneReply({ok:true,ready:true,studios,records:q.results});}catch{return sceneReply({ok:true,ready:false,studios,records:[]});}}
export async function onRequestPost({request,env}){
 if(!allowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Authenticated isolated Preview required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const s=await request.text();if(s.length>5000)throw Error();x=JSON.parse(s);if(!x)throw Error();}catch{return sceneReply({error:'Invalid request'},400);}
 const db=env.JOBS_DB;
 try{
 if(x.action==='initialize'&&x.confirm==='isolated-preview-only'){await db.prepare(SQL).run();return sceneReply({ok:true});}
 if(x.confirm!==true)return sceneReply({error:'Explicit confirmation required'},422);
 if(x.action==='create'){const d=cleanPlacement(x.record);if(!d)return sceneReply({error:'Invalid campaign terms'},422);const count=await db.prepare('SELECT COUNT(*) AS n FROM commercial_placements').first();if(count.n>=500)return sceneReply({error:'Capacity reached'},409);await db.prepare("INSERT INTO commercial_placements(id,studio_id,starts_on,ends_on,amount_cents,state) VALUES(?,?,?,?,?,'draft')").bind(crypto.randomUUID(),d.studioId,d.startsOn,d.endsOn,d.amountCents).run();return sceneReply({ok:true});}
 if(typeof x.id!=='string'||!Number.isInteger(x.revision)||x.revision<1)return sceneReply({error:'Invalid record'},422);
 let r;
 if(x.action==='paid'){if(typeof x.reference!=='string'||x.reference.trim().length<3||x.reference.length>100)return sceneReply({error:'Reconciliation reference required'},422);r=await db.prepare("UPDATE commercial_placements SET state='paid',payment_reference=?,revision=revision+1 WHERE id=? AND revision=? AND state='draft'").bind(x.reference.trim(),x.id,x.revision).run();}
 else if(x.action==='activate'){if(env.COMMERCIAL_PLACEMENTS_ENABLED!=='true')return sceneReply({error:'Preview placement activation disabled'},409);r=await db.prepare("UPDATE commercial_placements SET state='active',revision=revision+1 WHERE id=? AND revision=? AND state='paid' AND payment_reference IS NOT NULL AND ends_on>=date('now')").bind(x.id,x.revision).run();}
 else if(x.action==='end')r=await db.prepare("UPDATE commercial_placements SET state='ended',revision=revision+1 WHERE id=? AND revision=? AND state IN ('draft','paid','active')").bind(x.id,x.revision).run();
 else return sceneReply({error:'Unknown action'},422);
 return r.meta?.changes?sceneReply({ok:true}):sceneReply({error:'Invalid transition or stale revision'},409);
 }catch{return sceneReply({error:'Commercial storage unavailable'},503);}
}
