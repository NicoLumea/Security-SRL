# Sentinel scroll motion

The Sentinel layout loads `src/scripts/sentinel-reveals.ts` and
`src/styles/sentinel-reveals.css`. The gallery and unfinished concepts do not load
this enhancement. There are no animation dependencies.

## Reuse

Add `data-reveal="fade-up"` to a major content block. Available variants:

| Variant             | Entrance                 |
| ------------------- | ------------------------ |
| `fade-up`           | From below               |
| `fade-right`        | From the right           |
| `fade-left`         | From the left            |
| `fade-bottom-right` | From below and the right |
| `fade-scale`        | From 98.5% scale         |

Wrap related targets in `data-reveal-group` to stagger siblings entering together
by 100ms (maximum 300ms total delay). Optional `data-reveal-delay` and
`data-reveal-duration` attributes set milliseconds; duration is bounded to
650–950ms. CSS custom properties control distance and easing. The default is
32px/800ms, reduced to 22px on narrow screens. Do not nest animated targets.

## Visibility and interaction

Content is visible in the original HTML. Initialization only hides targets below
the viewport. One observer reveals entering targets; a second resets targets only
after they leave a 160px perimeter around the viewport. This supports downward and
upward replay without resetting partially visible sections. Staggering starts
fresh for each entering group, including new mobile rows.

Only opacity, translation and scale transition. Original card hover transforms
remain intact. Main-content overflow is clipped horizontally. Animation styles
are released after settling, and observers/timers are cleaned up on page exit.
Back/forward restoration reinitializes the enhancement.

Reduced motion disables reveals immediately, including live preference changes.
No JavaScript, unavailable observers and initialization/callback errors leave
content visible. Keyboard focus and fragment navigation reveal targets
immediately. Focused targets never reset. Navigation, form fields and the hero
are not reveal targets; no content receives `aria-hidden` for animation.

## Hero and deployment

The hero photograph, text and layout are unchanged. Existing conditional MP4/WebM
slots already support muted autoplay, looping, playsinline, a poster, responsive
cropping and reduced-motion fallback. Their source configuration remains empty;
no video asset is added or requested.

Worker authentication, production locking, secrets and preview configuration are
unchanged. The feature branch includes the merged PR #2 preview foundation.

## Verification

Run the existing check, lint, unit, build, link, Worker-validation and runtime
scripts, then `npx playwright install --with-deps chromium` and `npm run test:e2e`.
The browser suite checks 320, 390, 768, 1024 and 1440px; real opacity transitions,
upward replay, partial visibility, stable target dimensions, overflow, keyboard
focus, reduced motion, no JavaScript, observer failure, fragment navigation,
portfolio filtering, inner pages, English routing and gallery isolation. Existing
navigation, form and accessibility scans remain enabled.
