# Studio Openings — v1.0 development release candidate

A compact, global, creative-industry job board built with plain HTML, CSS and JavaScript, Cloudflare Pages Functions, Cloudflare D1, and Cloudflare Turnstile. No local build tools, paid AI APIs, frontend accounts, or paid job-posting gateway are required.

**Branch policy:** Test in `development` first. Never merge into `main` before owner approval.

## Job supply
- Visitors browse sourced jobs for free. External vacancies come from attributed Jobicy, Himalayas and a limited set of employer-owned ATS feeds, plus independently approved creative career sources.
- Visitor suggestions of existing public openings are free, editorial, and do not buy placement.
- Employer-initiated job submissions are **paid by default**: Standard USD 149, up to 30 days; Featured USD 349, up to 90 days. All require editorial review, invoice and independently verified funds before publication.
- Featured placements use existing baby-yellow background and star; shown with daily rotation, never more than ten in a filtered feed. No guaranteed views, ranking or applicants.
- Spotlight USD 599 is **not implemented and not for sale**.

## How a paid order works
1. Employer chooses Standard or Featured and submits details after Turnstile.
2. Server inserts `job_submissions` + `job_orders` together, both pending; nothing public.
3. Operator verifies source/employer, then prepares/sends an actual invoice **manually** from a working business email.
4. Operator marks invoice sent only after doing so; then confirms payment against their bank/provider statement, with a reconciliation reference.
5. Operator performs final vacancy check and publishes the paid job. Featured starts a 90-calendar-day campaign on publication (requires `PREMIUM_ACTIVATION_ENABLED=true`).
6. Listings expire after their purchased term or when closed, and must be independently reverified every ~30 days to remain displayed.

**There is no payment gateway, no card capture, no automated invoice, no automatic email, no mailing-list signup in this version.** Do not promise any of these. Configure and test `hello@s-o.app` as a real sender before inviting paid buyers. Issue legally appropriate invoices and refund terms; never record payment based on a screenshot alone.

## Infrastructure
- Pages: `studio-openings.pages.dev` (production, `main`) and `development.studio-openings.pages.dev` (`development`).
- D1 binding: `JOBS_DB`, separate preview and production databases.
- Secret: `OPERATOR_ACCESS_TOKEN` (unique 32+ characters; never in Git).
- Secret: `TURNSTILE_SECRET_KEY`. Text/public: `TURNSTILE_SITE_KEY`. Text: `SUPPORT_EMAIL`.
- Optional Text: `PREMIUM_ACTIVATION_ENABLED=true` only after testing preview Featured workflow; false/missing fails closed.
- `NATIVE_APPLY_ENABLED` should remain unset/false until forwarding, consent, delivery and retention are ready.
- Run the `job_orders` migration in **Preview D1 before uploading** this revision. Production migration only when launch is explicitly approved.
- Cloudflare Worker/Pages and D1 quotas and WAF/rate limits still require operator monitoring.

## Publishing gates
- Employer posts without paid/published orders do not enter `/api/approved-jobs`, featured listings, SEO detail pages or the sitemap.
- Approval of curated visitor suggestions is separate and free.
- No premium placement is activated without paid order and owner feature flag.
- Existing code does not give any third party read access to stored candidate applications; native apply is off by default.

## Release validation
- 19 local D1+API integration checks passed (including unpaid rejection, review/invoice/payment workflow, featured activation, expiry, and private operator authorization). This is **not** a live Cloudflare test or security certification.
- After deployment to development, verify real Turnstile, D1 binding, packages in the drawer, operator workflow, geographic selection and responsive views.
- Never submit invented job listings to the actual production board. Clear QA records from Preview before using it for real customers.

See OPERATOR-GUIDE.txt for exact owner steps and OWNER-NOTES.txt for security/limitations.
