# Cloudflare branch previews on security-srl

## Architecture and protection

The repository contains one application: Astro produces `dist/` and `worker/index.ts` gates every static asset through `ASSETS`. The text `Deployment is locked.` comes from this application's first runtime guard, not a separate placeholder in the repository. Dashboard deployment history was not inspected; the live deployment's creation procedure cannot be established from source alone.

The existing Worker is `security-srl`. Top-level variables remain `ENVIRONMENT=locked` and `DEPLOYMENT_LOCKED=true`; even valid preview credentials cannot unlock that configuration. `workers_dev=false` is retained. No production variables, secrets, domains or deployments are changed by this PR.

Branch previews use `previews.vars` with `ENVIRONMENT=preview` and `DEPLOYMENT_LOCKED=false`. They still require their own `PREVIEW_USER` and `PREVIEW_PASSWORD`. Missing/empty secrets or a password shorter than 24 characters return 503; invalid credentials return 401. Every asset passes through the gate; successful responses include noindex, no-store and the existing security headers. Staff/API routes remain unavailable. The three unfinished concepts remain unavailable.

Wrangler 4.158.0 from the lockfile supports `wrangler preview` (minimum 4.135.0), so no dependency upgrade or Astro SSR adapter is needed. Static output, Worker entry, asset binding, compatibility date and security code are unchanged. The previous separately named `env.preview` / `env.production` targets are retired from config; this does not delete any cloud resource. Assets and compatibility settings stay at the top level, as required by Worker Previews.

## Required dashboard setup

In **Workers & Pages → security-srl → Settings → Builds**, verify:

| Setting                       | Value                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Repository                    | NicoLumea/Security-SRL                                                             |
| Production branch             | main (unchanged)                                                                   |
| Root directory                | repository root                                                                    |
| Build command                 | `npm run build` (unchanged)                                                        |
| Production deployment command | `npx wrangler versions upload` (unchanged; uploads a version, does not promote it) |
| Preview command               | `npx wrangler preview`                                                             |
| Preview builds                | enabled for non-main branches                                                      |
| Node.js                       | 24                                                                                 |

If the **Set up Worker Previews** banner appears, review its one-time migration before selecting **Switch to Worker Previews**. Cloudflare documents this switch as irreversible. It changes the preview model, not production variables. Do not substitute `wrangler deploy` or `wrangler versions deploy`.

In **Domains → Worker URL**, enable **Preview** if disabled. This enables preview hostnames separately from production. `preview_urls=true` records that desired setting in Wrangler; do not deploy production just to apply it.

In **Settings → Variables and Secrets → Previews Base**, add `PREVIEW_USER` and `PREVIEW_PASSWORD` as **secrets**, using a unique ASCII username and random ASCII password of at least 24 characters. Use separate preview credentials. Never copy production secrets/bindings or put these values in GitHub/source. D1/R2 arrays are explicitly empty; no database or bucket is needed. Check that Previews Base has no unintended data/service bindings.

Previews do not inherit production variables/secrets. New previews receive Previews Base secrets; existing previews need their own secret update if created before those secrets were set. With an already authenticated account, the corresponding commands are:

```sh
npx wrangler preview base-config secret put PREVIEW_USER
npx wrangler preview base-config secret put PREVIEW_PASSWORD
# For an existing preview, use its actual name from Cloudflare:
npx wrangler preview secret put PREVIEW_USER --name <actual-preview-name>
npx wrangler preview secret put PREVIEW_PASSWORD --name <actual-preview-name>
```

Enter values at secure prompts; do not pass secrets inline. No production `wrangler secret put` command is needed.

## Build and preview

Push a development branch after the dashboard setup, or retry its preview build. Cloudflare runs the build then `npx wrangler preview` against that branch's configuration. The command derives the preview name from the branch and targets `security-srl`. Do not pass `--env preview`, which selects a separate named Worker environment.

For an already authenticated local checkout on a development branch:

```sh
npm ci
npm run deploy:preview
```

That script builds and runs `wrangler preview`; it does not deploy production. Use only a URL actually returned by Cloudflare. Do not invent a hostname.

## Verification before sharing

1. Confirm the preview build uses the intended branch and commit, then copy its actual Preview URL.
2. Without credentials, verify `/`, `/favicon.svg` and an actual `/_astro/` asset require authentication.
3. With preview credentials, verify `/`, `/en/`, `/concepts/sentinel/ro/`, `/concepts/sentinel/en/`, portfolio lists/details and demo contact/navigation. Confirm noindex and no-store headers.
4. Confirm `/admin/` and `/api/contact` remain forbidden, and the existing production URL still returns `Deployment is locked.`
5. Run the browser/accessibility suite against the local production build. Live password-protected browser testing also needs the preview credentials; local browser results are not proof of live Cloudflare behavior.

