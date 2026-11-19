# Studio Openings

A lightweight, curated job board for architecture, interiors, industrial and product design, visual design, fashion, creative technology, museums, arts and cultural institutions.

## Website

- Public site: https://studio-openings.pages.dev/
- Development preview: https://development.studio-openings.pages.dev/
- Production branch: `main`
- Test branch: `development`

## Product

Visitors can discover, filter, inspect and save creative job openings. Source links lead to the original vacancy. Employer-submitted listings are subject to editorial review.

Paid employer placement is planned as a one-time service: Standard USD 149 (up to 30 days) and Featured USD 349 (up to 90 days). Featured placements are limited and rotated. No impressions, applicants or hires are guaranteed. This development release does not collect card payments and does not send automated emails. Spotlight is not available yet.

## Technology

Plain HTML, CSS and JavaScript, Cloudflare Pages Functions, D1, and Turnstile. No local build tool is required.

- Files in `assets/` provide the public interface.
- `functions/` contains server-side routes.
- `lib/` contains reusable server-side policies.
- Private service credentials must be configured in Cloudflare, never embedded in public source.

## Release discipline

Changes are tested in `development` before a separately approved merge into `main`. Public build artifacts and server-side routes are not a place for passwords, invoices, customer payment records or private operational playbooks.

Owner-only setup, invoicing, database migration and operational instructions are maintained separately from this public repository.

## Editorial policy

External vacancies must be attributed to their sources and checked for accuracy, eligibility, location and currency of the opening. Visitors should verify requirements on the employer's authoritative job page.

## AI/creative employer sourcing (development)

Added 40 candidate Greenhouse/Ashby/Lever employer boards across seven six-source API shards: `/api/ai-jobs?shard=0..6`. Each source is checked live and responses are cached for four hours. Jobs are excluded unless they have a source-verified ATS link, supported creative title, and conservatively recognized job location/eligibility. Failure to fetch a source never creates placeholder vacancies. This is a lightweight on-demand expansion; scheduled ingestion and full D1 indexing remain future work.

## AI startup sourcing exception (v1.0.2)

AI-native employers are eligible irrespective of company size, public recognition or funding stage when they have a verifiable official ATS board and a currently advertised relevant vacancy (especially Product/UX/UI, brand, motion, 3D and creative AI roles). Funding stage, investment and growth may be used by the operator to prioritize employer outreach, but must not be interpreted as hiring evidence or ability to pay. Do not claim funding stages without dated evidence. Employer-first verification can override the priority-city list for an individual confirmed location; never replace the actual job location with the company's HQ. Unverified or closed roles are excluded.

For operator-added sources, the existing `verified_firm` qualification route covers AI startups without any D1 schema change. The public approved registry now reads four six-source shards (up to 24 approved boards). Source approvals and individual location mappings still require operator review; this is **not** a claim that 24 boards have been approved or that 40 listed companies have vacancies today. No production deploy or payment changes.

## Job quality and career-first ranking (v1.0.3 development)

Official Greenhouse/Ashby/Lever ATS descriptions are parsed into short plain-text excerpts, linked back to the authoritative vacancy. Third-party official feeds exclude postings without meaningful source description, rather than inventing copy. Ashby employmentType and Lever commitment are preserved, while unknown employment type remains explicitly unknown. Generic AI/software/cloud/data architects are excluded from building-architecture classification; bare Architect requires real physical-design evidence. Product/UX/UI roles are classified as Product. On the default Best match sort only, confirmed full-time roles appear ahead of unknown, part-time/intern, and contract/hourly roles. Newest and alphabetical sorts plus employment filters remain available. Source timestamps reflect the ATS's published/updated metadata, not inferred posting dates.

## Architecture firm sourcing pilot (development)

The development site includes a five-opening editorial pilot sourced from employer-owned job pages at Herzog & de Meuron and MVRDV. Verified November 19, 2026. These are short editorial summaries rather than copied descriptions; original vacancies remain the source of truth. Each entry automatically expires after November 26, 2026 unless reviewed again. This is not an automatic crawler, does not use Indeed/SEEK, and does not guarantee live vacancy availability after the manual review date. Three Swiss interior/architecture/BIM openings and two MVRDV architectural roles are included. User preferences for Full-time ranking remain unchanged.

## v1.0.6 — Listings-first homepage and location compacting

Homepage retains the original job board and filters, moving About to `/about.html` and free visitor vacancy suggestions to `/suggest-a-job.html`. `/coverage.html` and `/post-a-job.html` remain separate. Legacy `/#suggest` and `/#submit` links redirect to the appropriate standalone pages. No inline homepage suggestion, About section or regional form. Suggest reuses the existing secure editorial-review submission workflow, rather than creating new submission or payment infrastructure.

Listings append 20 at a time near the end of the viewport, using IntersectionObserver and a legacy Safari scroll/manual fallback. This exhausts the currently loaded jobs; it is not server-side infinite indexing or a change to ATS ingestion. The browsing filters, job details, saved jobs, ranking and sponsored placement remain the same.

For **three or more semicolon-separated US office locations**, listing cards show `United States (selected)` only if each segment explicitly ends in `United States`, `USA` or `US`. Full unmodified office lists remain visible in the job details and title hover text. This is not interpreted as remote eligibility or applicable to mixed-country listings.

## v1.0.8: paid-only public intake and paced browsing

The public Suggest route is retired. Existing `/#suggest` and `/suggest-a-job.html` links redirect to paid `/post-a-job.html`; the public `/api/submit` endpoint now rejects `kind: suggest` so the paid gate cannot be bypassed via the old UI. Historical D1 suggestions and operator-approved editorial sourcing are retained. Organic jobs indexed independently by the operator remain non-sponsored, while employer-requested advertising requires payment after review.

The board now shows 10 jobs initially, then appends eight after a visitor scrolls near the end, with a 450 ms 'Loading more openings…' pause. The browser's actual scroll is unaffected, and no automated intersection cascade dumps the full dataset. The feed ends naturally once all current API results are shown. This is client-side progressive disclosure, NOT yet server-side pagination or scheduled ATS ingestion.

## v1.1 — Opt-in D1 snapshots

Source jobs from operator-approved official ATS boards can be refreshed into D1 snapshots. Includes source-health monitoring and 72-hour expiry. New indexed feed is **off by default** and original ATS feeds are preserved for rollback. See `operations/INGESTION_PREVIEW.md` for Preview-only D1 migration, secrets, and optional separate Cron Worker setup. GitHub commit does not configure Cloudflare resources. No production changes, payment updates, or claimed new live vacancies.
