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

- Generate canonical studio profiles with operations/build-studio-profiles.mjs and --check. Preserve independently authored overview, official source links and jobQuery. Generated STUDIO_PATHS supplies dynamic sitemap; static sitemap must also be updated when adding new profiles. Existing search links are not exact employer-job associations.

- Feed reliability pass: preserve source priority and eligibility, progressively render successful feeds; do not dismiss open vacancy on passive updates. Hide loading/empty/error chrome from public UI; diagnostics in console/operator. Page H1 must describe index, separate from search label. Static HTML inventory and consolidated scheduled snapshot are next, not yet complete.

### Consolidated inventory pilot
Added /api/public-inventory for approved/indexed/editorial batches, preserving independent feed fallback and priority. Preview root HTML receives up to ten current eligible linked vacancies from same read-only sources through HTMLRewriter; no external scans, private applicant data, full descriptions or invented jobs. Production HTML injection opt-in PUBLIC_INVENTORY_ENABLED=true; no configuration changed. Other 23 feeds remain individual. No persisted cache or scheduled aggregation yet. Test actual preview HTML and budget for D1 reads; do not claim full inventory in initial HTML. Review seed eligibility/duplicate parity, featured placement, timeout and cache policy before release. New focused test added, not run in Node here.

- Inventory cache pilot only caches expiring editorial records for 300 seconds; recheck expiry/outreach on read. Keep approved and indexed batches live until revocation-safe persistent snapshot strategy is validated. Preview health workflow is read-only; scheduled workflows require default branch publication. Never claim global cache or active scheduled ingestion from a development-only commit.

- Persistent snapshot pilot is disabled unless isolated Preview binding and explicit INVENTORY_SNAPSHOT_ENABLED flag are confirmed. Staged SQL in operations/inventory-snapshot-preview.sql (not an applied migration). Fixed 17 AI/direct shards only, 15-minute maximum upstream age, no partial snapshot, allowlisted public fields, live fallback. Worker not deployed. Do not activate or migrate without owner approval and security review. Approved/indexed feeds stay live.

- Public canonical routes use extensionless paths; explicit known .html aliases redirect 308 on same host, preserving query. Never redirect operator/API paths. Static templates and generated profiles/indexes carry text-only Open Graph metadata; no invented images. Website schema identifies Studio Openings as publisher, not employer. Keep Preview noindex and existing job publication rights restrictions.

- Studio associations require exact normalized canonical employer name or reviewed alias plus recorded career-source hostname. No description substring matching or arbitrary ATS inference. Partial server-side associated openings on Preview; production opt-in. Absence does not mean no hiring.

- Owner-approved monochrome pill tags (transparent fill, neutral border, black selection), Featured yellow only, static grey search placeholder, typed text black. Studio public profile editorial typography and brief factual intro; source review metadata internal, one disclosure; cityId reserved for future Local links, no dead links. Future header studio openings / [place], Scene anonymous moderated, advertise commercial nav once offerings ready. Tag taxonomy review uses occupation/specialism/skill distinction; visible max 3, all evidence-supported terms searchable. Full live vacancy audit still required.

- Owner revised placeholder to lowercase black `search here` (static). Advertise header link highlighted baby yellow; dedicated /advertise gateway preserves /post-a-job packages and lists other formats as enquiries only. Local pilot uses studio openings / [place], 7 existing registry cities, noindex until content and evidence reviewed; no forum posting or fabricated local articles. City routes and links require collision/route verification before release.

- Local jobs use explicit city scope (`/?filters=1&city=slug#jobs`) rather than full-text search. Conservative exact first location segment + country/region evidence, excludes remote eligibility and ambiguous location strings. Visible scope and reset/global links; server initial global rows suppressed on city scope. Keep advertise label. Future exact source location IDs preferred; current match is partial, not comprehensive.

- Cities directory replaces header bring to your city; existing /coverage requests remain linked from /cities. Pilot city list and local pages remain noindex. Editorial city association uses explicit canonical cityIds, never inferred from studio names or article text; global articles are not misrepresented as local. No new article or forum content invented.

