# Studio Openings

A lightweight, curated job board for architecture, interiors, industrial and product design, visual design, fashion, creative technology, museums, arts and cultural institutions.

## Website

- Public site: https://studio-openings.pages.dev/
- Development preview: https://development.studio-openings.pages.dev/
- Production branch: `main`
- Test branch: `development`

## Product

Visitors can discover, filter, inspect and save creative job openings. Source links lead to the original vacancy. Employer-submitted listings are subject to editorial review.

Paid employer placement is planned as a one-time service: Standard USD 149 (up to 30 days) and Featured USD 349 (up to 90 days). Featured placements are limited and rotated. No impressions, applicants or hires are guaranteed. This development release does not collect card payments and does not send automated emails. Spotlight is not available yet.

## Technology

Plain HTML, CSS and JavaScript, Cloudflare Pages Functions, D1, and Turnstile. No local build tool is required.

- Files in `assets/` provide the public interface.
- `functions/` contains server-side routes.
- `lib/` contains reusable server-side policies.
- Private service credentials must be configured in Cloudflare, never embedded in public source.

## Release discipline

Changes are tested in `development` before a separately approved merge into `main`. Public build artifacts and server-side routes are not a place for passwords, invoices, customer payment records or private operational playbooks.

Owner-only setup, invoicing, database migration and operational instructions are maintained separately from this public repository.

## Editorial policy

External vacancies must be attributed to their sources and checked for accuracy, eligibility, location and currency of the opening. Visitors should verify requirements on the employer's authoritative job page.
