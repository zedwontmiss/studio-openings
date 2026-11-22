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

## Expected behavior from Codex
1. Inspect code, current branches and recent commits; do not reconstruct project from scratch.
2. Make a sensible plan internally and execute bounded tasks without unnecessary clarification.
3. Run tests and fix errors before reporting completion; if environment cannot run something, say so plainly.
4. Save changes to `development` and provide one concise Indonesian progress report: what changed, exact commit/PR, tests and next actionable item.
5. Never make a production merge or purchase/enable APIs or social automation without owner authorization.