- Owner confirms one connected SOAPP data architecture, shared stable city/employer IDs and existing D1 binding; static generated read models allowed. Scene schema and moderated API staged only, no automatic migration or activation. Read/write flags off; anonymous submissions pending, operator-only moderation, report support, rate bucket HMAC. No forum public launch until abuse protection, retention/deletion, operator UI, isolation and security review.

- Owner revision: Local order Scene → Jobs → Article → Studio. Search UI visually unchanged; Studio and Article search only their own section, no job feed requests or job controls. Jobs is true global search; only show matching Studio/Article results after all currently matched jobs are revealed and feed loading has settled, not above jobs. No secondary matches while Saved view. Query follows primary nav. Scene read-only UI staged behind existing Preview flag; no writes activated.

- Owner correction supersedes previous Jobs search ordering: restore original global homepage search immediately showing matching Studio/Article titles ABOVE intact jobs grid, with no waiting for job feed or pagination. Only Studio and Article pages restrict search to own section. Scene operator tab staged using existing private console and credential; no activation.

- Scene topic/reply/report composer and mandatory server-side Turnstile verification staged. Writes require isolated Preview, read/write flags, separate rate secret, Scene site key/secret. No automatic activation or migration. Preserve existing global Jobs search and scoped Studio/Article search.

- Scene retention staged: operator-only dry-run and separately gated bounded purge, preserve published/pending records and unresolved reports; proposed 30-day rejected/removed, 90-day reviewed reports from creation, expired rate buckets. Never apply schema or enable flags without isolation and approval. No automatic deletion schedule.

- Owner approved Scene as fourth global primary nav destination, replacing Cities utility. /scene gateway, /cities redirects; canonical geographic IDs and city paths unchanged. London/New York only pilot reads/writes; other local directories accessible. Retention durations approved by owner, legal/privacy and integration review still required. Editorial starters private drafts, never fake anonymous community posts.

- Owner-approved masthead: studio openings / section (or city on Local); only brand links to /about. Far-right S/O links to /contact with accessible label and title; remove separate header contact and redundant more menu. Keep primary navigation and highlighted advertise. Preserve lowercase type and global/scoped search behaviors. Existing About content retained until owner approves a credo rewrite.

- Owner rejects polls. Scene is one simple free-form noticeboard: meetup notices, rants, employer criticism, salary comparisons, local culture. Permit negative opinions subject to safety/privacy and evidence standards. No forced categories, profiles or engagement mechanics. Founding contributors voluntary, no quotas, no moderation access; recruit personally from Indonesia via public organizational contact channels. Brand redesign deferred; prioritize data consolidation next.

- Owner v1 release scope: Jobs, Studio, Article only; retain Scene and local editions visible on exact development review hostname, hide from all other public deployments via server route guard and HTML link rewriting. City filters remain usable publicly; studio location links lead to scoped Jobs on public deployment. Do not activate community or delete Scene code. Preview hostname is not authentication; no confidential data there. Brand redesign deferred. Next sprint data consolidation and inventory automation.

- Data consolidation first: studio registry generates canonical city records and browser city IDs through operations/build-geography.mjs; fail on slug collision rather than silently merge. Preserve stable IDs, no physical D1 migration. Employer identity read model includes office cityIds, exact name+official host matching remains conservative. Location tokens must not conflict; remote eligibility excluded. Existing preview/public scope unchanged.

- Inventory snapshot pilot: five-hour max source age (four-hour cache + rotation slack), never refresh source timestamp on cache read; reject partial/truncated responses; least-recent attempt rotation with staged health table and operator-only health API. No migration, cron or production activation. Do not extend editorial seed expiry without source recheck.

- Lifecycle: complete official board scans only retire truly absent upstream UIDs; partial scans cannot increase miss count, first complete absence hides indexed job, second retires. Present but unnormalized remains subject to existing 72h last-seen expiry. Require explicit Preview isolation for ingest writes. Indexed candidate cap raised to 500; exact URL dedup on server and client, no name-only merging. Operator feed health read-only panel. No activation or production changes.

