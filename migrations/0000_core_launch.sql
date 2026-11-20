-- Studio Openings v1.0: additive, idempotent Core D1 schema.
-- IMPORTANT: Run ONLY against the intended Production D1 database after verifying its name.
-- Does not create users, grant operator access, alter DNS, publish listings, or record payments.
-- CREATE TABLE IF NOT EXISTS intentionally does not modify existing tables with older schemas.
-- If existing tables lack required columns, STOP and request a schema reconciliation first.
CREATE TABLE IF NOT EXISTS job_submissions (
 id TEXT PRIMARY KEY,
 status TEXT NOT NULL DEFAULT 'pending',
 submission_type TEXT NOT NULL DEFAULT 'employer',
 job_title TEXT NOT NULL,
 company TEXT NOT NULL,
 application_url TEXT NOT NULL DEFAULT '',
 contact_email TEXT NOT NULL,
 job_data TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_job_submissions_status ON job_submissions(status,created_at);
CREATE INDEX IF NOT EXISTS idx_job_submissions_contact ON job_submissions(contact_email,created_at);
CREATE INDEX IF NOT EXISTS idx_job_submissions_url ON job_submissions(application_url,status);

CREATE TABLE IF NOT EXISTS job_orders (
 submission_id TEXT PRIMARY KEY,
 tier TEXT NOT NULL,
 price_usd INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending_review',
 review_confirmed_at TEXT,
 invoice_sent_at TEXT,
 payment_confirmed_at TEXT,
 payment_reference TEXT,
 published_at TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_job_orders_status ON job_orders(status,updated_at);

CREATE TABLE IF NOT EXISTS premium_campaigns (
 submission_id TEXT PRIMARY KEY,
 status TEXT NOT NULL DEFAULT 'active',
 tier TEXT NOT NULL DEFAULT 'featured',
 starts_on TEXT NOT NULL,
 ends_on TEXT NOT NULL,
 payment_confirmed_at TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_premium_campaigns_dates ON premium_campaigns(status,starts_on,ends_on);

CREATE TABLE IF NOT EXISTS job_applications (
 id TEXT PRIMARY KEY,
 job_id TEXT NOT NULL,
 applicant_name TEXT NOT NULL,
 applicant_email TEXT NOT NULL,
 portfolio_url TEXT NOT NULL DEFAULT '',
 introduction TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'received',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id,created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(applicant_email,created_at);

CREATE TABLE IF NOT EXISTS coverage_requests (
 country_code TEXT NOT NULL,
 region_id INTEGER NOT NULL,
 city_id INTEGER NOT NULL,
 city_name TEXT NOT NULL,
 region_name TEXT NOT NULL,
 requests INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(country_code,city_id)
);

-- Source registry is private. Public indexed feed remains OFF until explicitly enabled.
CREATE TABLE IF NOT EXISTS creative_sources (
 id TEXT PRIMARY KEY, employer_name TEXT NOT NULL, official_url TEXT NOT NULL,
 provider TEXT NOT NULL, board_token TEXT NOT NULL, focus TEXT NOT NULL,
 qualification TEXT NOT NULL DEFAULT 'city_first',status TEXT NOT NULL DEFAULT 'pending',
 reviewed_at TEXT, checked_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(provider,board_token)
);
CREATE TABLE IF NOT EXISTS source_location_maps (
 source_id TEXT NOT NULL,location_key TEXT NOT NULL,raw_location TEXT NOT NULL,
 country_code TEXT NOT NULL,region_id TEXT,city_id TEXT,city_name TEXT NOT NULL,
 region_name TEXT,country_name TEXT NOT NULL,verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(source_id,location_key)
);
CREATE TABLE IF NOT EXISTS source_job_snapshots (
 id TEXT PRIMARY KEY,source_id TEXT NOT NULL,job_json TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'active',scan_token TEXT NOT NULL,
 last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,miss_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_snapshots_active ON source_job_snapshots(state,last_seen_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_source ON source_job_snapshots(source_id,state);
CREATE TABLE IF NOT EXISTS source_ingest_health (
 source_id TEXT PRIMARY KEY,last_attempt_at TEXT,last_success_at TEXT,status TEXT NOT NULL DEFAULT 'never',
 source_count INTEGER NOT NULL DEFAULT 0,matched_count INTEGER NOT NULL DEFAULT 0,failure_streak INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS source_ingest_cursor (name TEXT PRIMARY KEY,last_source_id TEXT NOT NULL DEFAULT '');
INSERT OR IGNORE INTO source_ingest_cursor(name,last_source_id) VALUES('rotation','');
