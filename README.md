# Security SRL — Sentinel presentation

Phase 1–2 implementation: an original four-direction showroom and complete Romanian/English Sentinel presentation. **This is not an approved production website.** Three additional concepts are visibly unavailable.

## Current delivery

- Astro 7, TypeScript, self-hosted Manrope/Inter fonts, optimized local WebP images.
- Romanian root gallery `/`, English gallery `/en/`.
- Sentinel `/concepts/sentinel/ro/` and `/concepts/sentinel/en/`, dedicated services, portfolio, two demonstration project pages, about, contact, privacy, cookies and staff-unavailable pages.
- Accessible native disclosure navigation, concept switcher, portfolio search/filtering, mobile featured-project rotation, scroll reveals and reduced-motion styles.
- Non-submitting contact demo and local consent preferences; no analytics, live email or inquiry collection.
- Cloudflare Worker with a private preview gate on **every** asset; staff/API routes deny access. Production configuration is locked.
- Future D1 schema and typed CMS/media/mail contracts. **Not a working CMS or authentication system.**

## Run

Node 24+ is required.

```sh
npm ci
npm run dev
```

Development serves on localhost. It does not include the deployment perimeter; do not expose the Astro dev server to clients. To inspect the production assets with the perimeter, copy `.dev.vars.example` to `.dev.vars.preview`, enter a preview username and unique password of at least 24 characters, then run:

```sh
npm run build
npm run preview:worker
```

Never put credentials in `PUBLIC_` variables or committed files.

## Verify

```sh
npm run check
npm run lint
npm test
npm run build
npm run verify:build
npm run validate:worker
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run validate:worker` performs a local dry run, not a deployment. GitHub Actions runs these checks and never deploys. See `docs/VERIFICATION.md` for actual results and limitations from this delivery.

## Git state

Local branch: `feature/security-concept-gallery`. Local `main` contains only the initialization README and ignore file. GitHub account `NicoLumea` was verified through the connector; repository creation was unavailable there and the browser required sign-in. **No remote repository or PR was created.** The deliverable includes a Git bundle preserving both branches. Follow `docs/GITHUB_SETUP.md`.

## Configuration

| Concern | Location |
|---|---|
| Name, colors, contact details, video slots, presentation mode | `src/config/site.ts` |
| Romanian/English text | `src/i18n/index.ts` |
| Services, demonstration projects, concepts | `src/data/content.ts` |
| Sentinel components and styles | `src/concepts/sentinel/`, `src/styles/sentinel.css` |
| Isolated presentation UI | `src/presentation/`, `src/styles/gallery.css` |
| Preview perimeter and security headers | `worker/index.ts` |
| Environments | `wrangler.jsonc` |
| Future D1/R2 binding examples | `config/storage-bindings.example.jsonc` |

Read `docs/PRESENTATION_GUIDE.md` before showing the client. No production deployment, merge, account bootstrap or cloud-resource creation was performed.