- Studio discovery: read-only isolated Preview operator candidates from approved career sources, flags identity conflicts and existing overlaps, excludes outreach holds. Vacancy locations never imply offices. Export for review only; no automatic publication or crawl.

- Studio expansion uses offline review staging with explicit evidence review, collision and outreach checks; no automatic publication. Vacancy city mappings never establish offices. Preserve firm-first coverage.

- Owner prefers meaningful milestone batches over micro-updates and delegates routine engineering decisions. Target 100 verified studio records; use operations/studio-acquisition-backlog.json as discovery leads only, not public data. No guessed offices, active jobs or partnerships. Keep production untouched until explicit release approval.

- Directory-only independent evidence review may publish studio profiles on development without D1 career-source approval; never treat this as authorization to ingest vacancies. Production promotion requires owner approval. Brand identity sprint last; restraint, no forced slogans.

- Studio geographic filter: owner prefers Excel-like country, region, city autocomplete, case-insensitive prefix matching, comma/Enter completion, keyboard/touch support. Native country/city selects retained hidden as generated data and fallback. No invented geography. Scope Studio only for initial review.

- Owner clarified OMA-inspired Studio: one existing large search for firm names, aliases, country, state/region or city; no location dropdown or second input. Category is sole filter, text-based collapsible + category. No changes to Jobs or Article search scope. Preview currently observed stale; verify Pages deployment before claiming live.

- Owner approved OMA-inspired filter layout: fixed left FILTER label, right-hand horizontal expandable text controls and option grids. Jobs and Studio only. Preserve eligibility, saved actions and existing featured priority. Automatic sort = Latest when no query, Relevance with query; explicit overrides persist until reset. No CV personalization.

- Jobs design correction: retain original vertical left sidebar and results on right; expandable plus/minus text choices for country, arrangement, employment and sort. Preserve existing discipline groups, salary checkbox, saved/reset, automatic sorting. Studio horizontal category layout unchanged.

- Jobs sidebar refinements: selected summary only when collapsed; country search on expansion, other filters options only. Keep Studio untouched. Repair extracted ranking regression harness to include effectiveSort.

- Jobs sidebar focus uses underline, not rectangular outline. Feed recovery: bound individual fetches to four concurrent requests, 25-second per-request deadline starts at dispatch, preserve rendered rows until replacement fragment is ready. No additional sources, retry loops, schedules or quota increases authorized. Live source counts still need verification; no claim of full inventory recovery. Preserve Studio and production.

- Approved Jobs and Studio visual baseline frozen. Browser-tab favicon is independent of the on-page S/O contact mark; fixed vector path and 16/32 ICO, no border. New independently reviewed directory entries do not authorize vacancy ingestion. No new scheduled work, paid features or production changes.

- Owner approved uppercase index labels: Jobs DISCIPLINE / CURRENT LISTINGS, Studio INDEX / + CATEGORY, Article EDITORIAL only. Do not expose topic or author filters before editorial foundation is ready. About and Contact brand preview uses compact editorial typography, direct links, whitespace instead of thin dividers; new copy subject to owner review. Preserve commercial terms and public Scene restriction. No production promotion.

- Advertise restores original two large white square-corner job package cards ($149/30 days, $349/90 days), no thin text dividers. Premium coverage proposed as public enquiry-only bundle across Jobs/Studio/Article; featured studio name and sponsored article headline use red illustrative treatment. Relevant search matches only; no paid ranking override, fake public sponsors, activated campaign, new pricing, or checkout. Actual placement data/lifecycle/disclosure integration remains future work. Independent editorial coverage is not for sale. Production unchanged.

- Owner approved small raised red (*) superscript for sponsored Studio and Article titles. Fictional examples injected client-side on exact development hostname only, never in registry/feed/sitemap/production; no genuine campaign or revenue activation. Future live sponsored results require clear visible disclosure and accessibility. Remove demo before launch.

