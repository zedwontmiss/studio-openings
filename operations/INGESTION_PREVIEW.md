# Studio Openings v1.1 — Preview-only ingestion

This feature is code-ready but **NOT activated** by a GitHub commit. It requires owner configuration in Cloudflare. It does not change Production or the existing paid employer workflow.

1. Open the **Preview** D1 database currently bound as `JOBS_DB` to the development Pages project. Run `migrations/0001_source_snapshots.sql` in the D1 Console. The prior `creative_sources` and `source_location_maps` schema must already be installed.
2. In **Pages > Settings > Variables and Secrets > Preview**, add `SOURCE_INGEST_ENABLED=true`. Add encrypted `SOURCING_INGEST_SECRET` (unique, 32+ characters, not the operator token). Leave `INDEXED_FEED_ENABLED` disabled.
3. In the Preview **Operator > Sources** tab, approve official ATS source and verify canonical locations. Use **Sync indexed jobs** for each approved source and review its matched count. Private `GET /api/ingest-sources` requires the operator bearer token.
4. For optional automation, create a **separate Cloudflare Worker** containing `worker/source-sync.js`. Set `SYNC_TARGET_URL=https://development.studio-openings.pages.dev/api/ingest-sources` and encrypted `SYNC_TOKEN` to match the Pages ingest secret. Configure Cron Trigger `*/15 * * * *` (UTC). One source per trigger, at most 96 checks daily. Cron cannot be installed in Pages Functions directly.
5. Review the original URLs and data. Only then set `INDEXED_FEED_ENABLED=true` in **Preview** and redeploy. Existing live ATS feeds remain fallback. To disable quickly, set `INDEXED_FEED_ENABLED=false` and redeploy.

Rules: operator-approved ATS boards only; verified city map required; no guessed HQ or generic scraping; max 100 matched jobs per scan; upstream fetch error keeps old snapshots but a 72-hour stale timeout still hides old jobs; two complete successful observations are needed to retire missing jobs. Public index excludes paid orders, emails and unapproved sources.

This does **not** automatically turn the 508 editorial company candidates into live vacancies. It does not implement paid checkout, email delivery, provider expansion or Production changes.
