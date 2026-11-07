# Cloudflare branch previews on security-srl

## Architecture and protection

The repository contains one application: Astro produces `dist/` and `worker/index.ts` gates every static asset through `ASSETS`. The text `Deployment is locked.` comes from this application's first runtime guard, not a separate placeholder in the repository. Dashboard deployment history was not inspected; the live deployment's creation procedure cannot be established from source alone.

The existing Worker is `security-srl`. Top-level variables remain `ENVIRONMENT=locked` and `DEPLOYMENT_LOCKED=true`; even valid preview credentials cannot unlock that configuration. `workers_dev=false` is retained. No production variables, secrets, domains or deployments are changed by this PR.

Branch previews use `previews.vars` with `ENVIRONMENT=preview` and `DEPLOYMENT_LOCKED=false`. They still require their own `PREVIEW_USER` and `PREVIEW_PASSWORD`. Missing secrets return 503; invalid credentials return 401. Every asset passes through the gate; successful responses include noindex, no-store and the existing security headers. Staff/API routes remain unavailable. The three unfinished concepts remain unavailable.

Wrangler 4.158.0 from the lockfile supports `wrangler preview` (minimum 4.135.0), so no dependency upgrade or Astro SSR adapter is needed. Static output, Worker entry, asset binding, compatibility date and security code are unchanged. The previous separately named `env.preview` / `env.production` targets are retired from config; this does not delete any cloud resource. Assets and compatibility settings stay at the top level, as required by Worker Previews.

## Required dashboard setup

In **Workers & Pages → security-srl → Settings → Builds**, verify:

| Setting | Value |
|---|---|
| Repository | NicoLumea/Security-SRL |
| Production branch | main (unchanged) |
| Root directory | repository root |
| Build command | `npm run build` (unchanged) |
| Production deployment command | `npx wrangler versions upload` (unchanged; uploads a version, does not promote it) |
| Preview command | `npx wrangler preview` |
| Preview builds | enabled for non-main branches |
| Node.js | 24 |

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

References: https://developers.cloudflare.com/workers/previews/configuration/ and https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
