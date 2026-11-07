# Cloudflare Workers setup

No Cloudflare account was authenticated, account ID assumed, resources created or deployment attempted. Wrangler's dry run validates bundling locally; it does not prove remote permissions or resource existence.

## Private presentation preview

After the GitHub repository exists:

1. Sign into the same Cloudflare account used for your other projects. Confirm its account name and identifier in the dashboard; do not copy an identifier from another project without checking.
2. Workers & Pages → Create Application → import the GitHub repository. Authorize only `NicoLumea/Security-SRL` if prompted. Select the development branch `feature/security-concept-gallery` as the build branch for this **preview-only Worker**.
3. Worker name must be exactly `security-srl-preview`. Root directory is the repository root. Build: `npm run build`. Deploy: `npx wrangler deploy --env preview`. Use Node 24. Disable optional branch preview URLs for now; this delivery uses a dedicated preview Worker, not automatic per-PR previews.
4. In that Worker's variables/secrets, set `PREVIEW_USER` and `PREVIEW_PASSWORD` as secrets. Use a unique ASCII username and at least 24 random ASCII password characters. Set no client-side/public environment variables for these. A first deployment before secrets is safe but returns 503. Retry the preview deployment after secrets exist.
5. Equivalent CLI after `npx wrangler login` and account verification:

   ```sh
   npx wrangler whoami
   npx wrangler secret put PREVIEW_USER --env preview
   npx wrangler secret put PREVIEW_PASSWORD --env preview
   npm run deploy:preview
   ```

   Secrets are entered at the prompt. Do not put their values on command lines. Creating a Worker may be necessary before `secret put`; a deployment with absent secrets remains closed.
6. Use the URL Cloudflare actually returns. Test in a fresh private browser: homepage, `/favicon.svg` and a copied `/_astro/...` URL must all require credentials. Valid credentials should open the gallery. `/admin/` and `/api/contact` must still fail. Verify noindex and CSP headers and inspect network requests. Do not share the raw static build publicly.
7. Share preview credentials through an approved secure channel. For multiple reviewers, prefer Cloudflare Access identities and rate-limiting policy; configure and test it explicitly rather than assuming a hidden URL is private.

## Environment isolation

| Environment | Worker | D1 (future) | R2 (future) |
|---|---|---|---|
| Preview | security-srl-preview | security-srl-preview-db | security-srl-preview-media |
| Production | security-srl-production | security-srl-production-db | security-srl-production-media |

The default configuration is locked and has no public workers.dev route. The production environment is also locked, with workers.dev and preview URLs disabled. There are no routes/domains or account IDs in the configuration. D1 and R2 arrays are intentionally empty so missing resources cannot break this presentation deployment.

To add storage during Phase 3, create the preview resources first under the verified account, then copy **only preview** binding entries from `config/storage-bindings.example.jsonc` into `env.preview`, replacing the identifier with the actual database ID. Use the exact created bucket name. Never copy production IDs into preview. Do not pass the example file directly to Wrangler.

Production resources, live data collection, production domain/DNS, automatic production builds and unlocking `worker/index.ts` require a later approved release. There is deliberately no deploy-production script or CI deployment secret.
