import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/lib/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://f1lytics.com"),
  title: {
    default: "F1lytics — Formula 1 2026 Dashboard",
    template: "%s — F1lytics",
  },
  description:
    "Live standings, race results, driver stats, and real-time timing for the 2026 Formula 1 World Championship.",
  keywords: [
    "Formula 1",
    "F1 2026",
    "F1 standings",
    "F1 live timing",
    "F1 results",
    "F1 calendar",
    "F1 drivers",
    "F1 teams",
    "F1lytics",
  ],
  authors: [{ name: "F1lytics" }],
  creator: "F1lytics",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://f1lytics.com",
    siteName: "F1lytics",
    title: "F1lytics — Formula 1 2026 Dashboard",
    description:
      "Live standings, race results, driver stats, and real-time timing for the 2026 Formula 1 World Championship.",
  },
  twitter: {
    card: "summary_large_image",
    title: "F1lytics — Formula 1 2026 Dashboard",
    description:
      "Live standings, race results, driver stats, and real-time timing for the 2026 F1 season.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "F1lytics",
              url: "https://f1lytics.com",
              description:
                "Formula 1 2026 dashboard with live standings, race results, and driver analytics.",
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
