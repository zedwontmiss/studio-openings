# Preview inventory maintenance

Staged on development only. GitHub scheduled workflows run from the default branch (main), not development. Do not merge main without owner approval. Existing health-check workflows are unchanged.

## Activation checklist

1. Confirm Preview JOBS_DB is physically different from Production JOBS_DB in Cloudflare Pages settings. Do not rely on the isolation flag alone.
2. Verify source migrations and snapshot tables exist in Preview. Use the existing setup flow and approved Preview-only SQL; do not initialize production.
3. In Preview only, set PREVIEW_D1_ISOLATED=true, SOURCE_INGEST_ENABLED=true and INVENTORY_SNAPSHOT_ENABLED=true after verification. Set dedicated random 32+ character SOURCING_INGEST_SECRET and INVENTORY_SNAPSHOT_SECRET. Never reuse the operator token or reuse one maintenance secret for both tasks.
4. Add matching GitHub Actions repository secrets with those exact names. Keep PREVIEW_MAINTENANCE_ENABLED repository variable absent or false until the environment is verified.
5. With the workflow available on the default branch and the variable true, dispatch snapshot and ingest individually, confirm successful logs and operator source health. No approved sources is a valid no-op. Partial official scans are reported as failed maintenance runs for review; already indexed valid rows may remain and retirement is skipped. Disable immediately if isolation or results are unexpected.
6. Scheduled jobs use one shard per 10 minutes (17 shards = 170 minutes nominal) and one approved official board per 30 minutes (48/day nominal). GitHub can delay or skip schedules. Existing five-hour snapshot age and 72-hour indexed expiry are unchanged. Do not increase rates until actual quota usage and source freshness are reviewed.

Pause by setting PREVIEW_MAINTENANCE_ENABLED=false and disabling the Preview ingestion/snapshot flags. No production endpoint, arbitrary URL, automatic employer approval, email sending or automatic studio publication is authorized.

Links:
- https://github.com/zedwontmiss/studio-openings/settings/secrets/actions
- https://github.com/zedwontmiss/studio-openings/settings/variables/actions
- https://github.com/zedwontmiss/studio-openings/actions
- https://development.studio-openings.pages.dev/operator

Weekly studio discovery and job-alert delivery remain separate future work; no schedule for those is implemented here.
