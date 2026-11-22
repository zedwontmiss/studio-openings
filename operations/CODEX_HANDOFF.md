# Codex handoff + organic distribution implementation

**Start here:** read [../AGENTS.md](../AGENTS.md), [ROADMAP_2026-11-22.md](ROADMAP_2026-11-22.md), [INGESTION_PREVIEW.md](INGESTION_PREVIEW.md), then inspect the `development` branch and CI.
Do not rebuild the website. Do not modify `main` or Production.

## Current verified state as of Nov 22, 2026

- Google Search Console: homepage `https://s-o.app/` indexed (owner screenshot). `sitemap.xml` contains seven Production general URLs; newer ten discipline pages and SEO source route are still only in `development`.
- Bing Webmaster Tools: property imported; sitemap submitted and processing (owner screenshot).
- Cloudflare Web Analytics: enabled in Pages; actual Production traffic beacon not yet confirmed after a subsequent Production deployment.
- Cloudflare Pages Preview and GitHub Actions were both green for older Nov 22 commits in screenshots; later source-SEO commits had an Actions failure notification. Latest CI and Pages Preview must be re-verified; do not presume they pass.
- Server-rendered individual employer submission pages: `functions/jobs/[id].js`; eligibility `lib/seo-jobs.js`. Only for approved employer submissions meeting verification and paid publication safeguards.
- Editorial category pages: `functions/disciplines/[slug].js` and `lib/discipline-pages.js`; not a separate job inventory.
- Source SEO: `functions/openings/[id].js`, `lib/source-seo-policy.js`. Feature OFF by default; currently lacks independent rights approval process and cannot be activated safely.
- Latest distribution draft code: `lib/distribution-drafts.js` and `tests/distribution-drafts.mjs`. These **only produce text drafts**, do not create a queue, publish, authenticate with Reddit/X or prove actual user traffic.
- Existing SEO tests: `tests/descriptions.mjs`, `tests/disciplines.mjs`, `tests/seo-jobs.mjs`, `tests/source-seo.mjs`.
- No paid API budget, no arbitrary scraping and no browser-based posting bots.

## Immediate Codex task (execute, do not merely plan)

1. Checkout `development` and inspect latest GitHub Actions run (including all failures), Cloudflare Preview status where accessible, and source code.
2. Run **all** dependency-free Node tests and JS syntax checks in a controlled environment; fix failures and add tests. Batch changes into one cohesive PR/commit to `development`.
3. Audit existing job feeds and the new gated source SEO route for untrusted `seoPermission`/verification fields, provenance, expiry, date freshness and republishing restrictions. Ensure an external ATS record **cannot self-assert operator approval**. Keep `SOURCE_SEO_ENABLED` false until robust and independently validated. Do not fabricate `JobPosting` markup.
4. Build a **D1-backed reviewed distribution queue** for eligible verified vacancies (preview environment only after D1 isolation confirmed). Requirements: deduplication by source/job/channel, 72h source freshness or stricter, expire/withdraw on closure, admin review, dry-run drafts, UTM tracking, status transitions, audit trail, safe retry, rate limiting. No live social posting without platform access and owner authorization.
5. Add export/copy drafts for Reddit and X. Only add live API clients after current documentation, permissions and commercial approval reviewed and user connected accounts. Reddit policy: commercial bot access requires approval, no repeat spam across subreddits. X API: pay-per-use and owner consent to any charges.
6. Keep existing mobile/desktop UI. Test changes, verify Preview and CI, report exact SHA, tests, roadblocks. Never deploy to `main` without explicit user approval.

## Owner steps when asked (not needed for code work)
- Create a legitimate Studio Openings Reddit account through reddit.com/register and a subreddit (e.g. r/StudioOpenings only if available/eligible); configure description, rules, and moderator access. Manual posts to own subreddit first.
- Create an X account representing Studio Openings through x.com/i/flow/signup; choose available handle and turn on 2FA. Do not share credentials or API keys in chat.
- Post manually for a short pilot; establish a useful cadence and measurement before activating automated posting.
- API publishing requires explicit account authorization and owner approval. Reddit commercial developer access must be approved; X API incurs usage charges.
- Cloudflare Production and GitHub main should remain protected until verified product review.

## Organic search work still open
- Indexable production individual job URLs for verified jobs, public links/canonical/sitemap.
- Proper `JobPosting` only when Google rules and data completeness permit.
- Reliable job lifecycle verification/removal and official-source content rights.
- Full Production analytics integration, outbound Apply-click events and referral attribution.
- Crawl and indexing monitoring (Google Search Console, Bing Webmaster), plus useful employer and community referrals.
- Avoid empty programmatic city pages, fake job freshness or automated SEO content farms.

## Organic Reddit / X pilot
- Reddit (own community): 1 manually reviewed job/day, alternate disciplines, meaningful location/salary/eligibility details; no automatic crossposts to third-party subreddits.
- X: 2–4 curated posts/week, with useful context and tagged attribution; avoid identical bulk job-post tweets.
- Build source -> verified snapshot -> approved queue -> export -> manual publish -> monitor. API posting is a later optional layer.
- Track referrer, query/UTM parameters and genuine Apply clicks; no claim of hiring/placement.

## Suggested first Codex prompt
> Work on the existing GitHub repository zedwontmiss/studio-openings, branch development only. Read AGENTS.md and operations/CODEX_HANDOFF.md. Do not ask me questions answerable by repository code, GitHub Actions or automated tests. Immediately investigate failed recent CI, fix it, then develop a safe D1-backed operator-reviewed Reddit/X distribution queue with drafts but NO external auto-posting. Verify the source and SEO integrity gates, run tests and validate Cloudflare Preview. Keep main and s-o.app unchanged. Report evidence and any single essential owner action in Indonesian.
