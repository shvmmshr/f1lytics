<p align="center">
  <h1 align="center">F1LYTICS</h1>
  <p align="center">
    A modern Formula 1 dashboard for the 2026 season — live timing, standings, driver analytics, and more.
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

- **Live Timing** — Real-time session data with position tracking, intervals, and gap analysis powered by OpenF1
- **Driver Standings** — Full championship standings with points breakdown and position history charts
- **Constructor Standings** — Team rankings with driver contribution breakdowns
- **Race Results** — Detailed results for every Grand Prix including lap charts, tire strategies, and fastest laps
- **Driver Profiles** — Career stats, recent form, and season performance for all 22 drivers
- **Team Profiles** — Constructor details with driver lineups and historical performance
- **Circuit Guide** — All 24 circuits with track maps, lap records, and key stats
- **Race Calendar** — Interactive timeline of the full 2026 season with countdown to next event (sprint-aware)
- **Head-to-Head Compare** — Compare any two drivers across stats, qualifying pace, points progression, and recent form
- **Responsive Design** — Fully optimized for desktop and mobile with smooth GSAP scroll animations

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, ISR) |
| Language | [TypeScript 5](https://typescriptlang.org) (strict mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Animations | [GSAP 3](https://gsap.com) + ScrollTrigger, [Framer Motion](https://motion.dev) |
| Charts | [Recharts 3](https://recharts.org) |
| 3D | [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs) |
| Data | [Jolpica-F1 API](https://github.com/jolpica/jolpica-f1), [OpenF1 API](https://openf1.org) |
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

No environment variables are required — all data comes from public APIs.

## Project Structure

```
src/
├── app/
│   ├── (marketing)/       # Landing page
│   ├── (season)/          # Standings, calendar, drivers, teams, circuits, races
│   ├── (live)/            # Live timing page
│   ├── (tools)/           # Head-to-head compare tool
│   └── api/               # API routes (live data proxy, revalidation)
├── components/
│   ├── charts/            # Recharts visualizations (position, lap times, tire strategy)
│   ├── home/              # Landing page sections (hero, countdown, features)
│   ├── layout/            # Navbar, footer, page transitions
│   ├── shared/            # Reusable UI (badges, cards, headers)
│   ├── three/             # Three.js 3D components
│   └── ui/                # Base UI primitives (shadcn/ui)
├── hooks/                 # Custom hooks (live session polling)
└── lib/
    ├── api/               # API clients (Jolpica, OpenF1)
    └── constants/         # Season data (circuits, drivers, teams)
```

## Data Sources

| Source | Usage |
|--------|-------|
| [Jolpica-F1 API](https://github.com/jolpica/jolpica-f1) | Historical data — standings, race results, qualifying, lap times |
| [OpenF1 API](https://openf1.org) | Live session data — real-time positions, intervals, driver telemetry |

Both APIs are free and require no authentication. Data is cached using Next.js ISR (Incremental Static Regeneration) with configurable revalidation intervals.

## Deployment

Deploy your own instance with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shvmmshr/f1lytics)

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  If you found this useful, consider giving it a star!
  <br />
  <a href="https://github.com/shvmmshr/f1lytics">
    <img src="https://img.shields.io/github/stars/shvmmshr/f1lytics?style=social" alt="GitHub stars" />
  </a>
</p>
