# Precision — Rotating Categories and Motion

## Identity and source content
The design retains Precision / Engineered Clarity: warm off-white, geometric rings, architectural panel lines, metallic-gold accents and precise typography. All four existing categories come from `src/data/content.ts` (video surveillance, access control, alarm systems, integrated solutions) using their existing icons. No new service, company credential, or project is invented.

## Category selector
- Four category panels move along a fixed horizontal track. One active panel is centered and larger; adjacent items remain visible on both sides. The far item is positioned outside the viewport and is teleported invisibly when crossing a wrap boundary to avoid a jump.
- Automatic advance is one category per **5 seconds** with an **850 ms** transform/opacity transition.
- The icon/metallic ring gains emphasis. The active title, summary and description appear below the track in a stable detail panel. Only one extended description is visually shown in JavaScript mode.
- Controls: previous, next, pause/resume, select a neighboring category, Left/Right arrow keys. Any manual selection pauses auto-advance until the user explicitly resumes.
- Automatic movement pauses on pointer hover, keyboard focus and when the document is hidden; only resumes if user has not deliberately paused.
- Accessible service descriptions remain available through button `aria-describedby`. Automatic updates do not produce a repeated live announcement; explicit user selections update a polite status.
- With JavaScript off, the same four services and full details are displayed as a simple static grid.

## Supporting motion
A gentle progressive hero introduction and sequential process/project reveals use native Web Animations API / IntersectionObserver. They are decorative and do not hide content without JS. The contact form and its focus/validation remain stationary.

## Accessibility and performance
`prefers-reduced-motion` disables autoplay and animation while preserving manual category selection. Transforms and opacity are compositor-friendly; fixed track and detail heights avoid layout shifts. No new dependency, no inline script, and no CSP relaxation.

## Verification
Added `tests/browser/precision-carousel.spec.ts` for both locales, looping, 5-second timing, manual controls, hover/focus, keyboard behavior, reduced-motion, no-JS, layout stability and 320/390/768/1024/1440 viewports. CI still needs to run and the actual Cloudflare preview must be obtained from a successful deployment, never guessed. Real mobile Safari is not claimed tested.

## Release scope
Feature branch only; no merge or production deploy. Sentinel, Vanguard, Dominion and the concept gallery are outside this change.
