# CLAUDE.md

F1lytics — Formula 1 2026 dashboard (Next.js 16 App Router, Tailwind 4, pnpm). Live at f1lytics.com via Vercel.

## Commands

- `pnpm dev --port 3000` / `pnpm build` / `pnpm start --port 3200` (prod check)
- `pnpm exec tsc --noEmit && pnpm exec eslint src` — run both before committing

## Data sources (the core domain knowledge)

- **Jolpica** (`src/lib/api/jolpica.ts`, Ergast mirror): authoritative results/standings/points, but **lags hours** after sessions. It also **renumbers rounds** when races are cancelled — always translate via `getApiRound(circuit)` and guard fetched data with `date === circuit.raceDate`.
- **OpenF1** (`src/lib/api/openf1.ts`): `session_result` publishes classifications **minutes** after a session. `src/lib/api/weekend.ts` implements the resolver pattern: OpenF1-first, Jolpica upgrade. OpenF1 is fully gated (401) *during* live sessions; `/starting_grid` endpoint is empty for 2026 — don't use it.
- **Live timing**: F1's unauthenticated SignalR Core hub, relayed as SSE by `/api/live-stream` (see `memory/live-data-paywalled.md` context). Schedule-based session detection lives in `src/lib/constants/sessions.ts` (baked 2026 calendar — update manually if F1 reschedules).
- Both free APIs rate-limit hard: **429s are routine**, retried in `fetch-retry.ts`, logged with `console.warn` (never `console.error` — Next's dev overlay and log alerting treat error as a red alert; reserve it for the unexpected).

## Caching rules

- Fetch revalidate: 300s for anything post-session-sensitive (results, standings, grid), 3600s default, 86400s for settled-race telemetry (2+ days old, immutable).
- **Every page with conditional fetches needs `export const revalidate`** — a build-time render that skips all fetches makes the page permanently static (this bug hid the Austrian GP results until a redeploy).
- Failed fetches are never cached by Next; empty chart sections self-heal on the next ISR pass.

## Design system

- Broadcast/timing-screen aesthetic: tokens in `src/components/shared/broadcast.tsx` (`F1.*` colors — red brand, purple = fastest/sector-best only, amber = sprint). Fonts: Antonio (display), Space Grotesk (body), JetBrains Mono (data) — variable fonts, don't add static weights.
- Styling is inline `style={{}}` + Tailwind utilities. Inline styles can't respond to breakpoints: use Tailwind arbitrary responsive classes (`md:grid-cols-[...]`), `clamp()` for fluid type/padding, and hidden-column patterns for tables. **Hover on elements with inline backgrounds**: use inset box-shadow (`hover:shadow-[inset_0_0_0_999px_rgba(255,255,255,0.04)]`) — bg classes lose to inline styles.
- No `Date.now()`/`Math.random()` in render paths of client components without mount guards (hydration); no browser-API branches in JSX (see `scroll-progress.tsx` for the pattern).
- Homepage hero headline is state-aware (live / countdown / championship gap) — states resolve from `weekend` server prop + client schedule check.

## Brand assets

- `public/brand/f1lytics-wordmark-dark.png` — the only browser-served logo (navbar/footer via `src/components/shared/logo.tsx`).
- `design/brand/` — source lockup/car/icon PNGs, NOT served; OG card reads the lockup from disk (`opengraph-image.tsx`). Icons are static `src/app/icon.png` / `apple-icon.png` / `favicon.ico`.
- Never spell out "FORMULA 1" in shipped branding (trademark); footer carries the unofficial-fan-project disclaimer.

## Gotchas

- Round numbers (RD 11/24) intentionally include the 2 cancelled slots; race count is 22 — both are correct, don't "fix" one into the other.
- SEO: canonicals are self-referential via root `alternates.canonical: "./"`; root openGraph/twitter deliberately omit title/description so pages inherit their own — don't re-add them.
- `/api/revalidate` uses timing-safe secret comparison (`x-revalidate-secret` header preferred); `/api/live-stream` has a per-instance concurrency cap and origin allowlist — keep both when editing.
- `images.remotePatterns` are literal news-CDN hosts, mirrored in `OPTIMIZED_IMAGE_HOSTS` (news page); unknown hosts fall back to plain `<img>` by design.
