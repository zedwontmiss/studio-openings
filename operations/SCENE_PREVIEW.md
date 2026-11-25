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

Operator console Scene tab implemented using existing in-memory secret, contextual pending topics/replies/reports, explicit publish/reject/remove/review actions, text-only rendering, stale session response guards. Schema and flags remain disabled. Before writes: challenge, retention/cleanup, privacy terms, independent integration/security testing. Reports are reviewed separately from removal. No new database or production changes.

Anonymous topic/reply/report composers staged behind strict Preview writes gate. Turnstile required server-side for every submission, with hostname/action checks and separate Scene site key and secret; no raw IP sent in verification request by this code. Challenge script loads only when an enabled composer is opened. No flags, keys, schema or real submissions configured. Retention/deletion, legal review, rate limit validation, CSP/Turnstile browser and D1 integration tests remain mandatory. Existing moderation still required.

## Retention pilot (proposed durations, owner/legal review required)
Rate buckets eligible at expiry; rejected/removed records eligible 30 days after review; reviewed reports eligible 90 days after creation (not review timestamp, existing schema limitation). No pending or published content automatically deleted. Topics with any dependent replies/reports are retained; blocked dependencies require manual resolution. Authenticated dry-run counts and separately flagged, explicitly confirmed bounded cleanup; no scheduler configured. Scene retention is not a general D1 deletion endpoint. Backups/platform logs have separate retention. No guarantee of erasure from backups. Contact requests require manual verification; anonymous authors have no self-service deletion yet.

## Preview activation order
1. Compare actual D1 IDs in Cloudflare; do not proceed if shared with production.
2. Run staged SQL only on isolated Preview. Confirm four tables/indexes.
3. Set SCENE_ENABLED=true for read/moderation testing. Keep SCENE_WRITES_ENABLED and SCENE_RETENTION_ENABLED off.
4. Configure separate Scene Turnstile credentials restricted to preview hostname and rate secret. Test reject/approve/report and malicious content with synthetic test fixtures only, then remove fixtures. Enable writes only after privacy and security review.
5. Dry-run retention and verify protected records survive. Explicitly enable cleanup only for approved testing. Review logs, remove fixtures, disable write flags when not testing.
6. Pilot London/New York only after adding a city allowlist, original editorial prompts, published rules, moderation capacity, abuse and deletion policies. No production launch without owner approval.

Owner approved proposed retention periods and London/New York pilot direction. Scene replaces Cities as primary navigation; /cities aliases /scene. Pilot city allowlist enforced in public read and write paths, other city directories remain accessible. Community guidelines draft and private editorial starter drafts prepared; no posts inserted and no flags enabled. Before activation add explicit editorial attribution and review privacy/terms, verify isolated D1, test all flows. Approval of direction is not authorization to modify production.

Owner rejects polls and prefers a single free-form noticeboard for meetups, rants, workplace criticism and salary comparisons. Topic details optional; current schema requires >=10 characters, so title-only posts store title as body and suppress duplicate display. Title minimum adjusted to 10; nonempty details minimum 10. Contributor interest page uses existing email only, no signup or credential access. No outreach or posting activated. See SCENE_CONTRIBUTOR_PLAYBOOK.md. Review privacy/voluntary collaboration wording before production.
