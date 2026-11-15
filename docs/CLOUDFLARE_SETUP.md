# Cloudflare public website and branch previews

The existing Worker is `security-srl`. Astro builds `dist/`; `worker/index.ts` serves public GET/HEAD requests through ASSETS. There is no website-wide Basic Authentication, password configuration or deployment-lock check. Staff/API/dashboard routes still fail closed; no administrative authentication or authorization is removed.

## Configuration

- `workers_dev=true`: enable the existing main workers.dev subdomain when the approved configuration is applied.
- `preview_urls=true`: retain version URL support.
- `previews` retains branch Preview settings, observability and empty D1/R2 bindings. No new Worker is created and no production data bindings are copied.
- Public website access does not read ENVIRONMENT, DEPLOYMENT_LOCKED, PREVIEW_USER/PASSWORD or PRODUCTION_USER/PASSWORD. Old values cannot re-enable the removed application gate.
- Existing noindex metadata, robots.txt and cache/security headers are preserved. Public access does not change search indexing or turn the demo contact form into a live service.

## Existing Cloudflare build workflow

Verify these settings in the account before approving production release:

| Setting | Value |
| --- | --- |
| Worker | `security-srl` |
| Repository | `NicoLumea/Security-SRL` |
| Production branch | `main` |
| Build | `npm run build` |
| Production command | `npx wrangler versions upload` (stage only; no auto-promotion) |
| Non-production command | `npx wrangler preview` |

GitHub Actions runs checks and a Worker dry run only. It does not deploy. Feature previews must use Worker Previews, not a production `wrangler deploy` command. A branch Preview is separate from the active production version and uses Preview configuration.

Main URL: https://security-srl.shy-wildflower-e44e.workers.dev/

PR #5 Preview, as returned by Cloudflare's PR comment: https://feature-cloudflare-deployment-unlock-security-srl.shy-wildflower-e44e.workers.dev/

Existing Sentinel branch Preview: https://feature-sentinel-hero-video-integration-security-srl.shy-wildflower-e44e.workers.dev/concepts/sentinel/ro/

Each Preview serves the code last deployed to that branch. Updating PR #5 does not rewrite the older Sentinel branch Preview. To remove the old gate there too, redeploy it with approved public-access code after the PR is accepted, or review the Sentinel page on PR #5's Preview now. Do not point feature previews at production or bypass deployment review.

## Dashboard settings after approval

1. Sign in securely at https://dash.cloudflare.com/ (or use Wrangler OAuth with `npx wrangler login` on a trusted computer). No tokens/passwords belong in chat, source or PRs.
2. Open `security-srl` → Settings → Builds. Confirm main-only production staging and independent Preview builds as above. Do not use an automatic production deploy command before review.
3. After approval and merge, build/stage the approved main version, inspect its commit/version, and explicitly promote that version to production. This task does not perform merge or promotion.
4. Under Settings → Domains & Routes, enable the existing main workers.dev route if disabled. Keep Preview URLs enabled. `workers_dev=true` records the desired main-subdomain setting, but live dashboard state must be verified.
5. No visitor secrets are needed. Old PREVIEW_USER/PASSWORD and PRODUCTION_USER/PASSWORD secrets, plus ENVIRONMENT/DEPLOYMENT_LOCKED variables, may be removed from Production, Previews Base and individual Previews once old protected deployments are retired. They are ignored by new code; do not delete anything belonging to future staff authentication. Dashboard secret/variable changes can publish a new configuration, so include cleanup in the approved release rather than doing it prematurely.
6. If a separately configured Cloudflare Access policy protects an entire public hostname, remove only that visitor-wide policy after confirming its scope. Preserve any admin-only Access policies. No such policy was verified in this session; do not assume one exists.
7. Verify homepage, Romanian/English Sentinel routes and assets return 200 without Authorization and without WWW-Authenticate. Confirm missing pages still return 404, staff/API/dashboard return 403, and public POST requests remain 405. Check video playback, navigation and all requested viewport widths.

## Local verification

No `.dev.vars` or credentials are necessary:

```
npm ci
npm run check
npm run lint
npm test
npm run build
npm run verify:build
npm run validate:worker
npm run test:runtime
npm run test:e2e
```

`npm run preview:worker` serves the real Worker locally. `tests/runtime/public-access.test.ts` exercises public pages, images, exact MP4 bytes, stale lock/secret bindings, HEAD/404, and preserved staff/API/mutation restrictions in workerd. Existing browser tests cover navigation, responsive layout, video and scroll behavior. Runtime tests use local assets and are not proof of the live dashboard configuration.

## Original restriction locations

- `worker/index.ts`: first-request lock guard and visitor Basic-auth middleware.
- `wrangler.jsonc`: locked production vars, preview overrides, and `workers_dev=false` on main.
- `package.json`: local preview script injected lock-bypass flags.
- `.dev.vars.example`: visitor credential template.
- Earlier config/security/runtime tests and setup docs enforced/described these gates; those relevant to current setup have been replaced.

Cloudflare account authentication was unavailable during preparation (Wrangler unauthenticated; dashboard at sign-in), so live build settings, Access policies and route toggles were not edited. Production is not claimed public until an approved deployment has been observed.

References: https://developers.cloudflare.com/workers/previews/configuration/ ; https://developers.cloudflare.com/workers/ci-cd/builds/ ; https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
