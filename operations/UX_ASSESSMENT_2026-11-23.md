# Production UX assessment — 23 November 2026

## Release evidence

Owner authorized the outreach correction and requested a user-perspective
assessment before asking them to review. PR #4 merged development into main as
`c5f73f21eba46ba059b7b3324d63b98379939657`. The implementation candidate passed
18 regression/integration suites and PR CodeQL checks. Cloudflare Production
deployment succeeded. A post-release read of all 19 public inventory requests
returned zero Koto, Runway or Linear jobs, no failed requests, and three Further
jobs. No emails, accounts, payments or database migrations were changed.

## Method and limits

Hands-on desktop Chrome session on s-o.app, using the actual public UI. Tested
search, discipline filtering, empty-state recovery, drawer close with Escape,
Save across reload, a shared detail URL in a separate tab, package selection,
text import and US/New York/city selection. Used fictitious Example Studio
text only in the local form; did not submit it, upload a document, solve a
challenge or pay. Cleared the working form by returning to pricing.

This was not a physical iPhone or legacy Safari test. Earlier responsive
regressions do not prove those browsers. Submission receipt, invoice delivery,
payment and publication were not exercised end to end on Production. Code
inspection confirms the submission result says no automated email is sent;
that is not evidence of a delivered customer acknowledgement.

## Findings

| Priority | Observation | User consequence | Recommended next work |
| --- | --- | --- | --- |
| P1 | Homepage shows Silverback Strategies' Senior Motion & Graphic Designer, but selecting Motion / 3D / VFX / Games shows only OpenAI's Motion Designer. | A relevant mixed-discipline role is not discoverable in the expected filter. | Support evidence-based multiple discipline matching without turning every mention in a description into a category. Add a regression for this actual title. |
| P1 | Region offers Anywhere, United States and Worldwide only, despite London jobs being present. | UK users cannot express their country with the region selector and must discover the text-search workaround. | Populate supported countries from verified inventory and distinguish office geography from remote eligibility. |
| P1 commercial | Motion has one displayed role; Web has three after outreach holds. Standard costs $149 and Featured $349. No audience or employer outcome evidence was verified in this audit. | A cold-email recipient has little visible evidence of the value of a paid placement in the sparse categories. | Add inventory from non-outreach employers and validate the offered value. Do not claim traffic, applicants or placement guarantees. |
| P2 | Granola's Web & Brand drawer contains an introduction and only the first responsibility before the excerpt notice. | Users must leave the site to assess qualifications and the complete role. | Make the short-preview nature obvious earlier and prioritize decision-useful facts; do not copy unauthorized full text or invent missing requirements. |
| P2 | Pasting a clear sample title, company, location, employment, hybrid mode, description and URL reports four extracted fields; company, verified location, arrangement and other items still need manual completion. | The import promise can feel broader than what the helper actually does. | State which fields are supported and show missing required fields clearly. Keep location verification explicit. |
| P2 | Searching New York in the employer city picker lists “New YorkJersey CityNewark urban area” before New York City, followed by county and other place names. | Employers must distinguish a city from a metro area/county in an otherwise 'verified city' workflow. | Rank exact city names first and label or exclude non-city geographic entities where inappropriate. |
| P2 | The employer form is long; successful submission is followed by manual review/invoice, with no automatic confirmation email in the implemented response. | More effort before requesting review, and uncertainty after sending. | Validate a controlled receipt-to-invoice workflow before treating paid conversion as proven; give a clear response expectation only if operationally supportable. |

## What worked

- Search for London returned Further and Granola roles.
- An impossible search showed an empty state; Clear filters restored browsing.
- The job drawer exposed original source and Apply links to the same official
  Ashby vacancy. The application itself was not submitted or completed.
- Escape closed the drawer. Saving a job survived reload. Copy link displayed
  its confirmation; independently opening the observed job URL restored the
  correct Granola drawer in another tab.
- Standard selection showed $149 / 30 days. The pricing page clearly described
  review, manual invoice, verified payment and no outcome guarantees.
- After configuration finished loading, native applications became disabled
  and Company website became selected, consistent with the launch message.
- Country -> state -> New York City selection resolved to a verified location.

## Outreach recommendation

The inconsistent inclusion of active outreach employers is corrected in
Production. Nevertheless, postpone the imminent direct paid-listing pitch,
especially the Motion-focused Koto message, until the P1 discovery issues and
commercial readiness have been addressed. Keep drafts; do not interpret this
recommendation as authorization to cancel, edit or send scheduled messages.
The site can remain online for job browsing and learning from actual use.
