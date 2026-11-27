# Production launch gate — release candidate
Development only. No merge or production database mutation without owner approval.

## Automated checks
Run all existing CI suites, including launch-audit.mjs. Test canonical public route allowlist, sitemap membership and duplicates, canonical generated HTML, Preview noindex and preview-only path aliases. Existing integration covers simulated payment lifecycle, source permissions, expiry, queue and analytics. These are code-level checks, not a live crawl or actual payment.

## Live release blockers
- Confirm exact accepted development commit deployed on Pages; confirm production branch remains main.
- Compare real Preview and Production JOBS_DB binding IDs before any migration. Read-only inspection; flag alone is insufficient.
- Inspect core production schema using existing launch-check read-only action; additive setup only after separate approval and backup/recovery plan.
- Verify live desktop and iPhone navigation, search, filters, saved jobs, drawer scroll, external apply and employer submission. Test legacy browser compatibility where available.
- Verify original live inventory, freshness, official source permissions and location eligibility. Keep SOURCE_SEO_ENABLED off unless independent rights review completed.
- Rehearse payment workflow without collecting money; verify payment account, manual invoice delivery and employer communications before commercial activation.
- Verify SIGNAL opt-in, consent, confirmation and unsubscribe with an authorized test recipient before public newsletter activation. Keep disabled until then.
- Review contributor email delivery and rights process; no unlicensed photographs.
- Review production domain canonical headers, robots and sitemap after approved release; request indexing only of canonical public pages.
- Confirm rollback target and data recovery procedure. Code rollback does not undo D1 changes.
- Owner explicitly approves release.

## Deferred, not public launch blockers
Scene, SIGNAL public signup until verified, S/O Index scoring and storage initialization, carousel workshop, editorial media compiler, automatic distribution. No new paid infrastructure required by this release candidate.

Cloudflare read-only project API returned HTTP 503 / authentication error during this audit. Live bindings and deployment could not be certified. No settings or database writes performed.
