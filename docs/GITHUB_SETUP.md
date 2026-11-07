# GitHub repository and review workflow

Repository: https://github.com/NicoLumea/Security-SRL
Default branch: `main`. Repair branch: `fix/repository-structure`.

The manually uploaded main branch is the parent of the repair. No existing remote commits are rewritten. Work from the repository root, not a nested `source/` directory.

```sh
git clone https://github.com/NicoLumea/Security-SRL.git
cd Security-SRL
git switch fix/repository-structure
npm ci
npm run check
npm run lint
npm test
npm run build
npm run verify:build
npm run validate:worker
```

GitHub Actions in `.github/workflows/ci.yml` also installs Chromium with its operating-system dependencies and runs the Playwright suite. Review every required check before merging. No workflow deploys to Cloudflare and no deployment credentials are required for CI.

The original offline delivery instructions are retained unchanged in `ARCHIVE_START_HERE.txt` for historical reference; their paths and repository-status statements describe the ZIP, not the repaired checkout. The original `Security-SRL.bundle` remains recoverable from the uploaded main commit `f3716dc1687cb0e400db7dd9e1f1486ca1b7556d` and the original delivery ZIP. It is not needed in the active source tree.

Cloudflare connection is a separate later step; follow `CLOUDFLARE_SETUP.md`. Keep production locked and do not create D1/R2 resources for this presentation repair.
