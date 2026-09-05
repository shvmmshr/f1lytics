import { DRIVERS } from "@/lib/constants/drivers";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getPicks } from "./queries";
import { getWeekendRound } from "./rounds";

/** Driver number to the labels of the signed-in player's calls, for the live tower. */
export type Callouts = Record<number, string[]>;

/**
 * Called from the live page (already dynamic). Returns {} unless Lock In is on,
 * a player is signed in, and a round's weekend is in progress. Never throws.
 */
export async function getLiveCallouts(nowMs = Date.now()): Promise<Callouts> {
  if (!env.lockInEnabled) return {};
  try {
    const round = getWeekendRound(nowMs);
    if (!round) return {};
    const user = await getCurrentUser();
    if (!user) return {};
    const picks = await getPicks(user.id, round.raceDate);
    if (!picks) return {};
    const out: Callouts = {};
    const add = (id: string | null, label: string) => {
      if (!id) return;
      const number = DRIVERS[id]?.number;
      if (number === undefined) return;
      (out[number] ??= []).push(label);
    };
    add(picks.pole, "POLE");
    add(picks.p1, "P1");
    add(picks.p2, "P2");
    add(picks.p3, "P3");
    add(picks.fastestLap, "FL");
    if (round.isSprint) add(picks.sprintWinner, "SPR");
    return out;
  } catch (err) {
    console.warn("[f1lytics/lockin] live callouts unavailable:", err);
    return {};
  }
}
