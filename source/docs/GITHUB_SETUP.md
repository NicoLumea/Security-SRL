# GitHub setup — manual step required

Verified connected account: **NicoLumea**. Search returned no accessible Security-SRL repository. The connector has no repository-creation operation. The browser redirected `/new` to sign-in, so creation stopped. No existing repo, successful push or PR is claimed.

## Preserve the supplied history (recommended)

1. Extract `Security-SRL-Phase1-2.zip`.
2. Clone its Git bundle into a fresh directory:

   ```sh
   git clone Security-SRL.bundle Security-SRL
   cd Security-SRL
   git switch feature/security-concept-gallery
   git branch main origin/main
   git remote remove origin
   ```

   The bundle HEAD is the feature branch. If Git already created local `main`, omit `git branch main origin/main`.
3. In your own authenticated GitHub session, open https://github.com/new. Choose owner **NicoLumea**, name **Security-SRL**, and **Private**. Leave GitHub README, license and ignore-file initialization off because the bundle already has an initialization commit on `main`. Create the repository.
4. Add the destination and push only these branches:

   ```sh
   git remote add origin https://github.com/NicoLumea/Security-SRL.git
   git push -u origin main
   git push -u origin feature/security-concept-gallery
   ```

   Use GitHub Desktop or your normal credential manager for authentication. Never paste a token into chat or put it in a remote URL. The URL above is the intended destination and only exists after step 3 succeeds.
5. Open a pull request with base `main`, compare `feature/security-concept-gallery`, and title **Build Security SRL gallery and Sentinel concept**. Paste `docs/PULL_REQUEST.md` as the body. Keep it unmerged. Check GitHub Actions and finish the browser test run before approval.
6. Verify repository visibility remains Private and enable a required CI check/branch protection if desired. Do not connect production deployment yet.

## If the name now exists

Do not overwrite it or force-push. Inspect its ownership, visibility and current history first. Import the feature changes into a new branch based on its actual main after resolving any content conflicts.

`source/` in the archive is an ordinary source snapshot for inspection; the bundle is the preferred way to recover the exact branch history. `preview-build/` is a static build, not a secure public deployment package by itself.
