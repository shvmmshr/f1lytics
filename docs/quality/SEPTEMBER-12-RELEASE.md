# Circuit, reference-data and UI release — 12 September 2026

This release excludes the local Lock In rebuild. Existing published game routes and their configuration remain in place.

## Included changes

- Rebuilt all 25 circuit guides with responsive maps, track facts, key sections, racing notes, schedules and classification-aware states. Updated maps for 23 active venues; retained historical maps for cancelled venues. Fixed the clipped mobile lap-record tile.
- Centralized mutable circuit, team, driver-number and timetable references in validated JSON. Corrected nine lap records and six team references. Race-date joins, cancellation guards and honest missing-data states remain intact.
- Standings use the constructors reported by the results feed. Additional race entrants are shown separately from the listed season lineup. Completed races no longer remain the next event merely because their UTC race date has not ended.
- Added shared page headers, readable team text colors, visible keyboard focus, larger mobile controls and overflow-aware table cues. Refined navigation breakpoints, homepage alignment, news rendering, live labels and Garage stats.
- Added four Garage exhibits: Red Bull RB9, Brawn BGP 001, Renault R25 and McLaren MP4/13. Local previews load first; only an explicit action mounts a single creator-hosted viewer. Credits and reconstruction qualifications remain visible.
- Refreshed page-specific OG/Twitter cards, including selected Garage exhibits. Preview facts derive from the local reference catalog, with versioned URLs and bounded rendering inputs.

## Freshness and automatic updates

ISR alone could not update facts embedded in hardcoded constants. The constants now consume validated reference snapshots; a scheduled source check can update those snapshots and maps.

```sh
CI=true pnpm data:sync          # inspect sources and write a diagnostic report
CI=true pnpm data:sync --check  # fail on drift or required review
CI=true pnpm data:sync --write  # apply validated references and maps
```

The reference workflow runs daily at 03:17 UTC and supports manual dispatch. It runs typecheck, lint and tests before committing only the generated data/map allowlist. It requires GitHub Actions write permission and a compatible branch policy. Hosted scheduled execution must be verified after publication.

Source requests have concurrency, timeout, retry and byte limits. Race identity, format, geometry and unrecognized entrant changes require review; automatic time corrections cannot move an elapsed prediction deadline. Roster substitutions do not silently rewrite permanent driver identities. Season rollover remains a deliberate migration.

Visible data pages refresh their server content every five minutes; news refreshes every fifteen. Refresh pauses while hidden, offline or editing controls. Live timing, Garage and game routes retain their own lifecycles. The authenticated invalidation endpoint also clears current-season and news cache tags while preserving historical caching.

## Validation scope

The non–Lock In release snapshot passed typecheck, lint, the production build and 206 unit tests, with one environment-gated integration test skipped. Its production crawl passed for 95 sitemap URLs, 122 internal targets and 114 generated social images. The existing disabled-game state was verified, and the build contains none of the new daily, studio or rules routes.

Earlier production browser checks covered all circuit pages and key season indexes at 320, 390, 768 and 1440px, including upcoming, cancelled and completed races. Those layout checks used the full local workspace before the game changes were separated.

Real live-session delivery, hosted scheduled execution, external social-platform caches, authenticated game flows and real-user Core Web Vitals are not established by these local checks.
