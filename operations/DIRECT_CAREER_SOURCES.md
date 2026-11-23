# Direct employer career discovery — 23 November 2026

This is an evidence log, not a count of active jobs. Public HTML is checked on
the official employer website; a linked ATS is optional. No credentials or paid
service is required. These adapters publish short excerpts and original links;
they do not grant source SEO or social publication rights.

**Owner correction:** Koto is now held from public aggregation because paid-listing outreach is active. Its adapter remains tested but its endpoint returns no jobs without crawling. Runway and Linear are held across every sourced public feed as well. Historical counts below describe discovery, not the currently published inventory. Further remains enabled; it is not one of the three confirmed outreach recipients.

| Employer | Official page examined | Result |
| --- | --- | --- |
| Koto | https://koto.com/careers | Direct HTML adapter. Index contains 29 entries; 20 creative vacancies pass detail/title/location/application checks. Seven motion and two web roles. Strategy, client management, talent, writer and internship enquiries excluded. |
| Further (formerly DesignStudio) | https://www.further.group/careers | Discovered through redirect from design.studio/careers. Direct HTML adapter; three design roles. Relative links must resolve on Further, not the old domain. |
| Instrument | https://www.instrument.com/careers/ | Public HTML includes freelance network, general application and developer links. Do not count general talent pools as specific vacancies. Needs detailed role review. |
| Stink Studios | https://www.stinkstudios.com/careers | Explicitly states no current openings. |
| BUCK | https://buck.co/careers | Public page accessible but no vacancy links in initial HTML. Embedded/client-rendered source investigation pending. |
| Pentagram | https://www.pentagram.com/careers | Public page has Open Positions heading, no vacancy links in initial HTML. Further investigation pending. |
| Ordinary Folk | https://www.ordinaryfolk.co/jobs | Candidate URL did not expose vacancy links; not evidence of no hiring. |
| PORTO ROCHA | https://porto-rocha.com | Request failed through research environment; not evidence of no hiring. |
| Ragged Edge | https://www.raggededge.com/careers | Candidate URL did not expose vacancy links; correct route still needs discovery. |
| COLLINS | https://www.wearecollins.com/careers/ | Candidate URL did not expose vacancy links; correct route still needs discovery. |
| Universal Design Studio | https://www.universaldesignstudio.com/careers/ | Candidate URL did not expose vacancy links; needs further investigation. |
| SomeOne | https://www.someoneinlondon.com/careers | Candidate URL did not expose vacancy links; needs further investigation. |

## Adapter operation

`/api/direct-jobs?shard=0` scans Koto; shard 1 scans Further. Each request reads
the current career index then the linked vacancy details, with three concurrent
requests and a maximum of 36 details. Hosts and URL patterns are fixed in code.
Redirects, oversized responses, missing application links, changed titles,
unknown locations and broken layouts do not become published jobs.

Successful results are cached for four hours. Individual records expire six
hours after verification. Partial failures get a five-minute shared cache;
complete failures return 503 without inventing a zero-openings result. Source
dates are left blank when the employer provides none. Work arrangement is not
inferred from the city. No D1 migration or scheduled Worker is required.

The next source batches should target fashion/photography, industrial design,
and arts institutions, while investigating the unresolved studio websites
above. The 50-per-category goal remains open.
