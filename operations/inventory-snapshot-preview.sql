-- STAGED ONLY. Apply to isolated Preview D1 after explicit approval.
CREATE TABLE IF NOT EXISTS public_feed_snapshots (
  source_key TEXT PRIMARY KEY,
  generated_at INTEGER NOT NULL,
  payload_json TEXT NOT NULL
);
