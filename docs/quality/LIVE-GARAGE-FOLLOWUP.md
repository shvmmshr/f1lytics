# Compare, Garage and live timing follow-up

- Compare fills missing or invalid URL selections with the actual displayed drivers/teams via replaceState, preserving unrelated query parameters and the hash. It does not add a history entry on initial normalization.
- Garage adds Senna’s 1988 MP4/4 and Mansell’s 1992 FW14B with local WebP previews, creator attribution and opt-in embeds. Five cards scroll horizontally on smaller screens and form a five-column desktop grid. An untextured Lotus candidate was rejected.
- SignalR TimingData.Retired is preserved as RET. Finished OpenF1 session results supply DNF/DNS/DSQ and final positions. Missing positions are displayed as unclassified, rather than retaining an obsolete on-track position. Missing laps, pit stops and lapped cars are not treated as retirements.
- Retired rows show status in place of stale gaps and intervals. The narrow mobile tower omits Last Lap to preserve space for names, best laps and status; it returns at 640px. Row selection has aria-pressed and descriptive labels.
- Finished-session car telemetry is no longer fetched or presented as live speed/RPM. For 2026, the legacy DRS field is not reinterpreted: Active Aero and Overtake Mode states are explicitly unavailable. Pre-2026 live telemetry retains its DRS presentation.
- Main navigation is 64px tall and desktop typography/padding scale with width. The live screen has an 1800px content limit and a larger title.

## Evidence

Typecheck, lint, production build and 125 unit tests passed (1 integration test skipped). SEO crawl: 95 sitemap URLs and 97 targets passed. Added tests for classifications, DNS/DSQ precedence, feed retirement updates and avoiding false retirements from Stopped/lap deficits.

Production browser opening /compare returned the normalized Verstappen/Norris URL. Header geometry had no horizontal overflow at 320, 768, 1280 and 1920px. Monza session 11361 returned 22 rows with DNF flags for drivers 16, 18 and 14; focusedCarData was null in review. Final interactive screenshots remain limited by intermittent preview capture/hydration timing. A real competitive session is still required to verify end-to-end SignalR retirement delivery.

Sources:
- https://corp.formula1.com/f1-2026-regulations-terminology-update/
- https://openf1.org/docs/#session-result
- Garage creators and historical sources are recorded in docs/garage/model-sources.json and src/lib/garage/legends.ts.

No new dependencies or auto-loaded 3D viewers. Finished classification is one cached additional dataset (five-minute freshness), replacing unnecessary review car-telemetry downloads. All work is local pending review.