For local perimeter checks only, copy `.dev.vars.example` to `.dev.vars`, set local-only credentials, then `npm run build && npm run preview:worker`. This uses `wrangler dev --local` and explicit local preview variables. It does not create a cloud preview.

`npm run validate:worker` is a bundling/configuration dry run of the locked default Worker. The unit suite additionally exercises production and branch-preview variables from the actual config. `wrangler preview` has no dry-run option in 4.158.0. Only a successful cloud build and authenticated URL test establish live preview readiness.

## Diagnosing `Private preview is not configured.`

The only application source of this response is `worker/index.ts`, inside the exported `fetch(request, env)` handler. The request passes the production lock first, then validates the runtime secrets, then checks HTTP Basic authorization, and finally calls `env.ASSETS.fetch(request)`. This is static Astro output, not Astro SSR; no adapter, `process.env`, build-time secret injection or `cloudflare:workers` import is required. Secret values are read fresh from the handler's `env` argument on each request.

The configuration guard rejects three conditions: an empty/missing `PREVIEW_USER`, an empty/missing `PREVIEW_PASSWORD`, or `PREVIEW_PASSWORD.length < 24`. Encrypted secret names appearing in the dashboard do **not** establish that their values meet this requirement. A 23-character password reproduces the same 503; a 24-character password passes configuration validation. Do not lower this requirement or remove authentication.

The public response remains generic. Private preview console logs now identify the rejected condition using only a fixed code:

| Log code                                    | Meaning and next action                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[preview-auth] PREVIEW_USER_MISSING`       | The active runtime received no non-empty username. Verify the exact secret name and update it on this individual preview.                                  |
| `[preview-auth] PREVIEW_PASSWORD_MISSING`   | The active runtime received no non-empty password. Verify the exact secret name and update it on this individual preview.                                  |
| `[preview-auth] PREVIEW_PASSWORD_TOO_SHORT` | Both values reached the runtime, but the password failed the minimum length. Set a unique random ASCII password of at least 24 characters on this preview. |

No values, actual lengths, request headers or environment dumps are logged. No debug endpoint is provided. Console log persistence is enabled **only under `previews.observability`**, with invocation logs disabled. Production observability and protection are unchanged.

Open **security-srl → Previews → feature-cloudflare-preview-setup → Observability**, reload the branch preview URL, and inspect the new `[preview-auth]` event. Check that its deployment matches the latest PR commit. If sharing evidence, share only that fixed code and deployment ID, never full request logs or credentials. `wrangler tail` does not currently support Worker Previews; use the individual preview's dashboard logs.

If a secret must be corrected, change it on the existing preview and separately in Previews Base for future previews. Confirm the resulting deployment is active. A new deployment does not prove a password is long enough, and changing Base does not change an existing preview. If all values are known to be valid but a missing-binding code persists, inspect the active deployment's binding **names and types** and confirm the Worker/preview selection before treating this as a Cloudflare binding issue.

Wrangler 4.158.0's `assemblePreviewDeploymentSettings` reads the latest deployment and carries forward its `secret_text` bindings as `inherit` when no same-name override is supplied. This repository has no `PREVIEW_USER`/`PREVIEW_PASSWORD` entries in `previews.vars`, no `define` replacement, and no `--secrets-file` or same-name `--var` arguments. Therefore ordinary branch deployment is not configured to delete or overwrite these secrets. This code inspection does not establish which secret values the live account actually has.

After correction, an unauthenticated request should return **401** with `WWW-Authenticate: Basic`, followed by **200** for a valid login. A continued 503 configuration error is not a successful preview login. Check the stable branch URL and the latest unique deployment URL to distinguish an old deployment from the current one.

## Actual Workers runtime regression tests

Run `npm run build && npm run validate:worker && npm run test:runtime`. The tests execute Wrangler's bundled Worker in local `workerd` through Miniflare and serve the real `dist/` files with the configured ASSETS binding and Worker-first routing. They cover missing/empty credentials, the 23/24-character boundary, unauthenticated/invalid/valid requests, production lock precedence, and response/log redaction. Test credentials are generated in memory and never loaded from `.dev.vars` or cloud secrets. CI runs this suite after the build and Wrangler validation. This validates runtime code and bundling, not the live account's secret bindings.

References: https://developers.cloudflare.com/workers/previews/configuration/, https://developers.cloudflare.com/workers/previews/test-and-debug/, https://developers.cloudflare.com/workers/runtime-apis/bindings/ and https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
