# Private production review: investigation and activation

## Observed before this change (15 November 2026)

- Worker: `security-srl`. Branch Previews are environments under that Worker, not separately created Workers. Sentinel Preview name: `feature-sentinel-hero-video-integration`.
- Main URL observed earlier in this session: https://security-srl.shy-wildflower-e44e.workers.dev/ . It returned `503 Deployment is locked.`
- Existing Sentinel URL: https://feature-sentinel-hero-video-integration-security-srl.shy-wildflower-e44e.workers.dev/concepts/sentinel/ro/ . It earlier returned `401` and the `Security SRL preview` Basic authentication challenge. Successful live credential submission was not tested; credentials were unavailable.
- GitHub reports PR #4 already merged at 2026-11-15 13:21:20 UTC, before this investigation. Base commit is `4aa713cff846571c0708eaea89d1fbaea909ff79`. This task did not merge it or change its feature branch. Do not assume current main excludes the Sentinel video.
- Wrangler whoami reports no authentication, and the Cloudflare dashboard redirects to sign-in. Actual account roles, production build command, secrets, Access policies and active version metadata could not be inspected. A responding main URL despite checked-in `workers_dev=false` is configuration drift or an older deployed configuration; its exact cause cannot be asserted without dashboard access.

Latest unauthenticated Python HTTP probes returned Cloudflare `403 / error code 1010` for both URLs. These edge responses do not establish the current application response or a deployment regression; no attempts were made to bypass them. Current authenticated live access must be rechecked by the owner.

## Exact lock mechanism

The previous `worker/index.ts` rejected every request unless BOTH `DEPLOYMENT_LOCKED` was exactly `false` AND `ENVIRONMENT` was exactly `preview`. The top-level Wrangler defaults were `locked` / `true`. Setting only the lock flag was insufficient. Worker-first assets ensure the lock applies to pages, images, video and other static files.

This is an application request-serving lock, not a Cloudflare ban on builds, uploads, new versions or branch Previews. `workers_dev=false` separately disables the main workers.dev route when applied by deployment; it does not disable branch Previews. `preview_urls=true` permits version URLs. Those URLs are not isolated branch Previews: production version URLs use the bindings of their version.

GitHub Actions only validates/builds/tests and performs a Wrangler dry run; it does not deploy. The documented Cloudflare production command is `npx wrangler versions upload`, which stages a version without promoting it; this account setting still requires verification. Preview builds use `npx wrangler preview` with `previews.vars`, and explicit empty D1/R2 arrays. No database, bucket or staff service is enabled.

Changing deployed variables/secrets creates a new configuration/version and may deploy it. There is no verified no-deployment unlock available. Do not relabel production as preview or disable authentication to bypass the lock.

## Proposed behavior, only after an approved release

| Setting | Production | Branch Preview |
| --- | --- | --- |
| Worker | Existing `security-srl` | Same parent Worker, separate branch Preview |
| Source | Approved `main` commit | Feature branch |
| ENVIRONMENT | `production` | `preview` (unchanged) |
| DEPLOYMENT_LOCKED | `false` | `false` (unchanged) |
| Credentials | `PRODUCTION_USER`, `PRODUCTION_PASSWORD` | Existing `PREVIEW_USER`, `PREVIEW_PASSWORD` |
| Access | Basic authentication, noindex | Existing Basic authentication, noindex |
| Data bindings | None added | D1/R2 empty; none added |

The PR sets `workers_dev=true` for eventual main-subdomain access and prepares the production runtime mode. Missing/empty/short credentials fail closed with 503; wrong/missing login returns 401. Production cannot use preview secrets as a fallback. Use distinct secret values. Setting `DEPLOYMENT_LOCKED=true` still stops serving even with valid credentials. Unknown environments remain locked. Staff/API/dashboard routes remain forbidden; non-GET/HEAD requests remain rejected; security headers and private/no-store caching remain intact.

No production deployment, secret mutation or dashboard setting change was performed for this PR. The preview block is byte-for-byte unchanged. No duplicate Worker is required.

## Safe activation sequence — owner approval required

1. Sign in securely at https://dash.cloudflare.com/ in the available browser, or use `npx wrangler login` on your trusted computer and approve its OAuth flow. Do not paste tokens/passwords into chat or GitHub. Account access must allow reading Worker settings/versions/builds; the eventual release operator also needs permission to edit this Worker's settings/secrets and deploy versions. No authenticated role was available here, so a specific denied account permission was not observed.
2. Select the existing `security-srl` Worker. Inspect Settings → Builds: repository must be `NicoLumea/Security-SRL`, production branch `main`, build `npm run build`, production command `npx wrangler versions upload`, non-production command `npx wrangler preview`. Ensure builds do not auto-promote production. Do this BEFORE approving/merging the unlock PR; if configured as `wrangler deploy`, a merge could publish automatically. Preserve existing Preview Base and individual Preview secrets and all Access policies.
3. Review this PR and the contents already on main (including previously merged PR #4). Only the owner should approve/merge; this task does neither. Select the exact approved main SHA for release.
4. From that exact approved checkout, build and run checks. Prepare production-only `PRODUCTION_USER` and `PRODUCTION_PASSWORD` (random ASCII password of at least 24 characters). Stage them securely with the approved code using `npx wrangler versions upload --secrets-file <private-file-outside-repository>`. The private JSON/.env file contains only those two secrets; restrict its permissions and never commit/log it. Record the returned version ID and verify it contains the intended code SHA, both secret binding names, production mode and lock flag. Do not substitute `wrangler secret put` or dashboard Save-and-Deploy: these can deploy immediately. `wrangler versions secret put` is a prompt-based, non-deploying alternative, but each call creates another version; verify the final version carries both secrets and the approved code before promotion.
5. After explicit release approval, deploy ONLY the verified staged version using the dashboard's deployment controls or `npx wrangler versions deploy <verified-version-id>@100%`. This is the production-changing step and was not run here. Check Settings → Domains & Routes and enable the existing workers.dev main URL if still disabled; do not change Preview URLs or create another Worker.
6. Verify the actual main URL: no login → 401; correct production login → 200 and site visible; preview credentials → denied; media → authenticated only; `/admin/` and `/api/` → 403 even after login. Recheck the existing Sentinel Preview with its own credentials. No production secrets should be copied to Previews Base.
7. If anything fails, restore the prior locked deployment/version. Keep the prior version ID before promotion. For future releases retain main-only, upload-first builds and explicit version promotion. A public launch without Basic authentication is a separate task.

## Verification

Unit/config and real workerd runtime tests exercise both modes, separate credential sets, missing/short secrets, lock precedence, protected pages/media, staff/API denial, mutation rejection, security headers and credential redaction. Existing browser suite remains unchanged. Live authenticated login is still an owner check, not established by local tests.

## Official references

- https://developers.cloudflare.com/workers/previews/configuration/
- https://developers.cloudflare.com/workers/previews/compare-workflows/
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/configuration/secrets/
