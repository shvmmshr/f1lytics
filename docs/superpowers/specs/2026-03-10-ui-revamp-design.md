# GridLock UI Revamp — F1 Broadcast Style

**Date:** 2026-03-10
**Status:** Approved
**Approach:** GSAP-First with Lightweight 3D (Approach A)

## Overview

Full visual revamp of GridLock F1 2026 Dashboard. Replace the design token showcase home page with a cinematic landing experience. Redesign navbar, overhaul all season pages with GSAP scroll animations and F1 broadcast-inspired aesthetics. 3D F1 car (React Three Fiber) as hero centerpiece with small accents elsewhere.

## Scope

- Home page (new cinematic landing)
- Navbar (glassmorphism redesign)
- Season pages: Calendar, Drivers, Teams, Circuits, Standings
- Global enhancements (transitions, loading states, scroll progress)
- Detail pages (`[slug]`) get basic styling only

## Visual Direction

**Style:** F1 TV broadcast graphics — glowing neon accents, smooth camera sweeps, telemetry-inspired animations, data-driven aesthetics.

**Animation Stack:**
- GSAP + ScrollTrigger: Primary animation engine for scroll reveals, number tickers, text animations, stagger effects
- React Three Fiber + Drei: 3D car model on hero, accent models on detail pages
- Framer Motion: Page transitions (enhanced), component mount/unmount animations

## Home Page Hero

### Car Entrance Animation (GSAP Timeline)
- 3D F1 car drives in from the right, sweeps to center with motion blur
- Brake dust particle burst on arrival
- Speed lines radiate from behind (animated SVG/CSS)
- Heat haze shimmer behind exhaust (CSS filter)

### Title Reveal
- "GRIDLOCK" split-screen wipe reveal — car drives across, text appears in wake
- Red accent light streak traces car path, lingers as glowing trail
- Background: animated racing checkered pattern, pulsing, fading into dark gradient

### CTA
- "Explore Season" / "Live Timing" buttons with glow hover effects
- Optional muted engine rev audio cue on load (toggle in corner)

### Below-the-Fold Scroll Sections
1. **Next Race Countdown** — GSAP number-flip animation, circuit name, race info
2. **Championship Snapshot** — Top 5 drivers/constructors, animated progress bars (fill on scroll)
3. **Season Calendar Strip** — Horizontal scroll of upcoming races, cards animate in from side
4. **Stats Row** — 4 key stats with GSAP counter animations (races, drivers, teams, circuits)

Each section enters with aggressive GSAP animations — momentum + slight overshoot easing.

## Navbar Redesign

- Translucent glassmorphism: dark frosted glass (`backdrop-blur`) with subtle border glow
- GridLock logo with animated red accent line underneath
- Nav links: underline slide animation on hover
- Active page: glowing dot or thin animated bar indicator
- Live indicator (top-right): pulsing red dot when session active (OpenF1 API)
- Mobile: full-screen overlay menu with staggered link animations
- On scroll: navbar background opacity increases for contrast

## Season Pages

### Drivers (`/drivers`)
- Redesigned driver cards: team color gradient border (left edge), large faded driver number in background
- Hover: card lifts with shadow + team color glow, slight scale
- GSAP stagger cascade animation on page load
- Animated section headers

### Teams (`/teams`)
- Team color gradient backgrounds (top-to-bottom fade)
- Driver pairing display with avatar placeholders
- Hover: card expands revealing more stats
- GSAP scroll-triggered entrances

### Calendar (`/calendar`)
- Vertical timeline layout with connector lines
- Race cards alternate left/right (GSAP ScrollTrigger)
- Next race: glowing border + countdown
- Sprint weekends: distinct badge style
- Past races: winner info with checkered flag icon

### Circuits (`/circuits`)
- Polished interactive world map: glowing dots, hover tooltip animations
- Circuit cards with track outline SVGs or clean data cards
- GSAP entrance animations on scroll

### Standings (`/standings`)
- GSAP-powered bar chart fill animations on scroll
- Metallic gradient position badges (gold/silver/bronze)
- Smooth tab switch crossfade
- Championship leader crown/highlight effect

## Global Enhancements

- **Page transitions**: Enhanced Framer Motion — slide/fade with momentum
- **Loading states**: Skeleton screens with shimmer animation
- **Scroll progress**: Thin red progress bar at viewport top
- **Typography**: Tighter heading tracking, larger hero text
- **Color refinements**: Accent glow colors (subtle red/orange glows behind key elements)

## Technical Notes

- 3D car model: Free/low-poly F1 GLTF model or stylized geometric shape with Drei primitives
- GSAP ScrollTrigger for all scroll-based animations
- Keep 3D contained to specific lazy-loaded components (code splitting)
- Maintain existing API integrations and data flow unchanged
- Follow existing Tailwind v4 design token system, extend as needed
- All new components should be clean, well-structured, and follow existing patterns

## Out of Scope

- Detail pages (`[slug]`) full redesign (basic styling only)
- Live session pages
- Tools/analysis pages
- Audio implementation (optional future enhancement)
- Custom cursor (cut for simplicity)
