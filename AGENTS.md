# Studio Openings — instructions for Codex and coding agents

## Mission and working style
Build and operate https://s-o.app, a minimal, global job index for **all** design and creative disciplines: architecture, interiors, landscape, industrial/furniture, product/UX/UI, graphic/branding, art and creative direction, motion/3D/VFX/games, fashion/photography, web/creative technology, museums and arts/culture.
User is a non-technical solo founder, targeting global and US audiences. Favor zero-cost tools, minimal dependencies and meaningful autonomous progress. **Do not repeatedly ask for screenshots or manual steps that can be verified through GitHub/CI or automated browser tests.** Only ask when credentials, external account creation, owner approval or the production-release decision is required. Respond in concise Indonesian and report evidence, not guesses.

## Hard release and UI constraints
- GitHub repository: `zedwontmiss/studio-openings`. Work **only on `development`**, Cloudflare Pages Preview: `https://development.studio-openings.pages.dev/`. `main` deploys Production: `https://s-o.app/`. **Never push to or merge into `main` without explicit user approval.**
- Keep existing homepage and established aesthetics: modern Craigslist-like, minimal typography, monochrome overall with compact colored skill chips. No homepage hero, no replatforming, no gratuitous redesign.
- On desktop and iPhone keep job title on **one line**, aligned with the posted date. Responsive header/navigation on **one row**. Tags display compact visual aliases, e.g. Architecture=Arch, Art Direction=AD, Creative Direction=CD, while searchable canonical full names and software names Revit/BIM/CAD/AutoCAD/UX/UI remain accurate. Respect screen width, avoid crowding and clipping.
- Target **MacBook Pro Early 2011/macOS High Sierra/Safari legacy compatibility** for the public website. Keep vanilla HTML/CSS/JS, avoid new bundlers, frameworks, dependencies. Founder can test on iPhone 11, but do not use founder as the main QA environment.
- Shared ZIP downloads, if needed, must contain a root folder with exactly the same base name as the ZIP archive. Do not require macOS CLI setup.

## Data integrity and SEO
- **Never invent job availability, locations, salary, applicant eligibility, employer verification or dates.** Full employer descriptions only where an authorized source permits reuse. Clearly attribute official sources and provide original application links. An open role may still be remote-US-only.
- Distinguish core disciplines and skill aliases (e.g. BIM vs Revit, CAD vs AutoCAD, Art Direction vs Creative Direction).
- Sourcing policy has two layers: high-coverage major metros/hubs **and verified exceptional high-quality independent creative firms in smaller towns**, with canonical verified location and current official vacancy.
- Default to independent studios, ~2–50 staff, for employer outreach instead of the biggest global corporations.
- Relevant existing code: `functions/api/jobs.js` (Himalayas/Jobicy), `functions/api/ai-jobs.js`, `functions/api/source-jobs.js`, `functions/api/indexed-jobs.js`, `lib/source-registry-core.js`, `functions/jobs/[id].js` and `lib/seo-jobs.js`, `functions/sitemap.xml.js`, `functions/disciplines/[slug].js`, `functions/openings/[id].js`, `lib/source-seo-policy.js`.
- The employer-submitted `/jobs/[id]` SEO and JobPosting schema are **conditionally gated** on approval, paid publication, trusted location data, real dates and expiry. Source SEO `/openings/[id]` is guarded behind `SOURCE_SEO_ENABLED` and normally OFF, and must NEVER be enabled until operator-verified permission, freshness and provenance are recorded **independently of potentially untrusted JSON from a source**.
- Distinguish Google homepage being indexed from comprehensive job indexing. Bing sitemap may be processing. Do not promise quick GEO/AI citations, SEO rankings, or indexing.
- Canonical is `https://s-o.app`; **never index Cloudflare Preview**. Expired jobs disappear from active sitemap and show nonindexable unavailable responses.
- Critical: Preview `JOBS_DB` D1 must be **verified separate from Production** before migrations or source-ingestion activation. Read `operations/INGESTION_PREVIEW.md`.

