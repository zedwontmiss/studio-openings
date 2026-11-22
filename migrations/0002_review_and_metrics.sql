-- Apply in Preview only after checking its JOBS_DB database ID against Production.
CREATE TABLE IF NOT EXISTS source_job_reviews (
  job_id TEXT PRIMARY KEY REFERENCES source_job_snapshots(id),
  source_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  original_url TEXT NOT NULL,
  rights_evidence TEXT NOT NULL,
  full_description TEXT NOT NULL,
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE VIEW IF NOT EXISTS reviewed_source_jobs AS
  SELECT j.id,j.source_id,j.job_json,j.state AS snapshot_state,j.last_seen_at,j.miss_count,
         s.status AS source_status,s.employer_name,s.provider,s.board_token,
         r.original_url,r.rights_evidence,r.full_description,r.verified_at
  FROM source_job_snapshots j JOIN creative_sources s ON s.id=j.source_id
  JOIN source_job_reviews r ON r.job_id=j.id AND r.source_id=s.id AND r.snapshot_json=j.job_json
  WHERE j.state='active' AND j.miss_count=0 AND s.status='approved';
CREATE TRIGGER IF NOT EXISTS invalidate_snapshot_review AFTER UPDATE ON source_job_snapshots
WHEN NEW.job_json<>OLD.job_json OR NEW.state<>'active' OR NEW.miss_count>0 OR NEW.source_id<>OLD.source_id
BEGIN DELETE FROM source_job_reviews WHERE job_id=OLD.id; END;
CREATE TRIGGER IF NOT EXISTS invalidate_registry_reviews AFTER UPDATE ON creative_sources
WHEN NEW.status<>'approved' OR NEW.official_url<>OLD.official_url OR NEW.board_token<>OLD.board_token OR NEW.provider<>OLD.provider
BEGIN DELETE FROM source_job_reviews WHERE source_id=OLD.id; END;

CREATE TABLE IF NOT EXISTS distribution_queue (
  job_id TEXT NOT NULL, channel TEXT NOT NULL CHECK(channel IN ('reddit','x')),
  original_url TEXT NOT NULL, body TEXT NOT NULL, fingerprint TEXT NOT NULL,
  valid_until INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','approved','exported','withdrawn')),
  exported_at INTEGER, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(job_id,channel), UNIQUE(original_url,channel)
);
CREATE TABLE IF NOT EXISTS distribution_audit (
  id INTEGER PRIMARY KEY, job_id TEXT NOT NULL, channel TEXT NOT NULL,
  event TEXT NOT NULL, recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS draft_created AFTER INSERT ON distribution_queue
BEGIN INSERT INTO distribution_audit(job_id,channel,event) VALUES(NEW.job_id,NEW.channel,NEW.status); END;
CREATE TRIGGER IF NOT EXISTS draft_transition AFTER UPDATE OF status ON distribution_queue
WHEN NEW.status<>OLD.status BEGIN
  INSERT INTO distribution_audit(job_id,channel,event) VALUES(NEW.job_id,NEW.channel,NEW.status);
END;
CREATE TRIGGER IF NOT EXISTS withdraw_source_drafts AFTER DELETE ON source_job_reviews
BEGIN UPDATE distribution_queue SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE job_id=OLD.job_id AND status<>'withdrawn'; END;
CREATE TRIGGER IF NOT EXISTS withdraw_reviewed_employer AFTER UPDATE OF status,job_data,reviewed_at ON job_submissions
BEGIN UPDATE distribution_queue SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE job_id=OLD.id AND status<>'withdrawn'; END;
CREATE TRIGGER IF NOT EXISTS withdraw_changed_order AFTER UPDATE OF status,tier,published_at ON job_orders
BEGIN UPDATE distribution_queue SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE job_id=OLD.submission_id AND status<>'withdrawn'; END;
CREATE INDEX IF NOT EXISTS queue_export_time ON distribution_queue(channel,exported_at);
CREATE TABLE IF NOT EXISTS traffic_daily (
  day TEXT NOT NULL, event TEXT NOT NULL, referral TEXT NOT NULL, job_key TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(day,event,referral,job_key)
);

CREATE TRIGGER IF NOT EXISTS withdraw_revised_rights AFTER UPDATE ON source_job_reviews
BEGIN UPDATE distribution_queue SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE job_id=OLD.job_id AND status<>'withdrawn'; END;
CREATE TRIGGER IF NOT EXISTS remove_deleted_snapshot_review AFTER DELETE ON source_job_snapshots
BEGIN DELETE FROM source_job_reviews WHERE job_id=OLD.id; END;
