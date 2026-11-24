# Scene — staged shared-D1 architecture

Scene belongs to Local and shares canonical city IDs with Jobs, Studio and Article. It uses the existing JOBS_DB binding, not a separate database service. The checked-in SQL is deliberately outside migrations and must not be applied automatically.

## Current pilot
- Read endpoint for approved city discussions and replies, capped at 50 topics and 100 replies.
- Public submission and report endpoint, all content defaults to pending.
- Operator-only moderation API; no publication before approval.
- Daily HMAC rate buckets; no raw IP stored by Scene code. Infrastructure logs may still contain IP addresses.
- Separate feature flags for reads and writes; strict development hostname and Preview isolation.
- No public profiles, accounts, fake posts, private messaging or voting.

## Activation gates
Verify actual Preview and Production database IDs are different. Review schema and privacy, retention, abuse handling, moderation workflow and operator UI. Add Turnstile or equivalent challenge and stronger request protections before allowing anonymous writes. Configure separate SCENE_RATE_SECRET of at least 32 random characters; rotate deliberately. Establish deletion of expired rate buckets and rejected/removed content, moderation response expectations, terms and reporting/removal contact. Apply SQL only to isolated Preview after explicit approval. SCENE_ENABLED and SCENE_WRITES_ENABLED remain off; no secrets, binding, migrations, scheduled jobs or public discussion content have been configured.

Known limitations: no browser interface, no nested replies, no pagination beyond first bounded page, no owner deletion mechanism, no moderation audit history beyond reviewed timestamp, no automated cleanup, no operator UI, no verified rate limit behavior. Public posting is not release-ready. Published topics may be removed by operator; replies are hidden when parent is removed. Review transactional races and operational limits before activation.

Read-only city Scene UI now staged: latest/popular, published topic and reply views, server-rendered escaped text. Disabled state has no fabricated discussions or post controls. Moderation UI and challenge are still required before enabling writes.
