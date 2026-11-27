import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
import {STUDIO_IDENTITIES} from '../../lib/studio-identities.js';
import {cleanBundle,deliverables} from '../../lib/commercial-bundles.js';
const SQL="CREATE TABLE IF NOT EXISTS commercial_bundle_orders (id TEXT PRIMARY KEY, studio_id TEXT NOT NULL, product TEXT NOT NULL CHECK(product IN ('sponsored-article','premium-coverage')), amount_cents INTEGER NOT NULL, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, brief TEXT NOT NULL, payment_reference TEXT, state TEXT NOT NULL CHECK(state IN ('draft','paid','ended')), revision INTEGER NOT NULL DEFAULT 1)";
const allowed=(r,e)=>reviewHost(new URL(r.url).hostname)&&e?.PREVIEW_D1_ISOLATED==='true'&&!!e.JOBS_DB&&operatorAuthorized(r,e);
export async function onRequestGet({request,env}){if(!allowed(request,env))return sceneReply({error:'Isolated Preview required'},403);try{const q=await env.JOBS_DB.prepare('SELECT * FROM commercial_bundle_orders ORDER BY starts_on DESC LIMIT 501').all();if(q.results.length>500)return sceneReply({error:'Capacity exceeded'},409);return sceneReply({ok:true,ready:true,records:q.results.map(r=>({...r,deliverables:deliverables(r.product)}))});}catch{return sceneReply({ok:true,ready:false,records:[]});}}
export async function onRequestPost({request,env}){
 if(!allowed(request,env)||request.headers.get('origin')!==new URL(request.url).origin)return sceneReply({error:'Authenticated isolated Preview required'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return sceneReply({error:'JSON required'},415);
 let x;try{const raw=await request.text();if(raw.length>10000)throw Error();x=JSON.parse(raw);if(!x||typeof x!=='object')throw Error();}catch{return sceneReply({error:'Invalid request'},400);}
 const db=env.JOBS_DB;try{
 if(x.action==='initialize'&&x.confirm==='isolated-preview-only'){await db.prepare(SQL).run();return sceneReply({ok:true});}
 if(x.confirm!==true)return sceneReply({error:'Explicit confirmation required'},422);
 if(x.action==='create'){const d=cleanBundle(x.record);if(!d)return sceneReply({error:'Invalid terms or brief'},422);const n=await db.prepare('SELECT COUNT(*) AS n FROM commercial_bundle_orders').first();if(n.n>=500)return sceneReply({error:'Capacity reached'},409);await db.prepare("INSERT INTO commercial_bundle_orders(id,studio_id,product,amount_cents,starts_on,ends_on,brief,state) VALUES(?,?,?,?,?,?,?,'draft')").bind(crypto.randomUUID(),d.studioId,d.product,d.amountCents,d.startsOn,d.endsOn,d.brief).run();return sceneReply({ok:true});}
 if(typeof x.id!=='string'||!Number.isInteger(x.revision)||x.revision<1)return sceneReply({error:'Invalid record'},422);
 let r;if(x.action==='paid'){if(typeof x.reference!=='string'||x.reference.trim().length<3||x.reference.length>100)return sceneReply({error:'Reconciliation reference required'},422);r=await db.prepare("UPDATE commercial_bundle_orders SET state='paid',payment_reference=?,revision=revision+1 WHERE id=? AND revision=? AND state='draft'").bind(x.reference.trim(),x.id,x.revision).run();}
 else if(x.action==='end')r=await db.prepare("UPDATE commercial_bundle_orders SET state='ended',revision=revision+1 WHERE id=? AND revision=? AND state IN ('draft','paid')").bind(x.id,x.revision).run();
 else return sceneReply({error:'Fulfillment is not enabled. No automatic campaign activation.'},422);
 return r.meta?.changes?sceneReply({ok:true}):sceneReply({error:'Stale revision or invalid transition'},409);
 }catch{return sceneReply({error:'Bundle storage unavailable'},503);}
}