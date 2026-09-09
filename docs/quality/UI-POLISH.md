# Small UI polish — September 9, 2026

## Changes

- Timezone selection uses a compact city/offset label, retains the full name in the native dropdown and title, and has a 44px minimum tap target. Its CSS hover border is no longer overridden by inline styling. The compact schedule header can wrap at narrow widths.
- Timezone labels are memoized so the minute ticker no longer rebuilds hundreds of Intl labels. Invalid stored zones and unavailable localStorage fall back to an in-session preference.
- Footer branding wraps cleanly, navigation links have larger tap targets, and a native Back to top anchor helps on long pages.
- Native Team radio disclosure adds a small F1 easter egg without JavaScript or animation; its indicator changes from + to − while open.
- Breadcrumb links have larger hit areas across driver, constructor, circuit and race profiles.
- News source lines and header metadata wrap; mobile Garage cards show driver names and tablet thumbnails leave more room for text.

## Scope and checks

Reviewed every non-game page type, using representative detail records rather than every driver/team/circuit slug. Production browser geometry checks covered 20 URLs at 320px and 1440px: home, standings, calendar, drivers, teams, circuits, races, news, compare, Garage, about, support, privacy, live, Verstappen, Ferrari, Monza circuit, Madrid future race, Monza completed race and Bahrain cancelled race. No horizontal document overflow was detected. Initial 375px checks also passed across the main routes.

Typecheck, lint and production build passed. Tests: 122 passed, 1 skipped. SEO crawl: 95 sitemap URLs / 97 targets passed. The production calendar rendered Kolkata (GMT+5:30) in a 44px-high selector within a 320px viewport.

Preview screenshots and keyboard automation became intermittent; geometry and DOM checks are not a complete visual/device audit. Final keyboard interaction and blocked-storage behavior need a reliable browser recheck. Real-time timing is still not verified during an actual session.

No dependencies, network fetches, timers or animation loops were added. Existing tests/build support correctness; no new Lighthouse or real-user performance score is claimed. Approved for pushing with the complete polish pass.
