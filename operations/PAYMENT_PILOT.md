# Employer payment pilot — Preview only

Standard $149 / 30 days; Featured $349 / 90 days. No pricing changes. The workflow records operator attestations, not provider-verified funds.

## Before any real sale
- Verify separate Preview and Production D1 IDs in Cloudflare; confirm actual account can receive commercial payments, currency, withdrawal and applicable fees. Do not use friends-and-family payments.
- Verify working business contact and sender/reply routing; confirm invoice legal identity, refund terms, applicable taxes and required disclosures.
- Review actual paid posting terms and supported application methods; do not promise automatic email delivery.

## Rehearsal
CI exercises a disposable SQLite standard order: pending → review → invoice attestation → payment attestation → explicit publication → closure. Rejects out-of-order actions, missing attestations and repeated publication. No real transaction, email, external payment account or persistent Preview records created by CI.
For a browser rehearsal use isolated Preview only, clearly labelled test employer and controlled application URL, never collect actual funds. Do not represent a fixture payment as real. Close and remove fixture from public visibility after verification. Featured separately requires activation flag and campaign duration/expiry testing.

Before accepting Featured orders, verify the listing term on the released code. Local disposable SQLite tests cover the exact publication timestamp, the Standard 30-day and Featured 90-day cutoffs, and an earlier closing date across the approved and grouped feeds, public job detail and sitemap. A date-only closing date is inclusive through the UTC day. Follow-up verification records the check and an operator can close a vacancy early. Rotating highlights use separate campaign rules. See the [development milestone](SEO_GEO_CHECKLIST.md#milestone--correct-routes-and-paid-listing-duration) for release status.

## Real pilot
Owner must independently confirm receipt, amount, currency and reference in provider account, not employer screenshots. Review vacancy again, publish manually, send confirmation manually, verify public listing and closure link. Keep transaction references private. No automated charge, refund, or email.