- Owner approved sponsored dummy typography on preview. Retention milestone: browser-local saved shortlist supports direct /?saved=1, renders saved snapshots immediately, keeps search within saved view, distinguishes pending feed from unverified vacancy status, removes source names from saved metadata. No login or cross-device sync. Favicon appearance still owner-reported unresolved; do not alter on-page S/O mark.

- Directory expanded from 19 to 27 records using official location/career sources; no live vacancy claim, sponsorship or ingestion approval. Preserve existing UI and current pilot city scope.

- Studio-first operational strategy: directory membership separate from vacancy ingestion. Operator Studios workspace supports research and browser-local draft edits/export/import; not a live publishing system. Draft relationship and sourcing intentions have no side effects. No outreach or production merge.

- Persistent studio drafts: isolated Preview D1 only, explicit initialization, authenticated same-origin writes, revision conflict protection, evidence staging. Public registry remains generated/static; reviewed draft export is not publication. No schema activation by commit alone.

- Reviewed studio publication batches can be exported from authenticated Preview workspace. Use operations/publish-studio-batch.mjs in clean development worktree, dry-run first, explicit --apply regenerates index/profiles/routes/search/sitemap/workspace. Independently verify evidence and test before committing. No automatic production publish or job ingestion. Do not commit private draft exports.

- Employer relationships workspace uses authenticated isolated Preview D1, stable published studio IDs, manual activity history and opt-out tracking. No automated email, contact harvesting, personal data collection or changes to sourcing policy. Initialization requires owner confirmation. Existing outreach holds remain unchanged.

- Selective sourcing decisions are staged in isolated Preview D1. Reviewed export compiles only on development into the shared outreach policy; fixed Koto/Runway/Linear holds are immutable here. Directory profiles and employer-paid feed are unaffected. Standard means eligible under existing rules, not automatic approval. Do not commit private rationale exports. No rules activated by this implementation commit.

- Independent editorial workspace: isolated Preview D1, draft/review/export; private contributor and source notes excluded from public artifacts. Sponsored records rejected. Compiler validates additions on clean development branch; no live publishing, new author accounts or automatic messages. Existing article presentation unchanged.

- Commercial studio placement pilot: isolated Preview storage, manually agreed price, explicit payment reconciliation, activation flag, UTC date expiry and disclosed red (*) studio title. Existing job campaigns remain separate. Independent articles cannot be repurposed as sponsored content; dedicated sponsored article and premium bundle workflow still required. No activation, schema execution or production change by commit.

- Owner prefers flexible editorial operation with GPT-assisted content conversion; avoid further speculative editorial CMS complexity. Commercial bundle order ledger records custom terms, explicit payment and deliverables, but does not activate sponsored articles or bundled jobs. No real payment, migration or production changes.

- Solo-founder simplification: employer self-service uses a private signed 120-day Preview link issued only for paid published employer listings. No accounts, new database schema, or email automation. Close directly; corrections and renewals are prefilled manual email requests. Link is in URL fragment, omitted from requests/referrers and removed from address bar. Production enablement and individual revocation remain outstanding; rotating the operator secret invalidates all links. No production changes.

- Minimal analytics: existing anonymous traffic_daily and job_orders aggregates only; approximate visits, opened listing views, apply clicks, gross confirmed paid job-order receipts. No unique-person claims, ad impression claims, custom sponsorship revenue, new analytics schema or third-party tracking. Preview report only; traffic collection remains flag-gated and respects DNT/GPC. Feature freeze after analytics; prioritize integration tests and release readiness.

- Release readiness: syntax/CI failures are release blockers, even if Pages and CodeQL succeed. When inserting JS programmatically, use function-based replacement or slicing to avoid dollar-sequence substitution. Regression runner reports all failing suites without suppressing failure. No new features until release checks and D1 isolation are verified.

- Owner explicitly deferred Scene on development too. All deferred city/Scene public routes return 404 on every host; middleware removes Scene links and maps existing city links to job filters. Operator Scene tab hidden and selection disabled, moderation code/data retained. Restore only with explicit owner approval. Keep Jobs, Studio and Article public layout intact.
