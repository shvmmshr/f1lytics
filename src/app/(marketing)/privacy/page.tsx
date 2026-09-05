import Link from "next/link";
import { F1, Mono, Grid as BroadcastGrid, SectionHeader } from "@/components/shared/broadcast";
import { createPageMetadata } from "@/lib/seo/metadata";

const description = "What F1lytics stores when you use Lock In, which services handle it, and how to have it deleted.";

export const metadata = createPageMetadata({
  title: "Privacy",
  description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="relative" style={{ background: F1.bg, color: F1.fg }}>
      <BroadcastGrid color={F1.line} size={64} opacity={0.18} />
      <header className="relative" style={{ padding: "56px clamp(20px, 6vw, 80px) 44px", borderBottom: `1px solid ${F1.line}` }}>
        <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em" }}>PRIVACY</Mono>
        <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(42px, 8vw, 96px)", fontWeight: 700, lineHeight: 0.9 }}>
          Your data<span style={{ color: F1.red }}>.</span>
        </h1>
        <p className="mt-5 max-w-3xl text-lg" style={{ color: F1.fg2 }}>
          Browsing F1lytics needs no account and stores nothing about you beyond standard server logs and anonymous page analytics. Lock In, the predictions game, needs an account. This page says exactly what that means.
        </p>
      </header>
      <div className="relative mx-auto grid max-w-4xl gap-12 px-5 py-12 md:px-10">
        <section>
          <SectionHeader label="WHAT IS STORED" />
          <ul className="grid gap-2" style={{ color: F1.fg2, paddingLeft: 18 }}>
            <li>Your email address, and your name and profile picture if you sign in with Google.</li>
            <li>A display name you can change, shown on leaderboards and share cards.</li>
            <li>Your calls for each round, your scores, and the leagues you belong to.</li>
            <li>Whether you asked for race-weekend emails. The default is off.</li>
            <li>A session cookie that keeps you signed in for up to 90 days, and short-lived rate-limit counters.</li>
          </ul>
        </section>
        <section>
          <SectionHeader label="WHO HANDLES IT" />
          <ul className="grid gap-2" style={{ color: F1.fg2, paddingLeft: 18 }}>
            <li>Neon (Singapore region) hosts the database.</li>
            <li>Vercel hosts the site and runs its server code.</li>
            <li>Google handles Google sign-in; F1lytics never sees your Google password.</li>
            <li>Resend delivers sign-in links and, only if you opted in, race-weekend emails.</li>
          </ul>
          <p className="mt-4" style={{ color: F1.fg2 }}>Nothing is sold or shared with advertisers. There are no ads.</p>
        </section>
        <section>
          <SectionHeader label="DELETION AND CONTACT" />
          <p style={{ color: F1.fg2 }}>
            To delete your account and everything attached to it, open an issue on{" "}
            <a href="https://github.com/shvmmshr/f1lytics/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">GitHub</a>{" "}
            mentioning the email you signed in with, or reply to any email F1lytics sent you. Deletion is done by hand within a few days and is permanent.
          </p>
        </section>
        <div>
          <Link href="/" className="font-mono text-xs tracking-[0.18em] hover:text-white" style={{ color: F1.fg2 }}>
            BACK TO F1LYTICS
          </Link>
        </div>
      </div>
    </main>
  );
}
