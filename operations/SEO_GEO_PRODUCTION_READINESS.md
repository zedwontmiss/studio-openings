# Studio Openings production readiness

**Assessment for 28 November 2026**. The audit verified the live 135-URL sitemap surface and the completed Tadaima withdrawal. No new application release was proposed for immediate deployment. Development work should begin with the approved read-only audit handoff and the staged order in the [roadmap](SEO_GEO_ROADMAP.md).

## Tests and results

| Test | Result | Remaining boundary |
| --- | --- | --- |
| Exact Git ref comparison and remote checks | Production base `c48d5a7`, Preview base `7af92e9`. Both Pages checks succeeded. Main CodeQL and development validation succeeded. Trees differ only by four staged IndexNow files. | Confirm current deploy and environment settings in Pages before a subsequent release. |
| Local branch verification | 137 browser/function/library/worker JS syntax checks and 82 CJS/MJS suites passed on each branch. Nine numbered migrations and three optional Preview SQL scripts applied in disposable SQLite. | This is local code and schema evidence. Live schema and settings are unresolved. |
| Production sitemap census | XML HTTP 200, 135 exactly matching checked-in and Preview URL entries. All 135 target URLs returned HTTP 200 with self-consistent HTML/HTTP canonicals, no noindex and unique titles. | No active individual job pages were available for live Rich Results or lifecycle validation. Sitemap submissions and search index coverage remain unverified. |
| Route and removal checks | HTTP root redirected to HTTPS, known same-host aliases redirected, Preview check URLs noindex. The withdrawn Tadaima article and three alternative path forms returned 404/noindex. Unknown paths returned home HTML 200/noindex in several route families. | Correct fallback HTTP status and test representative known/unknown routes and IPv4/IPv6/DNS decisions. `www` was NXDOMAIN. |
| Browser/performance sample | Production loaded at 1280 px and 375 px with feed, five equivalent Canada query results at 1280 px, no script errors, request failures or horizontal overflow. 25 API calls and 2 other same-origin fetches per cold lab run. | Field CWV, constrained-mobile network, full tablet/mobile matrix and physical legacy Safari unverified. |
| Official source sample | Five source URLs from public feeds returned HTTP 200 with matching titles and Apply controls. | Wider sample, reuse rights and current hiring/eligibility beyond public details need review. |
| IndexNow dry run | Seed 135, historical delta 8. Preview key exact as plain text. Production key wrong content and workflow absent on main. | Production submission requires post-deploy key/URL verification, lifecycle testing and explicit approval. |
| Cloudflare authorization/readiness | Two separate D1 resources listed. Pages and Worker Routes reads 403, D1 metadata SQL 403, browser dashboard sign-in. Sampled protected live endpoints returned 401/403. | Access is required to certify actual bindings, schema, flags, routes, cron ownership, WAF/bot rules and quota/billing. |
| Commercial and application readiness | Local SQLite suite exercised manual payment/state transitions, Featured and closure. Public configuration returned submission enabled and native apply disabled. No payments, application submissions or private data accessed in this audit. | Real provider/settlement and forms are boundary tests for separate, authorized pilots. |

