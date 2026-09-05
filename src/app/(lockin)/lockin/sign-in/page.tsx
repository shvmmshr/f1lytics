import { redirect } from "next/navigation";
import { F1, Mono } from "@/components/shared/broadcast";
import { ComingSoon } from "@/components/lockin/coming-soon";
import { SignInForm } from "@/components/lockin/sign-in-form";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Sign in to Lock In",
  description: "Sign in with Google or a one-time email link to lock in your F1 calls.",
  path: "/lockin/sign-in",
  noIndex: true,
});

/** Only same-site paths are honoured as a return target. */
function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/lockin";
  return value;
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (!env.lockInEnabled) return <ComingSoon />;
  const target = safeNext(next);
  const user = await getCurrentUser();
  if (user) redirect(target);

  return (
    <div className="mx-auto max-w-md" style={{ padding: "clamp(24px, 4vw, 48px) clamp(12px, 3vw, 24px)" }}>
      <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.22em", fontWeight: 700 }}>LOCK IN</Mono>
      <h1 className="font-display mt-3 uppercase" style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 700, lineHeight: 0.92, letterSpacing: "-0.03em", margin: "10px 0 0" }}>
        Sign in<span style={{ color: F1.red }}>.</span>
      </h1>
      <p className="mt-3" style={{ color: F1.fg2, fontSize: 15, lineHeight: 1.6 }}>
        No password. Your calls are kept on this device until you are in.
      </p>
      <div className="mt-6">
        <SignInForm googleEnabled={env.googleEnabled} magicLinkEnabled={env.magicLinkEnabled} next={target} />
      </div>
    </div>
  );
}
