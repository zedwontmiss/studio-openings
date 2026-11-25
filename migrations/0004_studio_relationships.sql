CREATE TABLE IF NOT EXISTS studio_relationships (studio_id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS studio_relationship_events (id INTEGER PRIMARY KEY AUTOINCREMENT, studio_id TEXT NOT NULL, kind TEXT NOT NULL, summary TEXT NOT NULL, happened_on TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS studio_relationship_events_by_studio ON studio_relationship_events(studio_id,id DESC);
