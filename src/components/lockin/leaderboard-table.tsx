import { F1, Mono, PosPill } from "@/components/shared/broadcast";

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  tier: "free" | "supporter";
  points: number;
  exactHits: number;
  rank: number;
  /** Rounds played (season) or omitted (round). */
  rounds?: number;
}

export function LeaderboardTable({ rows, highlightUserId, emptyText, showRounds = false }: { rows: LeaderboardRow[]; highlightUserId?: string | null; emptyText: string; showRounds?: boolean }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, background: F1.bg2, border: `1px solid ${F1.line}` }}>
        <p style={{ color: F1.fg2, fontSize: 14, margin: 0 }}>{emptyText}</p>
      </div>
    );
  }
  return (
    <div style={{ border: `1px solid ${F1.line}` }}>
      <div className="grid items-center gap-2 px-3 sm:px-4" style={{ gridTemplateColumns: "40px minmax(0,1fr) 64px 64px" + (showRounds ? " 56px" : ""), padding: "10px 0", background: F1.bg2, borderBottom: `1px solid ${F1.line}` }}>
        {["POS", "PLAYER", "PTS", "EXACT", ...(showRounds ? ["RDS"] : [])].map((h, i) => (
          <Mono key={h} style={{ fontSize: 9, color: F1.fg3, letterSpacing: "0.18em", textAlign: i >= 2 ? "right" : "left" }}>
            {h}
          </Mono>
        ))}
      </div>
      {rows.map((r, i) => {
        const me = r.userId === highlightUserId;
        return (
          <div
            key={r.userId}
            className="grid items-center gap-2 px-3 sm:px-4"
            style={{
              gridTemplateColumns: "40px minmax(0,1fr) 64px 64px" + (showRounds ? " 56px" : ""),
              padding: "10px 0",
              background: me ? `${F1.red}14` : i % 2 === 0 ? F1.bg : F1.bg2,
              borderBottom: `1px solid ${F1.line}`,
              borderLeft: me ? `3px solid ${F1.red}` : "3px solid transparent",
            }}
          >
            <PosPill pos={r.rank} size="sm" />
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-display truncate" style={{ fontSize: 16, fontWeight: 600, color: F1.fg }}>
                {r.displayName}
              </span>
              {r.tier === "supporter" && (
                <Mono style={{ fontSize: 8, color: F1.amber, letterSpacing: "0.16em", fontWeight: 700 }}>SUPPORTER</Mono>
              )}
              {me && <Mono style={{ fontSize: 8, color: F1.red, letterSpacing: "0.16em", fontWeight: 700 }}>YOU</Mono>}
            </span>
            <Mono style={{ fontSize: 14, color: F1.fg, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.points}</Mono>
            <Mono style={{ fontSize: 12, color: F1.fg2, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.exactHits}</Mono>
            {showRounds && <Mono style={{ fontSize: 12, color: F1.fg3, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.rounds ?? 0}</Mono>}
          </div>
        );
      })}
    </div>
  );
}
