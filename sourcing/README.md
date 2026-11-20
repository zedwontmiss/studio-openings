# Studio Openings — Top firm discovery (19 November 2026)

**Current research:** 11 categories × 50 curated candidate firms/organizations = **550 category placements**, with cross-category duplicates. This is NOT 550 validated employers and certainly NOT 550 open jobs. The candidates are our own editorial shortlist, not a copy of any individual Top 50 ranking. The ranking/directory links provide category-level research leads, not proof that each named firm appears in the source.

**Verified career landing pages:** 31 official URLs found during research. This means a career page was observed, NOT that an individual creative vacancy, ATS token, permission or full-time role has been checked.

## Files
- [Editorial employer candidate catalog](editorial-employer-seeds-2026.json) — name-only discovery pool + editorial reference URLs per category
- [Observed official career pages](verified-career-pages-2026-11-19.json) — primary-source career links to inspect

## Mandatory validation before publishing a job
1. Resolve canonical company name; deduplicate subsidiaries, brands and rebrands. Mark closed or merged businesses inactive.
2. Inspect official career page. If supported: Greenhouse, Ashby and Lever adapters already exist. Hibob, Softgarden, Personio, Recruitee, Workday and bespoke pages **need new, permission-respecting adapters or manual verification**; never generic HTML scraping.
3. Find a specifically advertised live vacancy; verify its official job URL, meaningful description, physical-design scope (architect != deployment/cloud architect), truthful job location, applicant eligibility, work mode, explicit employment type and any closing date.
4. Record per-job verified timestamp and expire stale source records. Under no circumstances create placeholder jobs from a careers landing page.
5. Keep curation diversified. **AI is not the goal**: architecture/landscape, interior, industrial, graphic/branding, 3D/motion/VFX, photography, fashion, museum and product design all deserve proper coverage.
6. Check source website terms and robots. Never infer rights to bulk redistribute from a publicly readable page; do not scrape Indeed/SEEK without permission.

## Outstanding development tasks, independent of this sourcing backlog
- **Source ingestion:** currently on-demand APIs, 7 AI source shards and 4 approved registry shards (up to 24 operator-approved sources). Build periodic ingestion and stale-job cleanup with D1, observability, per-provider rate control and source health.
- **Operator/Preview readiness:** verify Cloudflare Preview D1 migrations, `job_orders`, source registry tables, complete approval/payment gates, and Turnstile on deployed preview.
- **Monetization:** manual invoice and payout verification present in code; payment checkout and automatic transactional emails not implemented. Keep operator-only financial actions private.
- **Launch QA:** job detail URLs/SEO, anti-abuse, duplicate identity, permissions/usage conditions, accessibility and error handling. No deployment or live availability test confirmed from this research pass.
- Sourcing research **does not block v1.1**; the next development should target reliable ingestion + operator source management in the `development` branch, then payment/email after tests. No merge into `main` without approval.
