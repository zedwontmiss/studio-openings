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
| A5 Live Pages/D1 settings, schema, worker, security and billed usage | Blocked | The owner's Cloudflare screenshots show different configured `JOBS_DB` resources for Production and Preview. Applied schema, active rules and usage remain open. See P0-01. |
| A6 Git schema and lifecycle evidence | Tested | Nine migrations and three Preview SQL files loaded into disposable SQLite. Main/development each passed 82 suites including payment, expiry and source policy. |
| A7 Google and Bing account evidence | In progress | Google Pages, Sitemaps, Performance and exclusion totals are recorded. All seven crawled-but-unindexed examples have live route checks. The `noindex` examples, Google's per-URL inspection and Bing evidence remain open. |
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
| P0-01 | Verify Pages bindings, applied schema and operating boundaries | Blocked | The Cloudflare dashboard screenshots confirm separate configured bindings. The applied schema and other live operating controls still need read-only evidence. |
| P1-01 | Correct fallback statuses and harden sitemap/canonical/metadata parity | Verified in production | Production commit `ef8738d` passed all 135 canonical targets, twelve missing-route GET/HEAD checks and existing aliases on 28 November 2026. |
| P1-02 | Establish verified vacancy pilot, accurate JobPosting and initial job HTML | Not started | Begin with disposable fixtures. Live pilot depends on P0-01, rights, freshness and owner release approval. |
| P1-03 | Baseline provenance, freshness, duplicates, taxonomy and request load | Not started | Verify official vacancy and studio evidence with both geographic sourcing layers. Reuse bounded probe and pick one scheduler only after isolation and capacity evidence. |
| P1-04 | Tie IndexNow to deployed URL lifecycle with retries/deduplication | Not started | Implement validation against fixture/mock and Preview dry runs. Confirm real key body and deployment status before proposing a release. |
| G1 | Production IndexNow flag or live sends | Awaiting approval | Requires P1-04 acceptance and separate explicit authorization. |
| P1-05 | Search/report baseline, live check coverage and observed security controls | In progress | Public crawl, lab baseline and Google exclusion totals recorded. Compare affected URL examples to the live sitemap. Bing evidence, WAF/bot rules, budget and retention checks remain open. |
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

## Milestone · Shared topics and studio corrections

