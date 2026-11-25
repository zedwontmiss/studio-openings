-- STAGED ONLY. Apply after isolated Preview database verification and approval.
CREATE TABLE IF NOT EXISTS public_feed_sync_health (
 source_key TEXT PRIMARY KEY,
 last_attempt_at INTEGER NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('attempting','ok','unavailable','stale','oversized','partial')),
 job_count INTEGER
);
