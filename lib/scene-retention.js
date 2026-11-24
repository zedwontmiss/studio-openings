// Preview-only retention policy. Keep published content and unresolved reports.
export const RETENTION_DAYS=Object.freeze({rejected:30,removed:30,reviewedReport:90});
const topicCondition="status IN ('rejected','removed') AND reviewed_at < datetime('now','-30 days') AND NOT EXISTS(SELECT 1 FROM scene_reports p WHERE p.topic_id=scene_topics.id AND p.status='pending')";
const replyCondition="status IN ('rejected','removed') AND reviewed_at < datetime('now','-30 days') AND NOT EXISTS(SELECT 1 FROM scene_reports p WHERE p.reply_id=scene_replies.id AND p.status='pending')";
export async function retentionPlan(db,now=Date.now()){
 const queries=[
 ['rateBuckets','SELECT COUNT(*) AS n FROM scene_rate_buckets WHERE expires_at<=?',now],
 ['reports',"SELECT COUNT(*) AS n FROM scene_reports WHERE status='reviewed' AND created_at < datetime('now','-90 days')"],
 ['replies',"SELECT COUNT(*) AS n FROM scene_replies WHERE "+replyCondition+" AND NOT EXISTS(SELECT 1 FROM scene_reports p WHERE p.reply_id=scene_replies.id)"],
 ['topics',"SELECT COUNT(*) AS n FROM scene_topics WHERE "+topicCondition+" AND NOT EXISTS(SELECT 1 FROM scene_replies r WHERE r.topic_id=scene_topics.id) AND NOT EXISTS(SELECT 1 FROM scene_reports p WHERE p.topic_id=scene_topics.id)"]
 ];
 const result={};for(const [key,sql,arg] of queries){const stmt=db.prepare(sql);const row=await (arg===undefined?stmt:stmt.bind(arg)).first();result[key]=Number(row?.n||0);}
 return result;
}
export async function purgeScene(db,now=Date.now()){
 // Each bounded deletion is independently guarded, including foreign-key dependencies.
 // Do not cascade away published replies or unresolved reports.
 const statements=[
 db.prepare('DELETE FROM scene_rate_buckets WHERE bucket IN (SELECT bucket FROM scene_rate_buckets WHERE expires_at<=? LIMIT 500)').bind(now),
 db.prepare("DELETE FROM scene_reports WHERE id IN (SELECT id FROM scene_reports WHERE status='reviewed' AND created_at < datetime('now','-90 days') LIMIT 100)"),
 db.prepare("DELETE FROM scene_replies WHERE id IN (SELECT id FROM scene_replies WHERE "+replyCondition+" AND NOT EXISTS(SELECT 1 FROM scene_reports p WHERE p.reply_id=scene_replies.id) LIMIT 100)"),
 db.prepare("DELETE FROM scene_topics WHERE id IN (SELECT id FROM scene_topics WHERE "+topicCondition+" AND NOT EXISTS(SELECT 1 FROM scene_replies r WHERE r.topic_id=scene_topics.id) AND NOT EXISTS(SELECT 1 FROM scene_reports p WHERE p.topic_id=scene_topics.id) LIMIT 100)")
 ];
 const rows=await db.batch(statements);
 return Object.fromEntries(['rateBuckets','reports','replies','topics'].map((key,i)=>[key,Number(rows[i]?.meta?.changes||0)]));
}
