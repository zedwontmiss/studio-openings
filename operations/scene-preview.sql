-- STAGED ONLY. Do not apply until the owner confirms isolated Preview D1.
-- Shared canonical city IDs from lib/local-cities.js; no new database binding.
CREATE TABLE IF NOT EXISTS scene_topics (
 id TEXT PRIMARY KEY,
 city_id TEXT NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 160),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 3000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','removed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_scene_topics_city ON scene_topics(city_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS scene_replies (
 id TEXT PRIMARY KEY,
 topic_id TEXT NOT NULL REFERENCES scene_topics(id),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 2 AND 2000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','removed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_scene_replies_topic ON scene_replies(topic_id,status,created_at);
CREATE TABLE IF NOT EXISTS scene_reports (
 id TEXT PRIMARY KEY,
 topic_id TEXT NOT NULL REFERENCES scene_topics(id),
 reply_id TEXT REFERENCES scene_replies(id),
 reason TEXT NOT NULL CHECK(reason IN ('spam','harassment','privacy','false_claim','other')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scene_reports_status ON scene_reports(status,created_at);
CREATE TABLE IF NOT EXISTS scene_rate_buckets (
 bucket TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
