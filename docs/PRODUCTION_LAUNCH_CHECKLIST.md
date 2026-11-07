# Production launch — not approved

- [ ] Client chooses and approves a concept and actual company identity.
- [ ] Replace demonstration projects, copy and imagery; confirm rights and publication permissions.
- [ ] Confirm services, contact details, company/legal identifiers and authorized claims.
- [ ] Review exact addresses, camera locations, network details and customer identity disclosure.
- [ ] Implement and audit maintained staff authentication, MFA, RBAC, approval, bootstrap and recovery.
- [ ] Implement and test D1/R2 repositories, publishing transactions and media quarantine/validation.
- [ ] Confirm separate production/preview resource IDs and least-privilege access.
- [ ] Verify email sender/domain, anti-spam, rate limits, retention and approved data handling.
- [ ] Replace demo contact form with an audited server route and honest delivery feedback.
- [ ] Approve privacy/cookie notices, tracking categories and consent behavior; verify nonessential services stay blocked before consent.
- [ ] Complete Playwright/axe suite on all required widths; manual keyboard, reduced-motion, no-JS and mobile-codec review.
- [ ] Set `site.presentation=false`; verify `/ro/`, `/en/`, redirect and removal of presentation controls; remove unused proposal assets.
- [ ] Set verified canonical origin, production sitemap, hreflang and factual structured data; review indexing settings deliberately.
- [ ] Replace preview-only gate with reviewed production routing; do not simply unlock the existing preview Worker.
- [ ] Configure production environment/secrets, domain/DNS, logging, backups and rollback in a separately approved release.
- [ ] Approve production deployment explicitly. Merge only after review; never merge automatically.
