# Architecture

Astro statically renders the presentation. A small Cloudflare Worker wraps the asset binding. `run_worker_first: true` prevents direct static-asset bypass of the preview gate. This is a supported Workers Static Assets architecture; no Astro server adapter is needed for static rendering. Future SSR routes can use the current Astro Cloudflare adapter after a separately tested migration.

## Boundaries

- `src/presentation/`: gallery and concept switcher only.
- `src/concepts/sentinel/`: original public-facing design components.
- `src/layouts/`: document metadata and website chrome.
- `src/i18n/` and `src/data/`: initial editable content; no runtime user data.
- `src/server/contracts.ts`: future repository/media/email contracts, not implementations.
- `worker/`: deployment perimeter, deny-closed API/staff boundary and security headers.
- `migrations/`: future D1 content schema; no remote binding in this delivery.

## Preview access

HTTP Basic over HTTPS with a unique, random preview password (minimum 24 characters) is a temporary shared-review perimeter, not staff login. Header comparison hashes both sides to equal-length values before comparing. Missing configuration returns 503. Wrong/missing authorization returns 401. Responses use private/no-store and noindex. All methods except GET/HEAD are rejected. `/admin`, `/api` and any `dashboard` segment return 403 even after preview authorization. CSP blocks form submission, connections, framing and external scripts. Staff passwords and sessions are not collected.

The build output by itself has no authentication. Never publish `dist` on an unprotected static host. Cloudflare Access with individual identities, logging and rate limits should replace/supplement the shared preview gate before broader review. The current gate does not implement durable brute-force counters or staff session revocation; it must not become production authentication.

## Reliability and future backend

Static render avoids operational dependencies. Image generation occurs at build time. Worker asset failures return a generic 503; no secrets are logged. No queues, load balancer, retry transport or monitoring integration is claimed.

For Phase 3: implement server validation and RBAC before any mutations; return paginated public projections instead of raw DB rows; use transactions for publish state; use request IDs and redacted structured logs. Apply timeouts to remote email/media requests. Use deduplication keys for emails and retry only known transient failures with capped exponential backoff. Queue integration and a dead-letter path are planned only when operational volume justifies them. Define retention and alerting with the client.

## Promoting a concept

Set `site.presentation` to `false`: the gallery is removed from rendered routes, `/` redirects to `/ro/`, Sentinel moves to `/ro/` and `/en/`, and the switcher disappears. This does **not** unlock deployment, enable forms or indexing. Before release, remove unused proposal assets and replace demo records, set verified `productionOrigin`, generate a production-only sitemap and appropriate verified structured data, review headers/robots, and implement production authentication. Keep noindex until that review is complete.

References checked during implementation:
- https://docs.astro.build/en/guides/deploy/cloudflare/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/wrangler/configuration/