Test provenance. [Development validation](https://github.com/zedwontmiss/studio-openings/actions/runs/45965693721), [Production CodeQL](https://github.com/zedwontmiss/studio-openings/actions/runs/45965732163), [withdrawal release commit](https://github.com/zedwontmiss/studio-openings/commit/c48d5a7e0ce283387c1914bc4f24b7749b77972a), [public XML](https://s-o.app/sitemap.xml)

## Reproduce before a release

In the candidate checkout, use the same configured Node version as GitHub Actions for the release run.

```bash
set -euo pipefail
while IFS= read -r -d '' file; do
  node --input-type=module --check < "$file"
done < <(find assets functions lib worker -type f -name '*.js' -print0)
for suite in tests/*.cjs tests/*.mjs; do node "$suite"; done
```

On the documented IndexNow development candidate, keep sends disabled for a preflight.

```bash
INDEXNOW_MODE=seed INDEXNOW_SEND=false node operations/indexnow.mjs
INDEXNOW_MODE=delta INDEXNOW_SEND=false \
  INDEXNOW_BEFORE="$(git merge-base origin/main HEAD)" node operations/indexnow.mjs
```

Capture Preview and Production GET headers and bodies separately. Parse sitemap XML, check its eligible URL set, then fetch all canonical URLs with bounded concurrency and compare HTTP status, canonical, robots, titles and parsed JSON-LD. Sample missing root, article, studio, discipline and detail paths plus legacy aliases. Assert withdrawal, source-link validity and dates. API errors and HTML fallback HTTP 200 have distinct meanings. Verify preview-only hosts and routes with noindex and validate the expected sitemap and key content type/body.

```bash
curl -sS --compressed -D - https://s-o.app/sitemap.xml
curl -sS --compressed -D - https://development.studio-openings.pages.dev/sitemap.xml
curl -sS --compressed -D - https://s-o.app/robots.txt
curl -sS -D - https://s-o.app/article/when-a-design-studio-becomes-a-platform
```

Run the browser checks at 320, 375, 414, 768 and 1280 px and legacy Safari when available. Include direct job links, search/filters/share query, saved state, disclosure, Apply, required form validation and fallback/feed errors. Use disposable fixtures for completions and verify real employer URLs read-only. For live JobPosting use verified job(s), Google's Rich Results Test and Search Console URL Inspection. Validate publish, edit, employer withdrawal and automatic expiry. Test sitemap failure and recovery with a disposable D1 environment. [Google JobPosting](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

## Proposed deployment sequence and remaining issues

1. **First candidate** — Small route/status correction and sitemap/metadata regressions for the existing application. Confirm static routes, alternate host noindex, robots, Tadaima, live Preview checks and correct fallback on every route family touched. Keep programmatic landing pages and new feature flags out of that candidate.
2. **Verified vacancy candidate** — After binding and schema readback and rights review, test genuine employer-submitted vacancies using existing gates and bounded HTML seeding. Stage source-backed candidates independently. Correct original posting dates, description completeness, date changes and single-vacancy schema. Confirm sales and expiry behavior through the existing paid controls.
3. **Operations candidate** — Stage one scheduler in isolated Preview. Verify time bounds, duplicate/partial handling, failover, D1 cost and freshness. Add IndexNow deployment verification and retry/idempotency after lifecycle state is stable. Keep production sending off until explicitly approved. Existing health workflows can carry bounded monitoring. Later landing pages require verified sustained inventory and an evidence-based demand gate.

Release criteria are exact-SHA green Actions and Pages checks, tested Preview and explicit owner approval. A successful check marks the deployment step. Verify Production routes and data after it completes.

## Rollback

- Before an approved release, record the current healthy Pages deployment ID, Git ref and canonical response baseline, relevant flags, active schedulers and existing D1 recovery window. Use the known post-withdrawal `c48d5a7` deployment as a baseline reference and check that its artifact is actually available. Never pick a target that republished the withdrawn article.
- If notification, source publishing, snapshot delivery or scheduler changes misbehave, pause the affected flags and scheduler with operator approval or according to the approved release rollback plan. Capture counts, status and timestamps. Avoid repeat sends. A received IndexNow notification cannot be recalled; publish the correct state and notify again only through the approved policy.
- For a content/runtime regression, select the previous verified Production Pages deployment in its deployment history and use the documented rollback action. Recheck home/Jobs, Studio, Article, Tadaima's 404, sitemap counts and comparisons, Preview noindex, job eligibility/expiry, and commercial display. Prepare a reviewed Git revert to keep the next release from redeploying the faulty code. Coordinate any rules or binding rollback separately.
- A Pages rollback changes the site artifact. D1 writes, external submissions, provider state and Cloudflare settings have separate recovery paths. Stop affected writes, verify compatibility, then agree on any D1 recovery with the operator. Confirm both database IDs, pre-change recovery point and data scope before any restore. Prefer additive compatible changes up front. [Pages rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/), [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

## Operator evidence and approvals

The following evidence can be shared as scoped read-only access or redacted exports. Use the existing project/account and keep credentials and personally identifying rows out of attachments and Git.

| Evidence needed | Purpose |
| --- | --- |
| Pages settings showing production branch, deployment refs and the two current `JOBS_DB` bindings. D1 schema/version checks from existing read-only operator pages. | Finish P0 isolation and migration certification. |
| Worker schedules, bot/security/crawl controls, Cloudflare Usage/Analytics and plan details showing requests, D1 rows read/written and billing totals. | Establish automation ownership, verified crawler reachability and cost headroom. |
| Search Console property `s-o.app` sitemap status/last read, Pages report, and a fixed 28-day Performance export. URL Inspection for home, a studio, a discipline, Tadaima and a genuine eligible job once present. Existing manual request detail where available. | Verify prior claims and create a search baseline without resubmitting or requesting indexing during audit. |
| Bing Webmaster Tools sitemap/index/exclusion reports and AI Performance when available. | Verify Bing state and establish citation observations. |

Explicit owner approval is required before a merge to main, a Production deploy or flag change, IndexNow live submission, any D1 schema change or persistence pilot, activation of recurring ingestion/source SEO, real payments/notifications, or paid infrastructure. Existing release scope, UI and verified-source policy apply to each approval. Keep the [active checklist](SEO_GEO_CHECKLIST.md) current with decisions and evidence.
