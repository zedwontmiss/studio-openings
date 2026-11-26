// Fixed allowlist; no user-supplied SQL. Only missing tables and the index for a newly created events table.
export const TABLES=[
  {
    "table": "coverage_requests",
    "sql": "CREATE TABLE IF NOT EXISTS coverage_requests (\n country_code TEXT NOT NULL,\n region_id INTEGER NOT NULL,\n city_id INTEGER NOT NULL,\n city_name TEXT NOT NULL,\n region_name TEXT NOT NULL,\n requests INTEGER NOT NULL DEFAULT 1,\n created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n last_requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n PRIMARY KEY(country_code,city_id)\n);"
  },
  {
    "table": "public_feed_snapshots",
    "sql": "CREATE TABLE IF NOT EXISTS public_feed_snapshots (\n  source_key TEXT PRIMARY KEY,\n  generated_at INTEGER NOT NULL,\n  payload_json TEXT NOT NULL\n);"
  },
  {
    "table": "public_feed_sync_health",
    "sql": "CREATE TABLE IF NOT EXISTS public_feed_sync_health (source_key TEXT PRIMARY KEY,last_attempt_at INTEGER NOT NULL,status TEXT NOT NULL,job_count INTEGER);"
  },
  {
    "table": "studio_workspace_drafts",
    "sql": "CREATE TABLE IF NOT EXISTS studio_workspace_drafts (id TEXT PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('draft','reviewed')), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);"
  },
  {
    "table": "studio_relationships",
    "sql": "CREATE TABLE IF NOT EXISTS studio_relationships (studio_id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);"
  },
  {
    "table": "studio_relationship_events",
    "sql": "CREATE TABLE IF NOT EXISTS studio_relationship_events (id INTEGER PRIMARY KEY AUTOINCREMENT, studio_id TEXT NOT NULL, kind TEXT NOT NULL, summary TEXT NOT NULL, happened_on TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);"
  },
  {
    "table": "studio_sourcing_decisions",
    "sql": "CREATE TABLE IF NOT EXISTS studio_sourcing_decisions (studio_id TEXT PRIMARY KEY, mode TEXT NOT NULL CHECK(mode IN ('standard','directory-only','commercial-prospect','editorial-prospect')), reason TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);"
  },
  {
    "table": "editorial_workspace_drafts",
    "sql": "CREATE TABLE IF NOT EXISTS editorial_workspace_drafts (slug TEXT PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('draft','reviewed')), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);"
  },
  {
    "table": "commercial_placements",
    "sql": "CREATE TABLE IF NOT EXISTS commercial_placements (id TEXT PRIMARY KEY, studio_id TEXT NOT NULL, article_slug TEXT, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, amount_cents INTEGER NOT NULL, payment_reference TEXT, state TEXT NOT NULL CHECK(state IN ('draft','paid','active','ended')), revision INTEGER NOT NULL DEFAULT 1);"
  },
  {
    "table": "commercial_bundle_orders",
    "sql": "CREATE TABLE IF NOT EXISTS commercial_bundle_orders (id TEXT PRIMARY KEY, studio_id TEXT NOT NULL, product TEXT NOT NULL CHECK(product IN ('sponsored-article','premium-coverage')), amount_cents INTEGER NOT NULL, starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, brief TEXT NOT NULL, payment_reference TEXT, state TEXT NOT NULL CHECK(state IN ('draft','paid','ended')), revision INTEGER NOT NULL DEFAULT 1);"
  }
];
const indexes=["CREATE INDEX IF NOT EXISTS studio_relationship_events_by_studio ON studio_relationship_events(studio_id,id DESC);"];
export async function inspectRepair(db){
 const missing=[],incompatible=[];
 for(const t of TABLES){
  const r=await db.prepare('PRAGMA table_info('+t.table+')').all(),names=(r.results||[]).map(x=>x.name);
  // Check all declared column names, not only sampled readiness columns.
  const expected=t.sql.slice(t.sql.indexOf('(')+1).match(/(?:^|,)\s*([a-z_]+)\s+(?:TEXT|INTEGER)\b/gi)||[];
  const columns=expected.map(x=>x.replace(/^,?\s*/,'').split(/\s+/)[0]);
  if(!names.length)missing.push(t.table);else if(columns.some(c=>!names.includes(c)))incompatible.push(t.table);
 }
 return {missing,incompatible};
}
export async function repairMissing(db){
 const before=await inspectRepair(db);if(before.incompatible.length)return {ok:false,...before};
 const statements=TABLES.filter(t=>before.missing.includes(t.table)).map(t=>db.prepare(t.sql));
 if(before.missing.includes('studio_relationship_events'))for(const s of indexes)statements.push(db.prepare(s));
 if(statements.length){const result=await db.batch(statements);if(!result.every(r=>r.success))throw Error('Schema batch failed');}
 const after=await inspectRepair(db);return {ok:!after.missing.length&&!after.incompatible.length,...after,created:before.missing};
}
