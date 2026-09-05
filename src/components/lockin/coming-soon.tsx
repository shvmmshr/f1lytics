import Link from "next/link";
import { F1, Mono, Brackets } from "@/components/shared/broadcast";

/** Rendered on every Lock In route while the feature flag is off. */
export function ComingSoon() {
  return (
    <div style={{ padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)" }}>
      <div
        className="relative mx-auto max-w-2xl"
        style={{ background: F1.bg2, border: `1px solid ${F1.line}`, padding: "clamp(28px, 6vw, 48px)", textAlign: "center" }}
      >
        <Brackets color={F1.red} size={14} weight={2} />
        <Mono style={{ fontSize: 11, color: F1.red, letterSpacing: "0.24em", fontWeight: 700 }}>LOCK IN</Mono>
        <h1
          className="font-display uppercase"
          style={{ fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.03em", margin: "14px 0 0" }}
        >
          Formation lap<span style={{ color: F1.red }}>.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md" style={{ color: F1.fg2, fontSize: 15, lineHeight: 1.6 }}>
          Call pole, the podium and the fastest lap before every race weekend, then see who called it. Opening shortly.
        </p>
        <Link
          href="/"
          className="font-mono mt-7 inline-block"
          style={{ fontSize: 11, letterSpacing: "0.18em", color: F1.fg2, textDecoration: "none" }}
        >
          BACK TO F1LYTICS
        </Link>
      </div>
    </div>
  );
}
