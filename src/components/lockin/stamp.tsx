import { F1, Mono } from "@/components/shared/broadcast";
import type { Stamp as StampKind } from "@/lib/lockin/scoring";

const STAMP: Record<StampKind, { text: string; color: string; bg: string }> = {
  hit: { text: "CALLED IT", color: F1.ink, bg: F1.green },
  close: { text: "CLOSE", color: F1.ink, bg: F1.amber },
  miss: { text: "COOKED", color: F1.fg, bg: F1.redDeep },
  pending: { text: "PENDING", color: F1.fg3, bg: F1.bg3 },
};

/** Result stamp for one call. Slightly rotated so it reads as applied, not printed. */
export function Stamp({ kind, points, small = false }: { kind: StampKind; points?: number; small?: boolean }) {
  const s = STAMP[kind];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{
        background: s.bg,
        color: s.color,
        padding: small ? "2px 6px" : "4px 8px",
        transform: "rotate(-2deg)",
        border: `1px solid ${kind === "pending" ? F1.line : "transparent"}`,
      }}
    >
      <Mono style={{ fontSize: small ? 9 : 10, fontWeight: 700, letterSpacing: "0.18em" }}>{s.text}</Mono>
      {points !== undefined && kind !== "pending" && (
        <Mono style={{ fontSize: small ? 9 : 10, fontWeight: 700 }}>{points > 0 ? `+${points}` : "0"}</Mono>
      )}
    </span>
  );
}
