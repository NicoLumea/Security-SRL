# Editing content now and later

## Current file-based editing

- `src/config/site.ts`: working name, optional logo path, colors, contact details, approved social URLs, hero video sources and featured project IDs. Blank contact/social fields remain hidden or explicitly pending.
- `src/i18n/index.ts`: Romanian and English copy; all live pages share layouts. New languages require complete dictionaries, localized route names, project translations and `locales` registration before a selector is shown.
- `src/data/content.ts`: services, stock-image demonstration projects and concept availability. IDs are stable; translated slugs have separate URLs. Add an Astro-imported image to `src/assets/`, accurate localized alt text, and an object-position that keeps the equipment visible.
- `site.featuredOrder` controls the home project selection/order. Desktop shows both; mobile provides swipe/previous/next and opt-in six-second rotation. Rotation pauses on pointer/focus/visibility interactions and is unavailable under reduced motion.

Changing data requires a rebuild. There is no staff editor yet. Do not remove demonstration labels until actual project details and photo rights have been approved.

## Hero video

No video was supplied; the current hero is licensed still photography. There is no fabricated MP4.

For a later approved video, place an optimized H.264 MP4 in `public/videos/`, optionally a WebM, and set root-relative `heroVideo.mp4`/`webm`. Replace the poster source in `Home.astro` with an exact frame from that video (the current poster is the illustrative facade). Set `objectPosition`, test portrait/landscape cropping and remove audio. The implementation uses loop, muted and playsinline; playback is attempted only when motion is permitted, and rejected playback retains the image. No source loads under reduced motion. No JavaScript means the still fallback remains visible. Test actual codecs/playback on mobile before delivery; none was possible with an absent video.

## Future R2 uploads

`MediaService` is a contract only. Keep R2 private. Staff APIs must authenticate/authorize each upload, validate magic bytes and MIME, enforce image/video size limits, generate opaque object keys, strip sensitive metadata, quarantine before approval and create responsive derivatives. Store object metadata and relationships in D1. Publish only approved objects through a controlled media route; update CSP only for deliberately selected media origins. Never expose R2 admin credentials or arbitrary object-key access to a browser.

Replacing/deleting objects requires reference checks, audit logging and a recoverable retention window. A scheduled orphan cleanup should operate only on unreferenced objects older than the window. These operations are pending, not simulated.
