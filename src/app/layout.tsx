import type { Metadata } from "next";
import { Antonio, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/lib/providers";
import "./globals.css";

// All three families ship Google variable-font builds: omitting `weight`
// loads ONE variable woff2 per family (covering every weight we use) instead
// of four static files each — ~4x fewer font bytes and requests on every page.
const antonio = Antonio({
  variable: "--font-antonio",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Single source of truth for the site-wide SEO copy. Stats-first framing (the
// site is analytics, not a live broadcast), no em dashes, and a description
// kept under ~160 chars so Google shows it whole instead of padding the snippet
// with scraped on-page text.
const SITE_NAME = "F1lytics";
const SITE_URL = "https://f1lytics.com";
const TITLE = "F1lytics · 2026 Formula 1 Stats & Standings";
const DESCRIPTION =
  "Standings, race results, driver and team stats, telemetry, and the full 2026 Formula 1 calendar in one place, plus live timing when sessions are running.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Formula 1",
    "F1 2026",
    "F1 standings",
    "F1 results",
    "F1 race results",
    "F1 driver stats",
    "F1 constructor standings",
    "F1 telemetry",
    "F1 lap times",
    "F1 live timing",
    "F1 calendar",
    "F1 drivers",
    "F1 teams",
    "F1 news",
    "F1lytics",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: {
    // "./" resolves against each page's own path (via metadataBase), giving
    // every route a SELF-referential canonical. A hardcoded "/" here told
    // Google that every page on the site was a duplicate of the homepage.
    canonical: "./",
  },
  category: "sports",
  // No title/description/url inside openGraph/twitter: when these are absent,
  // Next falls back to each page's own title and description, so shared links
  // to a driver/race page get that page's card — not the homepage's.
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${antonio.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              alternateName: "F1 Analytics",
              url: SITE_URL,
              inLanguage: "en",
              description:
                "F1lytics is a 2026 Formula 1 stats site with championship standings, race results, driver and team analytics, telemetry, the full season calendar, and live timing.",
              about: {
                "@type": "SportsOrganization",
                name: "Formula 1",
                sport: "Motorsport",
              },
            }),
          }}
        />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
