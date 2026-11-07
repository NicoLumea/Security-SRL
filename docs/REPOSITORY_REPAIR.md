# Repository structure repair

## Evidence and scope

Compared every tracked file at uploaded main `f3716dc1687cb0e400db7dd9e1f1486ca1b7556d` with the preserved Phase 1–2 commit `14989bbe1713e9144b80d25ce7849f7f64aae00d`. Every uploaded source/configuration file matched its original Git blob. There were no divergent source edits to overwrite. The original bundle was verified as complete and contains that implementation and its initialization commit.

The upload split Astro inputs between root folders and `source/src/`, making `src/pages/`, stylesheet imports, public assets and build verification unavailable at their configured paths. Six omitted dotfiles included CI, formatting, environment examples and dependency/build ignores. Restoring the original paths resolves these references without changing the design, content, routes or runtime code.

## Moved source and support files

| Uploaded path | Correct path |
|---|---|
| `source/config/storage-bindings.example.jsonc` | `config/storage-bindings.example.jsonc` |
| `source/docs/ADMIN_SETUP.md` | `docs/ADMIN_SETUP.md` |
| `source/docs/ARCHITECTURE.md` | `docs/ARCHITECTURE.md` |
| `source/docs/ASSET_LICENSES.md` | `docs/ASSET_LICENSES.md` |
| `source/docs/CLOUDFLARE_SETUP.md` | `docs/CLOUDFLARE_SETUP.md` |
| `source/docs/CONTENT_MANAGEMENT.md` | `docs/CONTENT_MANAGEMENT.md` |
| `source/docs/DATABASE_SETUP.md` | `docs/DATABASE_SETUP.md` |
| `source/docs/GITHUB_SETUP.md` | `docs/GITHUB_SETUP.md` |
| `source/docs/IMPLEMENTATION_BRIEF.txt` | `docs/IMPLEMENTATION_BRIEF.txt` |
| `source/docs/PRESENTATION_GUIDE.md` | `docs/PRESENTATION_GUIDE.md` |
| `source/docs/PRODUCTION_LAUNCH_CHECKLIST.md` | `docs/PRODUCTION_LAUNCH_CHECKLIST.md` |
| `source/docs/PROJECT_OVERVIEW.md` | `docs/PROJECT_OVERVIEW.md` |
| `source/docs/PULL_REQUEST.md` | `docs/PULL_REQUEST.md` |
| `source/docs/RESEND_SETUP.md` | `docs/RESEND_SETUP.md` |
| `source/docs/VERIFICATION.md` | `docs/VERIFICATION.md` |
| `source/migrations/0001_content_foundation.sql` | `migrations/0001_content_foundation.sql` |
| `source/public/favicon.svg` | `public/favicon.svg` |
| `source/public/licenses/inter-OFL.txt` | `public/licenses/inter-OFL.txt` |
| `source/public/licenses/manrope-OFL.txt` | `public/licenses/manrope-OFL.txt` |
| `source/public/robots.txt` | `public/robots.txt` |
| `source/scripts/verify-build.mjs` | `scripts/verify-build.mjs` |
| `source/src/assets/facade.jpg` | `src/assets/facade.jpg` |
| `source/src/assets/surveillance.jpg` | `src/assets/surveillance.jpg` |
| `source/src/components/Brand.astro` | `src/components/Brand.astro` |
| `source/src/components/CTA.astro` | `src/components/CTA.astro` |
| `source/src/components/Consent.astro` | `src/components/Consent.astro` |
| `source/src/components/Icon.astro` | `src/components/Icon.astro` |
| `source/src/components/ProjectCard.astro` | `src/components/ProjectCard.astro` |
| `source/src/concepts/sentinel/Home.astro` | `src/concepts/sentinel/Home.astro` |
| `source/src/concepts/sentinel/InnerPage.astro` | `src/concepts/sentinel/InnerPage.astro` |
| `source/src/config/site.ts` | `src/config/site.ts` |
| `source/src/data/content.ts` | `src/data/content.ts` |
| `source/src/i18n/index.ts` | `src/i18n/index.ts` |
| `source/src/layouts/Base.astro` | `src/layouts/Base.astro` |
| `source/src/layouts/Sentinel.astro` | `src/layouts/Sentinel.astro` |
| `lib/consent.ts` | `src/lib/consent.ts` |
| `lib/routes.ts` | `src/lib/routes.ts` |
| `lib/slug.ts` | `src/lib/slug.ts` |
| `pages/404.astro` | `src/pages/404.astro` |
| `pages/[...path].astro` | `src/pages/[...path].astro` |
| `pages/index.astro` | `src/pages/index.astro` |
| `presentation/Gallery.astro` | `src/presentation/Gallery.astro` |
| `presentation/Switcher.astro` | `src/presentation/Switcher.astro` |
| `scripts/ui.ts` | `src/scripts/ui.ts` |
| `server/contracts.ts` | `src/server/contracts.ts` |
| `styles/gallery.css` | `src/styles/gallery.css` |
| `styles/global.css` | `src/styles/global.css` |
| `styles/sentinel.css` | `src/styles/sentinel.css` |

## Restored from the original commit

- `.dev.vars.example`
- `.env.example`
- `.github/workflows/ci.yml`
- `.gitignore`
- `.prettierignore`
- `.prettierrc.json`

CI now also runs on pushes to `main` and `fix/repository-structure`, while retaining pull-request checks and the original development branch. The ignore file additionally excludes `preview-build/` and Git bundles.

## Removed exact duplicate files

- `source/README.md`
- `source/astro.config.mjs`
- `source/eslint.config.js`
- `source/package-lock.json`
- `source/package.json`
- `source/playwright.config.ts`

## Removed delivery artifacts

- All 57 tracked files under `preview-build/` matched the original ZIP's generated preview byte-for-byte. Source images, fonts' license files, public assets and all application source remain available to regenerate the build.
- Removed `Security-SRL.bundle` from the active tree after verifying its contents and restoring the missing configuration. The bundle remains recoverable from the parent commit and original delivery ZIP.
- Moved the unique `START-HERE.txt` to `docs/ARCHIVE_START_HERE.txt` unchanged, preserving its archive/recovery information.

Updated README and GitHub instructions to describe the actual repository. No application source, dependency versions, Worker code or preview/production boundaries were changed. No cloud resources were created and nothing was deployed.
