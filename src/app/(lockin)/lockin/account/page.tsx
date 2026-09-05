import Link from "next/link";
import { redirect } from "next/navigation";
import { F1, Mono } from "@/components/shared/broadcast";
import { AccountForm } from "@/components/lockin/account-form";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/lockin/profile";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Your Lock In Account",
  description: "Display name, email preferences and sign-out for Lock In.",
  path: "/lockin/account",
  noIndex: true,
});

export default async function AccountPage() {
  if (!env.lockInEnabled) return <ComingSoon />;
  const user = await getCurrentUser();
  if (!user) redirect("/lockin/sign-in?next=%2Flockin%2Faccount");
  const profile = await getProfile(user.id);

  return (
    <div className="mx-auto max-w-2xl" style={{ padding: "clamp(24px, 4vw, 40px) clamp(12px, 3vw, 24px)" }}>
      <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>ACCOUNT</Mono>
      <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 700, lineHeight: 0.92, letterSpacing: "-0.03em", margin: "10px 0 0" }}>
        {profile?.displayName ?? "Player"}
      </h1>
      <p className="mt-2" style={{ color: F1.fg3, fontSize: 13 }}>Signed in as {user.email}</p>
      <div className="mt-6">
        <AccountForm displayName={profile?.displayName ?? ""} newsletterOptIn={profile?.newsletterOptIn ?? false} />
      </div>
      <p className="mt-6" style={{ color: F1.fg3, fontSize: 13, lineHeight: 1.6 }}>
        F1lytics stores your email, display name, calls and league memberships. To delete your account, open an issue on{" "}
        <a href="https://github.com/shvmmshr/f1lytics/issues" target="_blank" rel="noopener noreferrer" style={{ color: F1.fg2, textDecoration: "underline" }}>GitHub</a>{" "}
        from the email you signed in with. Details in the <Link href="/privacy" style={{ color: F1.fg2, textDecoration: "underline" }}>privacy note</Link>.
      </p>
    </div>
  );
}
