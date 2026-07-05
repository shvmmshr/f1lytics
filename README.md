<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="design/brand/f1lytics-lockup-dark.png" />
    <img src="design/brand/f1lytics-lockup-light.png" alt="F1lytics" width="420" />
  </picture>
</p>

<p align="center">
  Formula 1 2026, decoded — live timing, standings, telemetry, and race analytics in one broadcast-style dashboard.
</p>

<p align="center">
  <a href="https://f1lytics.com"><strong>f1lytics.com</strong></a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#data-sources">Data Sources</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss" alt="Tailwind CSS 4" />
</p>

<br />

<p align="center">
  <img src="https://f1lytics.com/opengraph-image" alt="F1lytics preview" width="720" />
</p>

---

## Features

### Race weekends, live
- **Live Timing** — real-time positions, gaps, intervals, sector times, tyres, and race control messages, streamed from Formula 1's own live feed over Server-Sent Events.
- **Starting Grid** — appears minutes after qualifying ends (OpenF1-first, official data as it publishes), on the race page and the homepage weekend card.
- **Weekend Mode** — during a race weekend the homepage switches state automatically: countdown to lights out, sprint winner, grid preview; after the flag, the podium takes over for three days.
- **Sprint Results** — full sprint classification on every sprint-weekend race page.
- **Race Review** — replay the timing tower of any completed session.

### The season, analyzed
- **Standings** — driver and constructor championships with points gaps and per-driver team contributions.
- **Race Results** — every Grand Prix with lap-time charts, tyre strategies, and grid-to-finish deltas.
- **Driver & Team Profiles** — career stats, season form, teammate head-to-heads, historical constructor timelines.
- **Head-to-Head Compare** — any two drivers or teams across stats, qualifying pace, and points progression.
- **Circuit Guide** — all circuits on an interactive 3D globe, with track maps, lap records, and key stats.
- **Calendar & Schedule** — the full season with session times in your local timezone (switchable), sprint-aware countdowns, and a season progress bar.
- **F1 News** — aggregated headlines from BBC Sport, Motorsport.com, Autosport, The Race, and PlanetF1.

Fully responsive, dark broadcast-style UI with a state-aware homepage — the headline is generated from live season data, not a slogan.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, ISR) |
| Language | [TypeScript 5](https://typescriptlang.org) (strict mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Animations | [GSAP 3](https://gsap.com) + ScrollTrigger, [Framer Motion](https://motion.dev) |
| Charts | [Recharts 3](https://recharts.org) |
| 3D | [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs) |
| Data | [Jolpica-F1](https://github.com/jolpica/jolpica-f1), [OpenF1](https://openf1.org), F1 live timing |
| UI Components | [Radix UI](https://radix-ui.com), [Lucide Icons](https://lucide.dev) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) + [Speed Insights](https://vercel.com/docs/speed-insights) |
| Deployment | [Vercel](https://vercel.com) |

## Getting Started

```bash
git clone https://github.com/shvmmshr/f1lytics.git
cd f1lytics
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables are required — all data comes from free, public APIs. (Optionally set `REVALIDATION_SECRET` in production to protect the on-demand cache revalidation endpoint.)

## Project Structure

```
src/
├── app/
│   ├── (marketing)/       # Homepage (state-aware hero, weekend mode)
│   ├── (season)/          # Standings, calendar, drivers, teams, circuits, races, news
│   ├── (live)/            # Live timing and race review
│   ├── (tools)/           # Head-to-head compare
│   └── api/               # Live data, SSE relay, news, revalidation
├── components/
│   ├── charts/            # Lap times, tyre strategy visualizations
│   ├── home/              # Hero, countdown, calendar strip, news strip
│   ├── layout/            # Navbar, footer, page transitions
│   ├── live/              # Live timing UI
│   ├── shared/            # Broadcast design system, logo, schedules, badges
│   └── ui/                # Base primitives (shadcn/ui)
├── hooks/                 # Live polling + SSE stream hooks
└── lib/
    ├── api/               # Jolpica, OpenF1, weekend resolver, news
    └── constants/         # Season data (circuits, drivers, teams, schedules)
```

## Data Sources

| Source | Usage | Freshness |
|--------|-------|-----------|
| [OpenF1](https://openf1.org) | Session results, laps, stints, telemetry, weather | Minutes after each session |
| [Jolpica-F1](https://github.com/jolpica/jolpica-f1) | Official standings, results, qualifying | Authoritative, hours after |
| F1 live timing | Real-time timing during sessions (SSE relay) | Live |
| RSS feeds | F1 news from major motorsport outlets | ~15 min |

Time-sensitive data (grids, fresh podiums) resolves OpenF1-first and upgrades to official Jolpica data as it publishes. Everything is cached with Next.js ISR on per-route revalidation intervals — results and points appear within about five minutes of a session ending.

## Deployment

Deploy your own instance with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shvmmshr/f1lytics)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push and open a Pull Request

## License

MIT — see [LICENSE](LICENSE).

*F1lytics is an unofficial fan project and is not affiliated with Formula 1, the FIA, or any F1 team.*

---

<p align="center">
  If you find this useful, consider supporting the project!
  <br /><br />
  <a href="https://github.com/sponsors/shvmmshr">
    <img src="https://img.shields.io/badge/Sponsor-GitHub-%23ea4aaa?logo=github-sponsors" alt="GitHub Sponsors" />
  </a>
  &nbsp;
  <a href="https://github.com/shvmmshr/f1lytics">
    <img src="https://img.shields.io/github/stars/shvmmshr/f1lytics?style=social" alt="GitHub stars" />
  </a>
</p>
