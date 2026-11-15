# Public production access — supersedes the protected-review proposal

PR #5 now removes the visitor-wide deployment lock and password protection entirely. The earlier proposal for separate production credentials has been withdrawn. Do not configure PRODUCTION_USER or PRODUCTION_PASSWORD for public access.

See [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md) for the current configuration, original lock locations, public Preview behavior, local verification and approval-controlled production release instructions.

The existing Worker remains `security-srl`; main access is enabled in Wrangler configuration, while branch Previews retain their existing architecture and isolation. Staff/API/dashboard denial and staff authorization contracts remain unchanged. No website design or video changes are included.

Production requires the owner's approval, review/merge of PR #5, and explicit promotion of the approved main version. No production deployment or merge was performed during preparation. Old branch previews retain their old code until redeployed; use PR #5's updated Preview for public review in the meantime.
