-- Studio Openings v1.1, Preview only. Existing tables remain unchanged.
CREATE TABLE IF NOT EXISTS source_job_snapshots (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL, job_json TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','retired')),
 scan_token TEXT NOT NULL, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 miss_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_snapshots_active ON source_job_snapshots(state,last_seen_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_source ON source_job_snapshots(source_id,state);
CREATE TABLE IF NOT EXISTS source_ingest_health (
 source_id TEXT PRIMARY KEY, last_attempt_at TEXT, last_success_at TEXT,
 status TEXT NOT NULL DEFAULT 'never', source_count INTEGER NOT NULL DEFAULT 0,
 matched_count INTEGER NOT NULL DEFAULT 0, failure_streak INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS source_ingest_cursor (
 name TEXT PRIMARY KEY, last_source_id TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO source_ingest_cursor(name,last_source_id) VALUES('rotation','');
