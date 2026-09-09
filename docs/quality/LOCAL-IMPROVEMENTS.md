# Local quality pass — 9 September 2026

All application changes are local and uncommitted. No push, deployment, database migration, account action, or external message was performed. Lock In and Garage source code were excluded. Shared navigation and transitive dependency patches also apply wherever those shared dependencies are used.

## Follow-up: mobile and desktop product review

- Standings jump links now appear only below the side-by-side layout breakpoint. On desktop, both tables follow the page header directly.
- Routine source attribution moved below the data into a closed “About these stats” disclosure. Missing-data warnings remain visible and use short visitor-facing language.
- Comparison selectors and the copy-link action share a compact toolbar. Removed the prominent explanation of URL/history behavior; metric guidance remains available in an expandable section below the tool.
- Race jump links appear only for available results/charts; future and cancelled races no longer advertise empty sections. Provider details sit below the analysis.
- The live introduction is shorter, with optional help in “Timing guide.” Lap-filter details remain accessible in “Chart guide”; the active filter and hidden-lap count remain visible.
- The methodology page retains the detailed explanations for visitors who want them.
- The broader narrow-screen check exposed homepage overflow from the countdown grid and timezone picker. Explicit grid sizing and wrapping controls address the cause.
- Checked 320px/375px phone, 768px tablet, and 1440px desktop layouts, including native disclosure keyboard operation. This pass changes presentation, not data calculations or caching.

Follow-up check outputs use the `ux-` filename prefix in this directory.

## What changed

### Navigation and presentation

- Replaced the clipped mobile overlay with a scrollable native modal dialog, keyboard focus containment, Escape handling, and focus restoration. Desktop navigation begins at a width that fits the full link set.
- Added skip links and a single main landmark to the analytics layouts; removed nested main elements from marketing information pages.
- Increased small labels across season pages, added standings/race section links, and kept the broadcast identity.
- Added consistent route loading and missing-page states.
- Shortened homepage entrance animation. A shared event hook now starts from the server snapshot and updates after hydration, including weekend rollover in an already-open page.

### Data correctness and resilience

- Championship comparison progression now includes sprint points, joins by race date, checks API round translation, and uses local calendar round numbers.
- Extracted comparison calculations, race insights, and lap normalization into tested pure modules. Retirements no longer improve best/average completed-finish statistics.
- Fixed the empty constructor-name match that could incorrectly assign data to McLaren. Team historical standings now use the central constructor mapping.
- Preserved successful sources when another standings/comparison feed fails. The homepage no longer invents a ranked zero-point standings fallback.
- Added source and partial-data notices. Team profile progression is explicitly labeled Grand Prix-only rather than implying it includes sprints.
- Current-season aggregate results/qualifying/sprints refresh on the same five-minute cadence as standings; historical aggregates remain cacheable.
- Fetch retries release discarded response bodies, preserve the timeout when callers supply a signal, and stop when intentionally aborted.
- RSS ingestion enforces the three-megabyte limit during streaming, validates link protocols, and tolerates malformed Unicode references.

### Charts and live timing

- Race pages serialize compact lap rows and driver series instead of raw telemetry objects. Chart code loads near the viewport; comparison donuts use CSS rather than Recharts.
- Lap charts have larger driver controls, distinguishable line patterns, a selectable data table, and a documented long-lap filter. Filtering affects the visual view only; all recorded values remain in the table.
- SSE connections re-arm when a session window opens, pause while hidden, expire silent connections, and reconnect with backoff. Bursts are coalesced into at most ten data renders per second.
- OpenF1 polling pauses while SSE supplies current timing, avoids overlapping requests, aborts obsolete work, and refreshes historical review every five minutes.
- The live API validates complete positive identifiers, rejects unfinished replay sessions, and caches completed-session panels independently. Latest-per-driver reduction happens before caching so full interval histories cannot exceed the cache entry limit.
- Focused telemetry requests cover a bounded five-minute window. Invalid throttle/brake percentages show unavailable values; bars use transforms.
- Preserved relay origin checks and stream caps, closed a cap race after negotiation, and improved abort listener cleanup. Negotiation/status calls have explicit timeouts.

### SEO, useful content, and dependencies

- Added server-rendered explanations of comparison metrics, timing gaps, review behavior, and data methodology, plus result-derived race summaries and contextual internal links.
- Preserved existing page canonicals, metadata, structured data, sitemap rules, affiliation disclaimer, and cancelled-event exclusions.
- Patched Browserslist, Babel, and both affected fflate release lines using narrow pnpm overrides. The production dependency audit fell from six advisories to one, with no remaining high or critical advisories.
- Limited per-worker prerender concurrency to reduce bursts against public feeds. Installs used a project-local store and cache.

## Verification

- `CI=true pnpm typecheck`: passed.
- `CI=true pnpm lint`: passed without warnings.
- `CI=true pnpm test`: 120 passed, one intentionally environment-gated integration test skipped.
- `DATABASE_URL= BETTER_AUTH_SECRET= BETTER_AUTH_URL= CI=true pnpm build`: production build passed; 108 static paths generated. Upstream 429s still occurred and were handled through existing independent fallbacks.
- `CI=true pnpm seo:check`: 94 sitemap URLs and 96 internal targets passed metadata, canonical, structured-data, status, and link checks.
- Browser checks at 320/375px and 1440px covered homepage, comparison, standings, calendar, profiles, news, methodology, race analysis, and live review. Sampled pages had no document-level horizontal overflow; wide race tables keep their internal scrolling.
- Verified mobile menu scrolling, modal focus containment, Escape/focus restoration, comparison URL selection and browser-back restoration, lap toggles, and the 53-row accessible lap table.
- Verified completed Monza, future Madrid, cancelled Bahrain, idle live timing, historical review `11361`, and malformed replay input.
- Live API malformed session/driver inputs returned 400; rejected Origin returned 403; off-session SSE returned `offline` and closed. Historical review returned 22 positions in approximately 25 KB, without the previous cache-size error.
- Sample local HTML sizes: homepage 141 KB, comparison 108 KB, Monza analysis 204 KB. These are uncompressed response sizes, not Lighthouse scores or field Core Web Vitals. They vary with upstream data.
- `git diff --check`: passed.

Command output is retained beside this report. The final local preview runs on port 3200 with the game disabled through process-only environment overrides.

## What local code cannot certify

- Real SignalR delivery, reconnect behavior under live race traffic, and platform timeouts still need verification during a competitive session. The unit tests and historical review do not replace that test.
- Reduced-motion handling remains centralized in the existing GSAP/CSS system. No operating-system reduced-motion emulation was available in the preview tooling for this pass.
- Local production previews report missing Vercel analytics endpoints; those endpoints are supplied by Vercel on deployment.
- The remaining moderate esbuild advisory belongs to legacy database tooling pulled through Better Auth/Drizzle. It concerns the development server. A cross-minor tooling replacement was deliberately left for the excluded game rebuild; no database tool was run.
- Search traffic, ranking, retention, and real-user performance require production measurements. This work improves their foundations; it does not establish a measured 9/10 or 10/10 in every category.
- Commercial use of upstream timing data requires the relevant permissions. This pass neither changes data rights nor enables a paid offering. OpenF1-dependent analytics and the separately licensed game should remain distinct.

For review, start with `/`, `/compare`, `/standings`, `/races/italian-gp#lap-times`, `/live?replay=11361`, and `/about#methodology`.
