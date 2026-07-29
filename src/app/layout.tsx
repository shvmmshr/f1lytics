import type { Metadata } from "next";
import { Antonio, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "@/components/shared/json-ld";
import {
  ROOT_DESCRIPTION,
  ROOT_TITLE,
  SITE_NAME,
  SITE_URL,
  createPageMetadata,
} from "@/lib/seo/metadata";
import { websiteSchema } from "@/lib/seo/schema";
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
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...createPageMetadata({
    title: ROOT_TITLE,
    description: ROOT_DESCRIPTION,
    path: "/",
    absoluteTitle: true,
  }),
  title: {
    default: ROOT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  category: "sports",
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
        <JsonLd data={websiteSchema()} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
