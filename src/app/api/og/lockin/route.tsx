import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { env } from "@/lib/env";
import { labelForDriverId } from "@/lib/lockin/board-data";
import { getShare } from "@/lib/lockin/queries";
import { getRoundByDate } from "@/lib/lockin/rounds";
import type { Stamp } from "@/lib/lockin/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INK = "#08080A";
const BG2 = "#141418";
const LINE = "#27272A";
const FG = "#F4F4F5";
const FG3 = "#84848F";
const RED = "#FF1801";
const STAMP_BG: Record<Stamp, string> = { hit: "#22C55E", close: "#F5A623", miss: "#C20012", pending: "#26262E" };
const STAMP_TEXT: Record<Stamp, string> = { hit: "CALLED IT", close: "CLOSE", miss: "COOKED", pending: "PENDING" };

function loadFont(file: string) {
  return readFile(fileURLToPath(new URL(`../../../_fonts/${file}`, import.meta.url)));
}

/** Share card for one player's round. Cached briefly; results change once. */
export async function GET(request: Request) {
  const shareId = new URL(request.url).searchParams.get("share") ?? "";
  const [antonio, mono] = await Promise.all([loadFont("Antonio-Bold.ttf"), loadFont("JetBrainsMono-Medium.ttf")]);
  const share = env.lockInEnabled && shareId ? await getShare(shareId).catch(() => null) : null;
  const round = share ? getRoundByDate(share.raceDate) : undefined;

  const calls = share && round
    ? ([
        ["POLE", share.picks.pole, share.score?.breakdown.pole.stamp ?? null],
        ["P1", share.picks.p1, share.score?.breakdown.p1.stamp ?? null],
        ["P2", share.picks.p2, share.score?.breakdown.p2.stamp ?? null],
        ["P3", share.picks.p3, share.score?.breakdown.p3.stamp ?? null],
        ["FL", share.picks.fastestLap, share.score?.breakdown.fastestLap.stamp ?? null],
        ...(round.isSprint && share.picks.sprintWinner ? [["SPR", share.picks.sprintWinner, share.score?.breakdown.sprintWinner?.stamp ?? null] as const] : []),
      ] as [string, string, Stamp | null][])
    : [];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: FG, padding: "52px 64px", borderTop: `10px solid ${RED}`, fontFamily: "Mono" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 8, background: RED, display: "flex" }} />
            <div style={{ fontSize: 22, letterSpacing: "0.22em", display: "flex" }}>LOCK IN</div>
          </div>
          <div style={{ fontSize: 18, color: FG3, letterSpacing: "0.16em", display: "flex" }}>F1LYTICS.COM</div>
        </div>
        {share && round ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
              <div style={{ fontSize: 20, color: FG3, letterSpacing: "0.18em", display: "flex" }}>{`ROUND ${String(round.round).padStart(2, "0")} · ${share.displayName.toUpperCase()}`}</div>
              <div style={{ fontFamily: "Antonio", fontSize: 72, lineHeight: 0.95, letterSpacing: "-0.02em", display: "flex", marginTop: 8 }}>{round.fullName.toUpperCase()}</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
              {calls.map(([label, id, stamp]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, background: BG2, border: `1px solid ${LINE}`, padding: "16px 18px", position: "relative" }}>
                  <div style={{ fontSize: 16, color: FG3, letterSpacing: "0.2em", display: "flex" }}>{label}</div>
                  <div style={{ fontFamily: "Antonio", fontSize: 56, lineHeight: 1, display: "flex", marginTop: 6 }}>{labelForDriverId(id)}</div>
                  {stamp && stamp !== "pending" && (
                    <div style={{ display: "flex", marginTop: 12, background: STAMP_BG[stamp], color: stamp === "miss" ? FG : INK, fontSize: 13, letterSpacing: "0.16em", padding: "5px 8px", transform: "rotate(-2deg)", alignSelf: "flex-start" }}>
                      {STAMP_TEXT[stamp]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 16, color: FG3, letterSpacing: "0.2em", display: "flex" }}>{share.score ? "POINTS" : "STATUS"}</div>
                <div style={{ fontFamily: "Antonio", fontSize: share.score ? 84 : 40, lineHeight: 0.95, display: "flex" }}>
                  {share.score ? String(share.score.points) : share.result.raceSettled ? "SETTLED" : "LOCKED IN"}
                </div>
              </div>
              {share.score?.rank && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ fontSize: 16, color: FG3, letterSpacing: "0.2em", display: "flex" }}>ROUND RANK</div>
                  <div style={{ fontFamily: "Antonio", fontSize: 56, lineHeight: 1, display: "flex" }}>{`${share.score.rank}${share.score.players ? ` / ${share.score.players}` : ""}`}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 60 }}>
            <div style={{ fontFamily: "Antonio", fontSize: 96, lineHeight: 0.95, display: "flex" }}>CALL THE PODIUM.</div>
            <div style={{ fontSize: 24, color: FG3, marginTop: 24, display: "flex" }}>Pole, podium, fastest lap and the margin. Locked before qualifying.</div>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Antonio", data: antonio, weight: 700, style: "normal" },
        { name: "Mono", data: mono, weight: 500, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
