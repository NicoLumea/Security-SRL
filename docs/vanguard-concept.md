# Vanguard — Concept 02

## Assessment

At baseline 0162a86, Vanguard had no routes, hero, navigation, sections, animation, or localized website. Its gallery moodboard and bilingual description defined the existing direction: expressive Manrope typography, editorial composition, charcoal #22201c, sand #b7a07a, diagonal geometry and an upward arrow. Sentinel was the only explorable concept. The gallery and switcher hard-coded all available concepts to Sentinel.

## Implementation

Vanguard now has Romanian and English pages at `/concepts/vanguard/ro/` and `/concepts/vanguard/en/`, generated only in presentation mode. This initial concept uses section navigation instead of inventing a multipage structure where none existed.

- Split editorial hero, bold headline and existing surveillance photograph; no video or new media.
- Numbered service rows with native disclosure of existing service descriptions.
- Asymmetric project composition, with inline context and approach disclosures. Existing examples remain explicitly demonstrative and stock imagery is labelled.
- Sand-colored approach section and the existing three-step proposed process.
- Browser-only demo contact validation using the existing UI module; no message transmission or invented contact details.
- Responsive native menu, local language switching, privacy disclosures and cookie preferences.
- Brief viewport entrance animations, cancelled for reduced motion. Content remains visible if JavaScript or observer APIs are unavailable.
- Scoped styling and a dedicated module; existing external script bundling/CSP are unchanged.
- Minimal shared routing/switcher changes make Vanguard available while retaining Sentinel defaults and leaving Concepts 03/04 unavailable.

No Sentinel component, stylesheet, script, video, Worker configuration, production setting or dependency is changed.

## Media direction

Keep the existing camera-on-white-wall photograph for this phase: it provides a bright architectural counterpoint to the charcoal editorial layout. The gallery's diagonal/arrow motif is expressed with typography and CSS. For a later phase, seek approval for real project photography with clean architectural framing and visible equipment; no replacement imagery or video is included here.

## Review and limitations

Service descriptions and projects are the existing presentation content, not newly verified company facts. Actual company history, certifications, projects and contact details still require client approval. The contact form remains a clearly labelled demo. No analytics, new credentials or public accounts are introduced.

Verification includes build/type/lint/unit checks, built HTML link and CSP validation, Worker public-access tests for both Vanguard locales, and Playwright coverage at 320/390/768/1024/1440px. Browser tests cover gallery/switcher/localization, disclosure controls, navigation, images, no overflow, no console errors, demo form behavior, WCAG checks in both languages, reduced motion and JavaScript-disabled navigation. Desktop/mobile screenshots are attached to the CI Playwright report. Existing Sentinel tests remain part of the same suite.