## Testing and quality gates
- Read `operations/ROADMAP_2026-11-22.md` before starting and update it with verified progress.
- Before every commit: run JS syntax checks and `node tests/descriptions.mjs`, `node tests/disciplines.mjs`, `node tests/seo-jobs.mjs`, `node tests/source-seo.mjs`. Add regression tests for new feeds/changes.
- CI: `.github/workflows/validate-sources.yml`. GitHub Actions build passing is distinct from Cloudflare Preview build passing; verify BOTH when possible before calling a change deployed. Do not conceal failures.
- Prefer **one cohesive tested commit or PR per feature** rather than numerous incremental pushes that trigger email floods. Do not claim unverified live behavior is fixed.

## Next chapter — distribution without spam
- Product goal: verified active job -> useful canonical SEO page -> channel-specific approved content -> attributable traffic -> apply clicks -> employer value.
- Founder prefers creative niche communities and small-studio email outreach, NOT a vibe-coder/founder-launch narrative or LinkedIn-first strategy.
- Build a **review-first publication queue**, with verified job state, exact original source, no repost duplicates, expiration safeguards, UTM attribution, manual approval and audit log. Start with drafts or exports; NO automated account posting at first.
- Reddit: company-owned subreddit may be created manually; bot/API posting requires current platform approval and compliance with Responsible Builder Policy, commercial permissions, spam rules and moderation. Do not automate crossposts to other subreddits without their permission.
- X: authenticate official API when allowed, confirm current pay-per-use pricing and budget before any live automation. No credentials in repo, no browser automation to bypass API.
- For initial cadences, pilot max ~1 relevant manually approved job/day for a new Reddit community and a few useful X posts/week; scale only with genuine audience engagement and platform compliance.
- Never connect unknown social accounts or take paid actions without founder consent.
- Outreach: research ~2–50-person independent creative firms with verified active hiring. No bulk unsolicited mail, no applicant-only recruiting inbox marketing, honor relevant email laws and opt-outs.
- Before recommending or scheduling paid-listing outreach, check `lib/outreach-policy.js` and public inventory. Put active outreach employers on the sourcing hold before outreach; do not automatically aggregate their vacancies while asking them to pay for a listing. Current owner-confirmed holds: Koto, Runway, Linear. Independently approved employer submissions may still publish through their existing payment/review gates. Do not auto-release a hold on a timer. Preserve this rule for subsequent outreach.

## Expected behavior from Codex
1. Inspect code, current branches and recent commits; do not reconstruct project from scratch.
2. Make a sensible plan internally and execute bounded tasks without unnecessary clarification.
3. Run tests and fix errors before reporting completion; if environment cannot run something, say so plainly.
4. Save changes to `development` and provide one concise Indonesian progress report: what changed, exact commit/PR, tests and next actionable item.
5. Never make a production merge or purchase/enable APIs or social automation without owner authorization.

## Product expansion and handoff (24 November 2026)
- Read `operations/PRODUCT_ROADMAP_HANDOFF_2026-11-24.md` for owner-approved Jobs / Studio / Article strategy and deferred SOAPP Local vision. Preserve established UI and stable URLs. Prioritize security/Preview validation before geographic or editorial expansion. Do not implement community/forum, new monetization checkout or account systems until separately approved.

## Public design identity
- Owner approves Helvetica-first typography across public pages (Arial fallback; available regular/bold/italic weights, no paid fonts). Owner rejected the oversized OMA-style navigation; retain original compact single-row Craigslist-like header and Helvetica-first typography. Do not reintroduce oversized navigation unless explicitly requested. Shared public header in `lib/public-header.js`, `assets/public-design.css`; all public pages and editorial templates must retain consistent primary jobs/studio/article links and accessible utility links. No duplicate small primary tabs or additional oversized search. Preserve existing job/studio filters and article reading layout; private operator UI is separate. Verify generated editorial files and mobile navigation after changes.

- Homepage global search: the existing #search input is the oversized Helvetica Bold SEARCH HERE field, not a decorative heading. Search jobs with existing filters and match published studio/article index entries via internal links. No oversized global header. Preserve this field and compact nav. Next design pass: shared grid, margins, spacing and typography hierarchy across pages; do not change before owner review.

