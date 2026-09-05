import Link from "next/link";
import { F1, Mono, Grid as BroadcastGrid, SectionHeader, Brackets } from "@/components/shared/broadcast";
import { createPageMetadata } from "@/lib/seo/metadata";
import { env } from "@/lib/env";

const description = "F1lytics is free, open source and ad-free. If it makes your race weekends better, you can keep it running for the price of a coffee.";

export const metadata = createPageMetadata({
  title: "Support F1lytics",
  description,
  path: "/support",
  imageEyebrow: "KEEP IT RUNNING",
});

const WAYS = [
  {
    name: "GitHub Sponsors",
    href: "https://github.com/sponsors/shvmmshr",
    detail: "Monthly or one-off, through GitHub. The whole site is open source there too.",
    cta: "SPONSOR ON GITHUB",
  },
  {
    name: "Buy Me a Coffee",
    href: "https://www.buymeacoffee.com/shvmmshra",
    detail: "A one-off thank you, no account needed.",
    cta: "BUY A COFFEE",
  },
] as const;

export default function SupportPage() {
  return (
    <main className="relative" style={{ background: F1.bg, color: F1.fg }}>
      <BroadcastGrid color={F1.line} size={64} opacity={0.18} />
      <header className="relative" style={{ padding: "56px clamp(20px, 6vw, 80px) 44px", borderBottom: `1px solid ${F1.line}` }}>
        <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>SUPPORT</Mono>
        <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(42px, 8vw, 96px)", fontWeight: 700, lineHeight: 0.9 }}>
          Keep it running<span style={{ color: F1.red }}>.</span>
        </h1>
        <p className="mt-5 max-w-3xl text-lg" style={{ color: F1.fg2 }}>{description}</p>
      </header>
      <div className="relative mx-auto grid max-w-4xl gap-12 px-5 py-12 md:px-10">
        <section>
          <SectionHeader label="WAYS TO HELP" />
          <div className="grid gap-px md:grid-cols-2" style={{ background: F1.line, border: `1px solid ${F1.line}` }}>
            {WAYS.map((way) => (
              <article key={way.name} className="relative flex flex-col" style={{ background: F1.bg2, padding: 24 }}>
                <Brackets color={F1.red} size={10} />
                <h2 className="font-display text-2xl">{way.name}</h2>
                <p className="mt-2 flex-1" style={{ color: F1.fg2 }}>{way.detail}</p>
                <a
                  href={way.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display mt-5 inline-block self-start"
                  style={{ background: F1.red, color: F1.ink, fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "12px 22px", textDecoration: "none" }}
                >
                  {way.cta}
                </a>
              </article>
            ))}
          </div>
        </section>
        <section>
          <SectionHeader label="WHERE IT GOES" />
          <ul className="grid gap-2" style={{ color: F1.fg2, paddingLeft: 18 }}>
            <li>Hosting and the database behind live timing, results and Lock In.</li>
            <li>Time spent on new features, the next of which is always listed on GitHub.</li>
            <li>Nothing goes to ads or trackers. There are none, and there will not be.</li>
          </ul>
        </section>
        <section>
          <SectionHeader label="FREE WAYS THAT MATTER JUST AS MUCH" />
          <ul className="grid gap-2" style={{ color: F1.fg2, paddingLeft: 18 }}>
            <li>Share {env.lockInEnabled ? "a Lock In card or a race page" : "a race page"} with the people you watch with.</li>
            <li>Star the repository on GitHub and report anything that looks wrong.</li>
            {env.lockInEnabled && (
              <li>Play <Link href="/lockin" className="underline hover:text-white">Lock In</Link> every weekend and bring a league.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
