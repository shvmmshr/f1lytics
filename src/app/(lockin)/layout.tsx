import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { F1 } from "@/components/shared/broadcast";
import { LockInNav } from "@/components/lockin/lockin-nav";
import { ConsentSync } from "@/components/lockin/consent-sync";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/lockin/profile";

/** Season-style frame plus the Lock In section nav. Every route here is dynamic. */
export default async function LockInLayout({ children }: { children: React.ReactNode }) {
  const user = env.lockInEnabled ? await getCurrentUser().catch(() => null) : null;
  const profile = user ? await getProfile(user.id).catch(() => null) : null;
  return (
    <div className="flex min-h-screen flex-col" style={{ background: F1.ink }}>
      <Navbar />
      <main className="w-full flex-1">
        <div
          className="mx-auto w-full min-h-full"
          style={{ maxWidth: 1480, background: F1.bg, borderLeft: `1px solid ${F1.line}`, borderRight: `1px solid ${F1.line}` }}
        >
          {env.lockInEnabled && <LockInNav signedIn={user !== null} displayName={profile?.displayName ?? null} />}
          <ConsentSync signedIn={user !== null} />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
