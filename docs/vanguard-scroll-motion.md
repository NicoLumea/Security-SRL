# Vanguard — Cinematic scroll choreography

## Scope and identity
Only Concept 02 is changed. Editorial typography, charcoal/sand colors, arrow treatment, photography, service and portfolio data, Romanian/English copy and page layout remain intact. Sentinel's video and all other concepts are untouched.

## Motion vocabulary
- **Hero sequence:** concise staggered keyframe entrances for the existing headline, paragraph, CTA, photograph and arrow. These are native Web Animations API calls.
- **Scroll-linked content:** normalized progress from element viewport geometry, updated in one passive-scroll requestAnimationFrame loop. Effects reverse continuously with scroll direction rather than replaying once.
- **Typography:** kicker, heading and intro stagger independently. The heading movement is deliberate and stronger than supporting text.
- **Service / process rows:** controlled upward movement and opacity with ordinal staggering.
- **Projects:** alternating left/right arrival, subtle reversible image parallax and existing clipped image composition.
- **About:** asymmetrical opposing-direction entrance. The contact title moves gently; the form and focused inputs do not.
- **Hero retreat:** text and photograph move at slightly different speeds as the hero leaves the viewport. No scroll snapping, forced scrolling, external library or layout-property animation.

## Reliability / accessibility
- All content is visible with JavaScript disabled or initialization failure; CSS motion selectors only apply after the Vanguard script marks the root active.
- Reduced-motion users see static, fully visible content. Live preference changes cancel staged animations and clear per-element motion.
- Keyboard focus bypasses motion for focused content.
- CSS variable-based transforms and opacity retain compositing-friendly updates without changing layout sizes.
- The loop runs on demand rather than polling continuously; mobile distances and parallax are reduced.
- No extra dependencies or modifications to the existing CSP.

## Verification
`tests/browser/vanguard-motion.spec.ts` covers forward/reverse/rapid scroll progress, viewport overflow at 320/390/768/1024/1440 px, reduced-motion changes, imagery, form stability and screenshots. Existing `tests/browser/vanguard.spec.ts` continues to cover the bilingual page, no-JS navigation and accessibility.

Review the GitHub Actions build, type checks, lint, unit, Worker runtime and browser outcomes before approving. The CI browser is Chromium; real-device Safari/iPhone performance is not claimed.

## Deployment
Feature branch: `feature/vanguard-cinematic-scroll-animations`. Leave the PR open for review. No production deployment or merge. A Cloudflare preview URL must be obtained from a real deployment rather than inferred.