- [x] Reproduce the narrow-screen header overflow and keep the wordmark, primary navigation, Advertise, and S/O on one row. Use the active navigation link as the section indicator at phone widths.
- [x] Add Brand Design and London pills to Ragged Edge, plus London, Brand Design and Architecture to the London guide. Connect them to existing search across Jobs, Studio and Article. A London job match requires worksite evidence.
- [x] Give About a founder introduction and a direct path to studio corrections. Put the correction email first on Contact and combine the editorial prompts.
- [x] Pass all 83 local suites and generated-file checks. The Chromium fixture passed 72 viewport/page checks, typed and linked query parity, tab navigation, and the studio correction link.
- [x] Confirm Preview commit `4597d7d` with [green GitHub Actions](https://github.com/zedwontmiss/studio-openings/actions/runs/46104155647) and Cloudflare Pages. Live Chromium passed 48 layout checks across eight pages and six widths from 320 to 1280 px, pill and tab search, and the correction link. Verified Preview noindex, canonicals, and sitemap parity.
- [ ] Review the pills and correction flow on the owner's existing Safari.

## Milestone · Studio tags and search recovery

- [x] Generate linked city, country and creative-focus pills across the 100 published profiles using verified office locations and published focus. Use one pill for Singapore and distinguish an office from a gallery or museum.
- [x] Suggest shared topics as users type across Jobs, Studio and Article. Recognize BR, BR- and brand as prefixes for Brand Design. Apply the full label on selection and keep ordinary text results updating.
- [x] Provide a clear-search action when a query has no results. Wait for Jobs, Studio and Article sources to finish before reporting a combined miss on Jobs.
- [x] Exercise topic links, keyboard selection, clear-search recovery, delayed sources, and unavailable jobs in Chromium using fixtures. Layout passed at five viewport widths from 320 to 1280 px.
- [x] Verify Preview commit `40d007b` on 28 November 2026. All 83 local suites and 139 JavaScript syntax checks passed, as did [GitHub Actions](https://github.com/zedwontmiss/studio-openings/actions/runs/46105707973) and Cloudflare Pages. Live Chromium passed the topic, navigation and clear-search flows and 20 page/viewport checks. All 135 sitemap URLs returned 200 with production canonicals, descriptions and Preview noindex.
- [ ] Review the 2x4 profile pills and clear-search action in the owner's Safari. The following milestone removed the suggestion row.

## Milestone · Live search without suggestions

- [x] Remove the suggestion row and its pills from Jobs, Studio, and Article. Keep the topic links on studio and article detail pages.
- [x] Match partial queries against actual record text and verified topic labels. Check the progression from single letters through `brand des` and `brand design`, including case-insensitive input and the `BR-` example.
- [x] Keep clear-search recovery for genuinely empty results and preserve the existing verified-location rules for complete geographic queries.
- [x] Verify Preview commit `c06b4c0` on 28 November 2026. All 83 local suites, 139 JavaScript syntax checks, [GitHub Actions](https://github.com/zedwontmiss/studio-openings/actions/runs/46107365377) and Cloudflare Pages passed. Live Chromium confirmed the typing sequence, search recovery, tab navigation and profile links at 320 and 1280 px. The HTTP audit found all 135 canonical Preview pages healthy with noindex headers.
- [ ] Review live typing in the owner's Safari.

## Milestone · Article topic links

- [x] Render the same reviewed topics in the article header and article search. Include recorded city and country for the New York and London guides.
- [x] Review each of the six published articles and assign topics grounded in its text. Check that the generated reader and search index agree for every article.
- [x] Allow topic labels on reviewed editorial imports and verify that Remote still searches current vacancies.
- [x] Verify Preview commit `484f56a` on 28 November 2026. All 83 local suites, 139 JavaScript syntax checks, [GitHub Actions](https://github.com/zedwontmiss/studio-openings/actions/runs/46107974356), and Cloudflare Pages passed. Live Chromium verified all six headers at 320 and 1280 px, New York and Remote tag links, and Brand Design and Portfolio searches. The HTTP audit passed for all 135 sitemap pages.
- [ ] Review the New York guide in Safari.

## Milestone · Reviewed public release

- [x] Capture the previous healthy production commit `c48d5a7` and Pages deployment `f9319b7c-3310-4a4a-bac2-a6b6ed2a35f4`. The owner explicitly approved promotion of the reviewed changes.
- [x] Build release `ef8738d` from the current production base plus the reviewed development tree. Exclude all four staged IndexNow files. The workflow, migration, and worker paths were unchanged.
- [x] Pass 83 local suites, 139 JavaScript syntax checks, GitHub Actions and CodeQL, and the candidate Cloudflare deployment. Run the route and live Chromium checks against the candidate before promotion.
- [x] Confirm production Pages deployment `43ae5435-7c65-4d9d-bbb8-af0f15547111` and verify the deployed search file byte for byte on 28 November 2026.
- [x] Check all 135 public canonical routes, missing-route responses, the Tadaima withdrawal, and IndexNow key absence. Live Chromium passed partial search, article tags, saved jobs, job drawer, and external Apply link checks. The employer form loaded. The paid listing expiry boundaries were tested with disposable fixtures.
- [ ] Check the tagged New York guide and partial search in the owner's usual MacBook browser.
- [ ] Establish the search visibility baseline and review the first six emerging practices across six media. The editorial pilot and outreach are separate from the public code release.

## Milestone · Owner browser and account evidence

- [x] Reproduce the owner's plain topic links by serving the older cached masthead stylesheet. Give article and studio pills an independent stylesheet URL and add separators in the unstyled HTML.
- [x] Record the owner's first Google Search Console screenshots on 28 November 2026. The Pages report updated 23 November shows one indexed and 19 non-indexed URLs across five reasons. Google last read the successful sitemap on 27 November and reported 136 discovered URLs. The three-month Search results view shows six impressions, zero clicks and average position 6.5. These reports use different dates and scopes.
- [x] Compare sitemap versions. The earlier production tree listed 136 locations. The Tadaima withdrawal removed one and the currently deployed sitemap has 135 URLs. Google's screenshot supplies the last-read date and count but no URL list.
- [x] Record the Production `JOBS_DB` assignment to `studio-openings-db` from the owner's Cloudflare screenshot.
- [x] Verify production commit `165d51b`, Pages deployment `16a14918-8fc7-4920-9279-c2407b4c09a5`, on 28 November 2026. All 83 local suites, Actions and CodeQL passed. Live Chromium passed 16 visual checks with the older stylesheet at 320 and 1280 px, the unstyled spacing fallback and the New York search link. The 135 public canonical URLs passed the HTTP audit again.
- [ ] Recheck the pills in the owner's MacBook browser.
- [x] Confirm the configured Pages D1 separation from the owner's 28 November Cloudflare screenshots. Production `JOBS_DB` points to `studio-openings-db` and Preview `JOBS_DB` points to `studio-openings-preview-db`. Applied schema and runtime behavior were outside this settings check.
- [x] Record all 19 Google exclusions from the 23 November Pages baseline. Eight were excluded by `noindex`, two were alternate pages with a proper canonical, one was a redirect, seven were crawled and currently not indexed, and one was discovered and currently not indexed.
- [x] Repeat the public audit on 28 November for production commit `165d51b`. All 135 sitemap URLs returned 200 with self-canonicals and no index-blocking robots headers or meta directives. A sampled Preview profile still returned `noindex, nofollow`. IndexNow remains absent from Production.
- [x] Record the seven crawled-but-unindexed URLs supplied by the owner. Google last crawled all seven on 25 November 2026. On 28 November, Production `165d51b` served six as self-canonical sitemap pages with HTTP 200 and no index-blocking directives. The legacy `/post-a-job.html` permanently redirects to `/post-a-job` and is absent from the sitemap and all 135 pages' rendered HTML anchor links.
- [x] Audit content and internal links for the six canonical examples. Architecture, Culture, Industrial, Museum and Motion show distinct but brief HTML guidance and a filtered Jobs link. Their main areas measure 126–144 words including the other-discipline link list. They contain no individual job links. Each has 10–12 distinct incoming sitemap pages, mainly the other discipline pages. Culture, Industrial and Museum have the homepage as their only incoming page outside the discipline section. The employer posting page has one incoming rendered HTML link from the sitemap pages, on Advertise.
- [x] Add distinct early-career guidance and relevant studio and article links to the Motion and Culture pilot pages. Add direct links back from the London and New York articles. Preserve the existing canonical URLs and Jobs filters.
- [x] Verify Preview commit `df3fd49` on 28 November 2026. All 83 local suites, 140 JavaScript syntax checks, [GitHub Actions](https://github.com/zedwontmiss/studio-openings/actions/runs/46116633380) and Cloudflare Pages passed. Live Chromium passed six viewport checks at 320, 375 and 1280 px and 16 navigation checks. HTTP checks verified both guides and all ten linked studio and article pages, Preview noindex, production canonicals and 135-URL sitemap parity.
- [ ] Review the Motion and Culture pilots in the owner's browser before a separate public release.
- [ ] Use subsequent Google inspections to measure the pilots after an approved public release. The original audit did not isolate the cause of Google's indexing decision.
- [ ] Confirm whether the eight `noindex` examples are intentional exclusions before changing directives.

## Milestone · Discipline phrases in Jobs search

- [x] Give all ten discipline guides a Jobs link that fills the global search field with the guide's readable discipline phrase.
- [x] Use the same category match for the clicked phrase and the same text typed by hand. Allow everyday punctuation variants such as `motion 3d animation`. Keep older checkbox-filter URLs working.
- [x] Verify the longest tested phrases fit the search field on narrow screens. Check that clearing the search releases the category.
- [x] Verify Preview commit `fe7f154` on 28 November 2026. All 83 local suites, 140 JavaScript syntax checks, [GitHub Actions](https://github.com/zedwontmiss/studio-openings/actions/runs/46117762499) and Cloudflare Pages passed. HTTP checks verified all ten guide links, Preview noindex and production canonicals. Live Chromium checked four disciplines at 320, 375 and 1280 px, including full phrase visibility, click-versus-type job results, punctuation variants, clearing the field and legacy filters.
- [x] Reproduce the owner's `motion, 3d animatio` failure. Match unambiguous unfinished discipline phrases through the same category data as their complete forms. Preserve ordinary single-word matching and clear-search recovery for unrelated queries.
- [x] Add regression coverage for intermediate prefixes across all ten disciplines, punctuation variants, category membership and Studio results. Test forward typing and backspacing in Chromium with fixture inventory.
- [ ] Verify the unfinished-query correction on the live Cloudflare Preview.
- [ ] Review the visible search phrase and backspacing flow before public release.

## Resume and measurement

1. Read `AGENTS.md` and fetch current development/main refs. Keep the November baseline immutable and add changed evidence to this file with date, SHA, environment and relevant source links.
2. Start with P1-01 and fixture-level P1-02 while P0-01 is pending. In parallel obtain the P1-05 console/account evidence. Use the established 82-suite CI gate and targeted regression tests for newly changed behavior.
3. Verify the Preview binding before schema or source maintenance. Keep the existing Jobs, Studio and Article interface, search, filters, saved/opened/viewed, paid placement and Signal accent. Keep current release and sourcing protections.
4. Track weekly sitemap-eligible and indexed URLs by family, excluded reasons, non-branded impressions/clicks, verified active/expired/duplicate inventory, source freshness, p75 CWV where available, API/D1 usage, Apply clicks and paid order outcomes. Track Bing AI citations and identifiable AI referrals separately. Start with a dated 28-day Search Console/Bing baseline and report progress at the same cadence.
5. When a status changes, record the check that justifies it, any approval still needed and the next smallest task. A deployment check, Production behavior, search index coverage and outcome trends each need their own evidence.
