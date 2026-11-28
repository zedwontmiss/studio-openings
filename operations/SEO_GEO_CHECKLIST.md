# Studio Openings development checklist

This file is the active tracker for SEO, GEO and related development. Update the status and evidence here when work advances. The [current-state audit](SEO_GEO_AUDIT_2026-11-28.md) records the 28 November 2026 baseline. The [roadmap](SEO_GEO_ROADMAP.md) defines scope and acceptance criteria. The [readiness report](SEO_GEO_PRODUCTION_READINESS.md) defines release gates. The [November execution notes](ROADMAP_2026-11-22.md) and [product handoff](PRODUCT_ROADMAP_HANDOFF_2026-11-24.md) remain decision history.

Use these exact statuses.

| Status | Evidence to record |
| --- | --- |
| Not started | Scope and prerequisites identified. |
| In progress | Active branch, owner and next verification step. |
| Implemented | Code or docs present at a named Git ref. |
| Tested | Test type, ref, result, and remaining live checks. |
| Blocked | Dependency, permission or missing evidence that prevents advancing. |
| Awaiting approval | Specific proposed live action, rollback target and required owner decision. |
| Deployed | Environment and successful exact-SHA deployment evidence. |
| Verified in production | Live URL, result and time or account report period. |

## Audit and existing capabilities

| Item | Status | Evidence or next check |
| --- | --- | --- |
| A1 Repository, UI and branch inventory | Tested | Examined both Git tips, top-level/component inventory, tests, workflows and Pages checks. Four development-only IndexNow files at the audited base. |
| A2 Public technical SEO and discovery baseline | Verified in production | All 135 live sitemap URLs fetched. All 200/self-canonical, zero URL/title duplicates or noindex. Unknown-route fallbacks reproduced separately. |
| A3 Tadaima article withdrawal | Verified in production | Four article variants returned 404/noindex. No article slug in sitemap, article index, rotation or feed. Main withdrawal `c48d5a7`. |
| A4 Preview indexing and release scope | Tested | Sampled exact branch Preview noindex, canonical production sitemap and city/Scene/SIGNAL gating. Main and Preview Pages GitHub checks succeeded for the audited heads. |
| A5 Live Pages/D1 settings, schema, worker, security and billed usage | Blocked | Two D1 resources exist. Pages and Worker Routes reads and D1 SQL received 403. Read current binding IDs and schema, rules, active schedules, account limits. See P0-01. |
| A6 Git schema and lifecycle evidence | Tested | Nine migrations and three Preview SQL files loaded into disposable SQLite. Main/development each passed 82 suites including payment, expiry and source policy. |
| A7 Google and Bing account evidence | Blocked | DNS verification tag and public sitemap observed. Console status, submission dates, live inspection, request history, selected canonicals and actual indexing/traffic remain unverified. |
| A8 Development documentation | Implemented | Audit, roadmap, checklist and production readiness documents are present in this repository. |
| T1 Discipline and studio-location pages | Verified in production | Ten discipline routes, nine studio-city routes, 100 studio profiles and 270 homepage query links. Where query URLs differ, the home canonical applies. |
| T2 Grounded global discipline/country search | Verified in production | Existing footer query link returned the compact form. On one live Chromium session the compact, reverse and natural-language forms gave five identical visible job rows in order. Broader parity follows P2-01. |
| T3 JobPosting and expiry code | Tested | Shared paid lifecycle and source gate tested on fixtures. Production has zero eligible jobs in the sitemap at the audited time. Verify real original date, complete description and rich results before pilot. |
| T4 Article and WebSite markup | Verified in production | Six Article objects and one WebSite object parsed in raw sitemap page HTML. Studio/location entity additions tracked in P2-02. |
| T5 IndexNow staged and protected | Tested | Development key returns correct text. Production key path returned fallback HTML. Seed and delta dry runs logged 135 and 8. |
| T6 Basic crawler access | Verified in production | Robots wildcard and sitemap present. Ordinary requests and sampled user-agent headers served successful root/robots responses. Actual verified bot/WAF data pending. |
| T7 Existing daily health workflows | Deployed | Official source and Preview inventory health runs passed on the default branch. Maintenance scheduled runs sampled as skipped. |
| T8 Existing commercial paths | Tested | Disposable integration tested Standard and Featured approval, simulated payment attestation, closure and presentation. Live form config was on, native apply off, no active placements in sampled endpoints. Actual receipt and fulfillment still require a supervised pilot. |

## Controlled development sequence

