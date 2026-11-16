# studio openings — plain-text creative and architecture jobs (v0.4)

**The previous directory-of-job-boards has been replaced with individual job postings.** This is an actual job search interface, with live listings loaded on Cloudflare Pages from two permitted public feeds. Inspired by the utility of classic Craigslist, not its visual branding.

## What works
- A dense, mobile-friendly list of *individual* jobs, not job boards.
- Search by job title, company, skill; filter by creative discipline, region and employment type; sort newest/title/company.
- Save jobs in this browser (`localStorage`), show saved jobs, and load more.
- Transparent source attribution on each row; application links point to the original Jobicy/Himalayas URL, as required.
- **No AI API, database, login, paid API, giant front-end framework or build tool.** Static site + one Cloudflare Pages Function.
- The deployed live API fetches recent job openings and caches them at the edge for three hours.
- No fake job counts, paid placement widgets, payment processing, or speculative salary estimates.

## Local design preview vs live jobs
- Double-click `index.html` to view layout and filters offline.
- **Local preview rows are demonstrative, not real job vacancies.** They are conspicuously marked as examples and have no application links.
- Only after deployment to Cloudflare Pages does `/api/jobs` run and deliver real job listings. Cloudflare Pages Functions will not run from a `file://` preview or a regular static server.
- If live APIs fail, the site shows a clear error rather than pretending old postings are active.

## Deploy to Cloudflare Pages (no domain purchase)
1. Create a GitHub repository with all files at the project root (`index.html`, `assets/`, and `functions/`).
2. In Cloudflare Dashboard → Workers & Pages → Create Pages, select **Connect to Git**, choose the repository and deploy. Framework preset: None. Build command: blank. Output directory: root / `.` (Cloudflare UI may accept `/` or `.` for static root).
3. Use the free `*.pages.dev` URL and verify both `/` and `/api/jobs`.
4. Test outgoing job URLs, filters, date labels and mobile layout. No database migrations or API credentials.

**Important:** Cloudflare Pages *Direct Upload* support for Functions has differed from Git deployments. **Use Git integration** for the provided `functions/api/jobs.js` route. Uploading only the static HTML ZIP can result in an empty job feed.

## Data sources & obligations
- Jobicy Public Jobs API: https://jobicy.com/jobs-rss-feed and https://github.com/Jobicy/remote-jobs-api. Public use permitted with credit, canonical Jobicy listing links, no pretending to own the jobs. Do not refresh more than once hourly. Our function caches for 3 hours.
- Himalayas Remote Jobs API: https://himalayas.app/docs/remote-jobs-api and https://himalayas.app/terms . Public commercial display permitted; each Apply link uses the provided `applicationLink`, and each row credits Himalayas. **Do not syndicate to third-party aggregators, including Google Jobs, or output `JobPosting` structured data for syndicated jobs.**
- The site intentionally contains no `JobPosting` JSON-LD for imported jobs.
- Jobicy feed covers the last ~7 days; Himalayas updates daily, but jobs can close earlier than scheduled. Prospective applicants must confirm on the source site.
- Initial feed only contains remote positions from these two sources; on-site and hybrid roles would require additional employer-authorized sources.

## Software maintenance & risk
- Source providers can change fields, rate limits, permissions or API behavior; then the function may need an update.
- Cloudflare's free quotas and source free allowances apply. An API is involved, but no *paid* API or AI inference is needed for this MVP.
- Public job listings can be scams or expired. This version relies on upstream moderation and dates; it doesn't independently verify employers or guarantee availability.
- Salary shown only when provided in source; no estimates.
- For monetization, wait for traffic before adding submissions/sponsors. You can add an employer-submission workflow later, requiring moderation and payment validation.

## Project structure
- `index.html` : semantics, layout, filter controls, row template.
- `assets/styles.css` : responsive minimalist editorial style.
- `assets/app.js` : filtering, saving, live API fetch, honest local-preview samples.
- `assets/favicon.svg` : original monogram.
- `functions/api/jobs.js` : free edge adapter, normalization, attribution, deduplication and 3-hour cache.

## Testing
Use Node.js to syntax-check:
`node --check assets/app.js`
`node --check --input-type=module < functions/api/jobs.js`

For actual live API integration, verify on your Cloudflare Pages URL after deployment; the development container used to package this ZIP cannot directly reach the job API hosts.

## v0.4 changes
- Removed the announcement bar and large hero entirely; the job board is visible immediately.
- Simplified visual system to white, black and gray with Arial/Helvetica; no accent colors or emoji.
- Default first page contains 10 vacancies; short about section follows the listing and Show more control.
- Added Architecture / BIM and Interior / spatial categories; included relevant remote job-search queries and filters out common software-architect positions.
- Preview examples now include architecture and interior roles. Actual data after deployment still depends on available authorized feeds; broad on-site architecture job coverage is not yet supported.
- API sources and permissions are unchanged; there is no live employer/job-feed submission endpoint yet. That requires a persistent collection destination and moderation.

## v0.4 changes
- Rebranded to Studio Openings (temporary Cloudflare Pages project slug: `studio-openings` if available).
- Removed the total job counts from the heading, category filters and results summary. Saved job total remains personal to the visitor.
- No changes to job feed integrations, permissions or deployment procedure.
