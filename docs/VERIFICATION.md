# Verification — 7 November 2026

## Repository repair validation

After restoring the root project structure: `npm ci`, type checking (0 errors/warnings/hints), linting, all 9 unit tests, the 23-page production build, 701 internal link/asset checks and the Wrangler preview dry run passed again. These are local checks; the dry run does not deploy. Original source, tests, public assets and Worker bytes are unchanged.

The sections below record the original delivery checks and browser limitations. See the repair PR for current GitHub Actions results.

## Executed successfully

| Check | Result |
|---|---|
| Dependency installation | npm installation completed; lockfile included |
| `npm run check` | 0 errors, 0 warnings, 0 hints (32 source/config/test files) |
| `npm run lint` | Passed |
| `npm test` | 9 tests passed |
| `npm run build` | 23 static pages built; 14 responsive WebP image variants |
| `npm run verify:build` | 701 internal link/asset references resolve, one h1 and noindex on each of 23 pages |
| `npm run validate:worker` | Wrangler 4.158.0 preview dry run passed; no deployment |
| Promotion flag | Setting presentation=false generated /ro/ and /en/, removed concept routes, gallery markup and switcher; setting restored to true and presentation rebuilt |

Unit coverage: preview credential/configuration boundary, protected assets, security headers, API/dashboard denial, rejected mutations, safe asset-failure response, role restrictions, consent shape/age, Romanian slug normalization and SQLite migration constraints. SQLite tests are not a remote D1 integration test.

## Browser-executed checks

The built static assets were served in the internal managed browser. This was QA, not a Cloudflare deployment. Development-mode image transformation did not render correctly in this managed preview, so visual inspection used actual production-build images.

- Desktop gallery and Sentinel inspected visually; all images shown in the inspected views loaded.
- Native mobile menu expanded, links labelled and navigable.
- Gallery, Sentinel homepage, portfolio, services and contact were measured at iframe widths 320, 390, 768, 1024 and 1440 pixels. All 25 combinations passed the horizontal-overflow check after the contact heading correction. Traditional scrollbar content widths were 15 pixels narrower than frame widths, making this a slightly stricter fit check.
- Mobile hero crop corrected to preserve the camera. Gallery and contact mobile layouts inspected visually.
- Invalid contact input produced required-field feedback; fictional valid input produced the explicit non-submission confirmation. Source and Worker policy separately prevent network form submission.
- Portfolio search empty-state and category filtering worked; selected category showed one matching demonstration project.
- English homepage and corresponding Romanian project route switching worked.
- Concept switcher keyboard Enter/Escape interaction and three unavailable entries checked.
- Cookie customization saved and reopened with the same UI choice; reset to necessary-only afterward.
- Native mobile menu navigation reached the portfolio inside a script-disabled sandboxed frame.
- axe-core WCAG 2 A/AA and 2.1 AA scans ran in the browser on four built pages: gallery, Sentinel home, contact and portfolio. Final scans returned **zero violations** (19, 21, 23 and 23 passing rules respectively). Four low-contrast service numbers were corrected before the passing home recheck. This is a scoped automated check, not a complete accessibility certification.

The responsive/axe instrumentation existed only in a disposable QA copy. It is absent from source and the delivered preview build.

## Blocked / not claimed

- Full Playwright suite: 10 scenarios are present and discoverable. Actual execution failed before the first browser launched because the Chromium executable was absent. `npx playwright install chromium` failed with a truncated/invalid download (“End of central directory record signature not found”). Nine subsequent scenarios did not run. GitHub Actions includes installation and execution for a normal runner, but CI had not run at the time of the original offline delivery.
- Reduced-motion browser emulation, full automated accessibility/responsive suite and actual MP4/WebM playback await that environment and an approved video. Reduced-motion code/CSS and the visible image fallback are implemented; no video file is supplied.
- Remote Cloudflare deployment, preview credential challenge on an actual Workers hostname, D1/R2 binding/migrations, Resend, staff authentication/bootstrap, CMS, recovery and production rollout remain untested/unconfigured.
- No performance score, security certification, legal-compliance claim, production publication or successful external deployment is claimed.
