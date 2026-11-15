# Romanian Sentinel hero video

Only `/concepts/sentinel/ro/` enables the supplied security camera footage.

- Asset: `public/media/sentinel-hero-security-camera.mp4`.
- Uploaded filename in this task: `security-hero-1080p.mp4` (the task text called it `security-hero-1080p(1).mp4`).
- SHA-256: `fe203cf8d9e258f261e9eef43f7f34274a9ee21959662d0df007949deceb18a9`.
- Copied byte-for-byte: H.264, 1920 × 1070, 24 fps, 5.083 seconds, no audio. No re-encoding or effects.

`src/concepts/sentinel/Home.astro` retains the existing image and adds an inert video template for Romanian only. `src/scripts/sentinel-hero-video.ts` inserts one video when reduced motion is off and removes it when reduced motion is on. Playback uses native muted autoplay, loop, inline playback and metadata preload; there are no play retries or playback dependencies. With JavaScript disabled, reduced motion, failed media or blocked autoplay, the existing photograph remains visible. The video becomes visible only after the native playing event.

`src/styles/sentinel.css` adds video-only rules: cover sizing inherited from the existing media styles, 80% horizontal positioning to retain the camera on narrow screens, original footage colors, no pointer interception, and a reduced-motion safeguard. Hero dimensions, gradients, typography, content, navigation and scroll reveal code are unchanged. English and the concept gallery remain static.

## Verification

Passed locally: Astro check; ESLint; 11 unit tests; production build; all 23 built pages and 702 internal links/assets; Wrangler dry-run; 11 Worker runtime tests; git diff whitespace check; source/destination SHA-256 comparison.

Browser verification remains pending. Playwright's browser archive download failed; installed Chromium could not launch because socket creation was denied by the execution environment. No browser test results or screenshots are claimed. `tests/browser/hero-video.spec.ts` adds checks at 320, 390, 768, 1024 and 1440 pixels for playback, looping, layout stability, overflow, motion changes, failed media, and English/gallery isolation; the existing navigation, accessibility and scroll-animation suite is retained. Desktop/mobile screenshots are captured by that test when browsers are available. Safari, Firefox and Edge require subsequent review.

No production deployment or configuration changes. Review the feature branch and PR before merging.
