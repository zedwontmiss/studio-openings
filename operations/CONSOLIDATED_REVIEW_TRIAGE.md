# Consolidated review: repository-backed triage

Owner constraints: no redesign, no new paid service, Standard $149 / Featured
$349 unchanged, no Production promotion without explicit approval. This review
does not authorize new emails, payment activation or platform posting.

| Phase | Existing evidence | Current batch / remaining work |
| --- | --- | --- |
| 1 Reliability | app.js has URL-backed drawers, popstate handling, persistent Saved records and error UI; regression suites exercise saved/expired states. | Add bounded feed/config requests, preserve loading/error labels during filtering, report partial source failures. Verify UI Back/Forward and mobile in browser. |
| 2 Sourcing | ATS adapters, direct HTML adapters, D1 source registry, source-sync Worker, lifecycle/duplicates tests already exist. Outreach holds protect Koto/Runway/Linear. | Fix ISO verified-date display. Worker deployment/cron is not proved by repository presence; do not claim scheduled ingestion active. Broad sourcing expansion and failure alerting remain open. |
| 3 SEO | Employer /jobs pages, gated /openings pages, canonical host, sitemap, robots, discipline pages and SEO expiry tests exist. | Do not bypass source rights gates. Shareable job URLs exist; complete shareable search/filter state remains a follow-up. Avoid duplicate/empty location landing pages. |
| 4 Candidate | Save/viewed indicators, Apply links, salary and arrangement filters, privacy-aware traffic exist. | Add mixed Motion/Graphic title matching, actual skill text search, country filters based on inventory. Do not infer remote eligibility from broad regional labels or claim applications delivered. |
| 5 Employer | Submission, review, manual invoice/payment gates, operator closure and spam protections exist. | Collapse optional import and eligibility, keep user edits during import, fill explicit short employment/mode lines and labelled Apply URLs, improve city ranking, correct remote country selection. Real submission-to-invoice receipt remains untested. |
| 6 Retention | Review-first Reddit/X draft queue, copy/export limits and aggregate tracking exist; About/contact pages exist. | Opt-in alerts, weekly digest, RSS and source alerting are not in this bounded reliability batch. No automatic publishing or paid APIs. |
| 7 Commercial | Standard and Featured already approved and implemented; manual payment verification and featured tests exist. | Preserve prices. Do not build duplicate checkout/dashboard. Renewal/bump/sponsorship remain proposals. Audience and employer outcomes must be measured, not fabricated. |

## Scope intentionally deferred

- Full-description/excerpt redesign: the owner asked about feasibility, and
  prioritized the other audit findings first. Short source excerpts must remain
  faithful and within applicable reuse permission.
- More inventory, including 50 active jobs per category: still open; these UI
  fixes do not manufacture supply.
- New retention services and live social posting: deferred until core behavior
  and actual demand justify them.
- Physical High Sierra Safari/iPhone tests, real invoice delivery and payment:
  not established by automated tests.

Implementation uses existing vanilla JS, Cloudflare endpoints, browser-local
drafts and Node tests. No dependencies or migrations added.
