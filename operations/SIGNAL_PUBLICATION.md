# Weekly SIGNAL publication handoff

1. Operator prepares next edition, verifies both live vacancies and reviews six selections. Export approved JSON.
2. Give the approved JSON to the connected GitHub operator (ChatGPT). Append the record to lib/signal-archive.js using appendSignal validation. Commit to development only, review the preview and verify checks. Do not ask the owner to use a terminal. The optional publish-signal.mjs script is for maintainers/CI only.
3. Generate Brevo campaign HTML from the same approved record using renderSignal. Create a draft only, using weekly@s-o.app and hello@s-o.app reply-to. Confirm recipient list and preview before sending. Never send automatically.
4. Public archive and delivery are release-gated. Do not send a real issue containing archive links until production routes are enabled and tested. No invented issues, no overwrites, no skipped numbers.

The export is not itself a publication. The browser does not possess GitHub or Brevo write credentials. A repository commit and campaign draft remain separate actions; the connected assistant can perform them after approval. Do not store API keys in the website.