| ID | Work | Status | Evidence or next action |
| --- | --- | --- | --- |
| P0-01 | Verify Pages bindings, applied schema and operating boundaries | Blocked | Use scoped read access or redacted dashboard/schema evidence from the operator. No migration or ingestion step until confirmed. |
| P1-01 | Correct fallback statuses and harden sitemap/canonical/metadata parity | Deployed | Preview commit `d91bfa9` passed Cloudflare Pages and Actions. Verified all 135 canonical targets, twelve missing-route GET/HEAD checks and existing aliases on the live Preview. Production release approval is separate. |
| P1-02 | Establish verified vacancy pilot, accurate JobPosting and initial job HTML | Not started | Begin with disposable fixtures. Live pilot depends on P0-01, rights, freshness and owner release approval. |
| P1-03 | Baseline provenance, freshness, duplicates, taxonomy and request load | Not started | Verify official vacancy and studio evidence with both geographic sourcing layers. Reuse bounded probe and pick one scheduler only after isolation and capacity evidence. |
| P1-04 | Tie IndexNow to deployed URL lifecycle with retries/deduplication | Not started | Implement validation against fixture/mock and Preview dry runs. Confirm real key body and deployment status before proposing a release. |
| G1 | Production IndexNow flag or live sends | Awaiting approval | Requires P1-04 acceptance and separate explicit authorization. |
| P1-05 | Search/report baseline, live check coverage and observed security controls | In progress | Public crawl and lab baselines recorded. Protected Console reports, WAF/bot, budget, latency and retention checks still pending. |
| P2-01 | Coverage- and demand-gated programmatic landing pages | Not started | Prioritize genuine distinct intent with recurring eligible inventory and bidirectional query/link parity. Keep existing search and layout. |
| P2-02 | Entity relations, metadata, sourced insights and AI referral measures | Not started | Preserve editorial independence, audited official-source evidence, template generation and privacy constraints. |
| P2-03 | Cost, caching, field performance and commercial readiness | Not started | Capture usage and baseline before tuning. Avoid duplicate schedulers and paid additions. Preserve existing pricing, fulfillment and disclosures. |
| P3-01 | Evaluate optional conventions such as llms.txt | Not started | Document a real consumer, hypothesis, measurement and maintenance or stop. |
| G2 | Production deploy, migration, source-SEO/scheduler activation or payment pilot | Awaiting approval | Collect exact candidate evidence and seek approval for the specific action. These gates are independent. |

## Milestone · Correct routes and paid listing duration

- [x] Reproduce HTTP 200 fallback for missing Preview pages, assets and API paths. Add a native Pages 404 document and exercise noindex, canonical headers, legacy redirects and all Tadaima withdrawal aliases locally.
- [x] Match all 135 static and dynamic canonical URLs exactly. Test that a failed vacancy lookup preserves stable pages and the other eligible vacancy set. Omit the submission-date `lastmod` and add the missing Privacy page description.
- [x] Start Standard and Featured terms at the exact paid publication time. Test 30- and 90-day boundaries and both plans with an earlier closing date through the approved feed, grouped Jobs feed, public job page, JobPosting expiry and sitemap.
- [x] Check first and final milliseconds, no publication before the start, no term restart after re-verification, and no active job schema after expiry. Use end of the supplied closing day in UTC for date-only input.
- [x] Pass 137 JS syntax checks and 82 local suites, including the disposable SQLite boundary rehearsal.
- [x] Compile Pages Functions and exercise the bundle in local workerd with the native 404 asset setting. All 135 canonical pages served 200 with descriptions and Preview noindex. Twelve missing-route GET/HEAD cases returned 404 and the existing withdrawal, redirect, CSS, RSS and operator API checks passed.
- [x] Record the owner's Preview-only approval and standard review format in [AGENTS.md](../AGENTS.md).
- [x] Verify the exact Cloudflare Preview deployment. On 28 November 2026, `d91bfa9` passed [GitHub Actions](https://github.com/zedwontmiss/studio-openings/actions/runs/46101954068) and the Cloudflare Pages check. All 135 sitemap targets returned 200, expected canonicals, descriptions and noindex. Twelve missing-path GET/HEAD checks and four withdrawn article aliases returned 404. Redirect, protected operator API, CSS, RSS and feed checks passed.
- [x] Confirm in Chromium that the Product Design Canada query loads results and that a listing drawer opens and closes without a script error or horizontal overflow.
- [ ] Review Jobs usability on the owner's existing Safari using [the Preview search link](https://development.studio-openings.pages.dev/?q=Product%20design%20Canada). Paid duration boundaries passed in disposable SQLite. Production verification and Featured highlighting still require release checks. IndexNow remains separately gated.

## Resume and measurement

1. Read `AGENTS.md` and fetch current development/main refs. Keep the November baseline immutable and add changed evidence to this file with date, SHA, environment and relevant source links.
2. Start with P1-01 and fixture-level P1-02 while P0-01 is pending. In parallel obtain the P1-05 console/account evidence. Use the established 82-suite CI gate and targeted regression tests for newly changed behavior.
3. Verify the Preview binding before schema or source maintenance. Keep the existing Jobs, Studio and Article interface, search, filters, saved/opened/viewed, paid placement and Signal accent. Keep current release and sourcing protections.
4. Track weekly sitemap-eligible and indexed URLs by family, excluded reasons, non-branded impressions/clicks, verified active/expired/duplicate inventory, source freshness, p75 CWV where available, API/D1 usage, Apply clicks and paid order outcomes. Track Bing AI citations and identifiable AI referrals separately. Start with a dated 28-day Search Console/Bing baseline and report progress at the same cadence.
5. When a status changes, record the check that justifies it, any approval still needed and the next smallest task. A deployment check, Production behavior, search index coverage and outcome trends each need their own evidence.
