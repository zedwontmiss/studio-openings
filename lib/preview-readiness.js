import {CORE} from '../functions/api/launch-readiness.js';
const groups={
 core:CORE,
 sourcing:{source_job_snapshots:['id','source_id','state','last_seen_at','job_json'],source_ingest_health:['source_id','status','last_success_at'],source_ingest_cursor:['name','last_source_id']},
 snapshots:{public_feed_snapshots:['source_key','generated_at','payload_json'],public_feed_sync_health:['source_key','last_attempt_at','status','job_count']},
 distribution:{source_job_reviews:['job_id'],distribution_queue:['job_id','status'],distribution_audit:['job_id'],traffic_daily:['event','total']},
 workspaces:{studio_workspace_drafts:['id','payload','revision'],studio_relationships:['studio_id','payload','revision'],studio_relationship_events:['studio_id','kind'],studio_sourcing_decisions:['studio_id','mode'],editorial_workspace_drafts:['slug','payload','revision'],commercial_placements:['id','state','amount_cents'],commercial_bundle_orders:['id','state','amount_cents']}
};
export async function previewReadiness(env){
 const checks=[];
 for(const [group,tables] of Object.entries(groups)){const missing=[];for(const [table,cols] of Object.entries(tables)){const r=await env.JOBS_DB.prepare('PRAGMA table_info('+table+')').all();const names=(r.results||[]).map(x=>x.name);if(!names.length)missing.push(table+' (missing table)');else for(const col of cols)if(!names.includes(col))missing.push(table+'.'+col);}checks.push({label:group+' schema',state:missing.length?'blocked':'pass',detail:missing.length?missing.join(', '):'Required sampled columns present'});}
 for(const name of ['PREVIEW_D1_ISOLATED','SOURCE_INGEST_ENABLED','INVENTORY_SNAPSHOT_ENABLED','INDEXED_FEED_ENABLED','PREMIUM_ACTIVATION_ENABLED','NATIVE_APPLY_ENABLED','TRAFFIC_ENABLED','SOURCE_SEO_ENABLED'])checks.push({label:name,state:name==='SOURCE_SEO_ENABLED'?(env[name]==='true'?'manual':'pass'):(env[name]==='true'?'pass':'pending'),detail:name==='SOURCE_SEO_ENABLED'?(env[name]==='true'?'Enabled: verify independent source rights and provenance before release':'Disabled; safe default until source rights are verified'):(env[name]==='true'?'Enabled in Preview; not proof of production readiness':'Not enabled')});
 for(const name of ['SOURCING_INGEST_SECRET','INVENTORY_SNAPSHOT_SECRET'])checks.push({label:name,state:typeof env[name]==='string'&&env[name].length>=32&&env[name]!==env.OPERATOR_ACCESS_TOKEN&&env.SOURCING_INGEST_SECRET!==env.INVENTORY_SNAPSHOT_SECRET?'pass':'pending',detail:'Presence, minimum length and separation from operator and other maintenance secret; never returns secret values'});
 checks.push(...['Physically separate Preview and Production database IDs','Actual scheduler execution and freshness','SIGNAL. subscription, confirmation and unsubscribe','Commercial payment receipt and withdrawal','Production configuration and release approval'].map(label=>({label,state:'manual',detail:'Owner verification required; cannot infer from Preview flags'})));
 return {ok:true,checks,generatedAt:new Date().toISOString(),environment:'Preview',productionReady:false};
}
