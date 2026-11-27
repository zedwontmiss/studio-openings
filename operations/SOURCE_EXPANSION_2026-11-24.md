# Official career sourcing — 24 November 2026

This is a dated verification sample, not a guarantee of permanent inventory.
Keep the 50-active-jobs-per-discipline goal open. Do not count general applications,
invent locations, or release Koto / Runway / Linear outreach holds to meet it.

## New integrations

| Employer | Official discovery path | Verified roles | Discipline |
| --- | --- | --- | --- |
| Whitney Museum of American Art | https://whitney.org/about/job-postings → https://jobs.whitney.org/ | Web Operations Producer; Registrar, Exhibitions | Web; Museum |
| Gagosian | https://gagosian.com/jobs/ | Image Archivist, Beverly Hills | Photography |
| MoMA PS1 | https://www.momaps1.org/en/about/jobs | Production Assistant; Senior Registrar, Exhibitions | Arts; Museum |
| CoCreativ / Industrial Color | https://industrialcolor.com/about/ → https://apply.workable.com/cocreativ | Photographer / Videographer / Editor - Beauty; Freelance Retoucher - Industrial Color | Photography |

Seven current roles: Web 1, Photography 3, Museum 2, Arts 1. Career index
membership and the matching detail/application evidence are required on each
scan. These are short source excerpts; no source SEO permission is granted.

Whitney's visible title, location and application form must agree with its
JobPosting metadata. Its `validThrough` further limits the six-hour record TTL.
JSON-LD is used only for factual vacancy metadata, never permission/provenance.
Gagosian's Image Archivist is included because the actual tasks cover photography,
Photoshop retouching and color correction. Artist Liaison is excluded: its
reviewed duties focus on sales/client administration. Seasonal generic internship
programs, facility, security and engineering positions are excluded.

PS1's website links the MoMA UKG board. Canonical detail URLs are fetched directly
after verifying the same-board redirect from the older link. Embedded JSON is
parsed as data, never executed. The exact vacancy ID, externally published board
membership, open state and Long Island City address must agree. Production
Assistant covers stage management and technical production for live arts events.

Industrial Color explicitly links CoCreativ's Workable board. Its public widget
supplies current membership; its advertised public Markdown detail supplies the
description and application link. The role, New York location and employment
type must agree. The freelance retoucher vacancy specifies ongoing project work
and a selection process; it is not merely an unsolicited talent-pool signup.
Ambiguous salary metadata (e.g. USD 100–130 without a period) is omitted.

All four adapters use reviewed URL patterns, manual redirects, bounded payloads,
an eight-second scan budget, six-hour freshness and partial-failure reporting.
The shared daily Preview health script automatically includes these sources;
the scheduled workflow remains pending an approved default-branch release.

## Reviewed but not counted

- Dogstudio: general applications; no individually verified active vacancy.
- Fantasy: no currently listed role in the inspected careers page.
- Hauser & Wirth: verification blocked by the site's challenge; no bypass.
- Resn, makemepulse, Spring Studios: inspected pages did not expose enough
  verifiable detail; require a source-specific follow-up, not invented records.
- Milk Studios and UNIT9: guessed careers paths returned 404; do not scrape
  those paths as if they were valid feeds.
- BASIC/DEPT and Hello Monday: avoid duplicating the existing DEPT board.
- `cocreativ.com` is a different coworking business. The official Industrial
  Color link above establishes the correct employer/board identity.

## Next acquisition work

1. Extend the verified MoMA board path to relevant conservation, collection and
   public-program roles on MoMA's own current career index.
2. Inspect specialist creative technology firms and fashion/photo studios;
   prioritize explicit current roles over a large unverified employer list.
3. Expand title coverage only after inspecting responsibilities and location.
   Unrelated administrative roles should not pad sparse creative categories.
4. Check outreach holds before every employer addition or recommendation.

No paid APIs, D1 changes, social posting, email actions or Production release
are part of this sourcing batch.