- Owner confirmed live search should show only matches as characters are typed, no result counts, empty/loading copy, dropdown, or submit button. Keep black underline, native caret and Helvetica Bold input. Empty query restores default job board. Never reintroduce empty-result messaging during a live query. Job filters remain applicable to jobs; search current published index entries only.

- Global search results are title-only for studios and articles, displayed above the existing job grid only when matching. Job listing structure, metadata, filters, sorting and saved controls remain visible and functional during active search; no job matches leaves the listing area blank without hiding the filters. No horizontal separators between individual entries in jobs/studio/article lists; whitespace separates entries. Red title treatment is reserved for approved paid studio/article placements with explicit visible sponsorship disclosure; no fake sponsorships or automatic payment activation. Existing Featured Job terms and yellow treatment remain unchanged.

- Job board: all filters, sorting, keyword controls and saved jobs belong in the left sidebar. Current listings uses the same 12px bold hierarchy as Discipline. Hide feed-fetch timestamp, remove horizontal job list/row dividers; keep the global search underline and existing job metadata.

- Preserve saved-library initialization and toggleSavedView when moving controls. Public job listing must not display loading/fetching text; keep operational diagnostics in console/operator tools.

- Global search is the only keyword filter. Clicking a visible job tag toggles its text in the search field; manual queries and tag terms share AND matching. No persisted hidden keyword preferences or separate keyword UI. Legacy shared tag links convert to visible query terms. Keep all non-keyword sidebar filters.

- Shared public grid foundation in assets/public-design.css: 1200px outer frame, 22px desktop gutters, 13px mobile gutters, 792px reading measure, consistent 32px desktop/24px mobile top padding on editorial/utility pages. Preserve compact job layout and functional controls. Use section-appropriate typography; no oversized navigation.

- Sidebar categories use right-aligned plus/minus disclosure indicators, no horizontal separators. Discipline clear resets only discipline selections; disabled if none selected. Favicon is uppercase S/O on transparent background, without border.

- Sticky compact public header, sticky homepage search and desktop sidebar. Mobile filters remain collapsible in document flow to avoid obstructing results. Preserve drawer stacking.

- User-initiated global search edits and tag clicks return document scroll to top after rendering; passive feed updates and ordinary filters do not force scrolling.

- Near-edge shared desktop frame (18px gutters, 2vw above 1600px); preserve narrower reading widths. Studio filters use the same ten discipline keys and three parent groups as Jobs. Do not invent firms to fill empty disciplines.

- Global search is present on Jobs, Studio and Article indexes. Studio defaults to alphabetical names only with the existing discipline filter; Article defaults to headline/date only. Search uses existing job feed lazily on secondary indexes; local matches retain their index presentation and other content types appear below. Keep internal profile links and canonical URLs. Editorial generator owns article index markup; keep shared search shell synchronized with home when editing job UI.

- Studio index is one alphabetical vertical column on all screen sizes. Header studio openings wordmark stays far left and links home. S/O logo sits far right and links to About; no duplicate About text in desktop or mobile utility navigation. Jobs also links home.

- Keep compact Studio list spacing; suppress mouse-only header focus outline but preserve visible keyboard focus.

- Navigation must not shift between active pages: reserve link widths, primary product links bold with active underline, utility links regular. Remove Copy filters and separate discipline clear, retain one Reset and Saved jobs. Opening any vacancy resets drawer scroll only. Preserve visible search query when switching primary tabs.

- Studio registry source is studio-registry/published.json; run operations/build-studio-index.mjs and --check after changes. Stable IDs/slugs, multi-discipline array, office evidence, aliases and source review. Do not infer office locations or current hiring from careers URLs. Existing canonical profiles remain; generate new profiles and sitemap only after verified acquisition.

- Desktop header retains compact right-aligned Craigslist-style navigation with consistent spacing between Jobs and Contact; left wordmark and right S/O remain anchored. Discipline groups collapsed by default; no vertical sidebar divider. Mobile-specific redesign deferred by owner. Registry location records distinguish studio/office from gallery or museum; city-level evidence is not proof of hiring.

- Studio country/city filters use canonical country+region+city identity; same office must match both. Generated compact assets/studio-search.json supplies cross-index studio search. Maintain static names-only index and internal links. No geographic landing pages until meaningful verified coverage.
