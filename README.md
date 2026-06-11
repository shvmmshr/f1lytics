<p align="center">
  <h1 align="center">F1LYTICS</h1>
  <p align="center">
    A modern Formula 1 dashboard for the 2026 season: live timing, standings, driver analytics, telemetry, and more.
  </p>
</p>

<p align="center">
  <a href="https://f1lytics.com">Live Site</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss" alt="Tailwind CSS 4" />
</p>

<br />

<p align="center">
  <img src="https://f1lytics.com/opengraph-image" alt="F1lytics Preview" width="720" />
</p>

---

## Features

- **Live Timing**: Real-time session timing straight from Formula 1's official live feed, with positions, gaps, intervals, tyre data, and race control messages.
- **Race Review**: Replay the timing tower and full classification of any completed session, powered by OpenF1.
- **Driver Standings**: Full championship standings with points breakdowns and position-history charts.
- **Constructor Standings**: Team rankings with per-driver contribution breakdowns.
- **Race Results**: Detailed results for every Grand Prix, including lap charts, tyre strategies, and fastest laps.
- **Driver Profiles**: Career stats, recent form, and season performance for all 22 drivers.
- **Team Profiles**: Constructor details with driver lineups and historical performance.
- **Circuit Guide**: Every 2026 circuit with an interactive 3D globe, track maps, lap records, and key stats.
- **Session Schedule**: FP1, FP2, FP3, qualifying, sprint, and race times shown in the visitor's local time, switchable to any timezone.
- **Race Calendar**: An interactive timeline of the full 2026 season with a countdown to the next event (sprint-aware).
- **Head-to-Head Compare**: Compare any two drivers across stats, qualifying pace, points progression, and recent form.
- **F1 News**: Aggregated headlines from BBC Sport, Motorsport.com, Autosport, The Race, and PlanetF1.
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile, with smooth GSAP scroll animations.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, ISR) |
| Language | [TypeScript 5](https://typescriptlang.org) (strict mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Animations | [GSAP 3](https://gsap.com) + ScrollTrigger, [Framer Motion](https://motion.dev) |
| Charts | [Recharts 3](https://recharts.org) |
| 3D | [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs) |
| Data | [Jolpica-F1 API](https://github.com/jolpica/jolpica-f1), [OpenF1 API](https://openf1.org), F1 live timing |
| UI Components | [Radix UI](https://radix-ui.com), [Lucide Icons](https://lucide.dev) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics), [Vercel Speed Insights](https://vercel.com/docs/speed-insights) |
| Deployment | [Vercel](https://vercel.com) |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/shvmmshr/f1lytics.git
cd f1lytics

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

No environment variables are required. All data comes from free, public APIs.

## Project Structure

```
src/
├── app/
│   ├── (marketing)/       # Landing page
│   ├── (season)/          # Standings, calendar, drivers, teams, circuits, races, news
│   ├── (live)/            # Live timing and race review
│   ├── (tools)/           # Head-to-head compare tool
│   └── api/               # Route handlers: live data, SSE relay, news, revalidation
├── components/
│   ├── charts/            # Recharts visualizations (position, lap times, tyre strategy)
│   ├── home/              # Landing page sections (hero, countdown, calendar, news)
│   ├── layout/            # Navbar, footer, page transitions
│   ├── live/              # Live timing UI (replay banner and more)
│   ├── shared/            # Reusable UI (badges, cards, headers, session schedule)
│   └── ui/                # Base UI primitives (shadcn/ui)
├── hooks/                 # Live session polling and live-stream SSE hooks
└── lib/
    ├── api/               # API clients (Jolpica, OpenF1, news)
    └── constants/         # Season data (circuits, drivers, teams, schedules)
```

## Data Sources

| Source | Usage |
|--------|-------|
| [Jolpica-F1 API](https://github.com/jolpica/jolpica-f1) | Historical data: standings, race results, qualifying, lap times |
| [OpenF1 API](https://openf1.org) | Session data: positions, intervals, tyres, telemetry, weather |
| F1 live timing | Real-time timing during sessions, relayed as Server-Sent Events |
| RSS feeds | Aggregated F1 news from major motorsport outlets |

All data sources are free and require no authentication. Responses are cached with Next.js ISR (Incremental Static Regeneration) using per-route revalidation intervals.

## Deployment

Deploy your own instance with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shvmmshr/f1lytics)

## Contributing

Contributions are welcome. Here is how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  If you found this useful, consider supporting the project!
  <br /><br />
  <a href="https://github.com/sponsors/shvmmshr">
    <img src="https://img.shields.io/badge/Sponsor-GitHub-%23ea4aaa?logo=github-sponsors" alt="GitHub Sponsors" />
  </a>
  &nbsp;
  <a href="https://buymeacoffee.com/shvmmshra">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee" />
  </a>
  &nbsp;
  <a href="https://github.com/shvmmshr/f1lytics">
    <img src="https://img.shields.io/github/stars/shvmmshr/f1lytics?style=social" alt="GitHub stars" />
  </a>
</p>
