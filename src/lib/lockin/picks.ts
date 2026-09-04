import { z } from "zod";
import { DRIVER_LIST } from "@/lib/constants/drivers";
import type { Picks } from "./scoring";

const driverIds = DRIVER_LIST.map((d) => d.id);
const driverId = z.enum(driverIds as [string, ...string[]]);

export const MARGIN_MAX_MS = 600_000;

/** Wire shape of a picks submission; validated at the API boundary. */
export const picksInputSchema = z
  .object({
    pole: driverId,
    p1: driverId,
    p2: driverId,
    p3: driverId,
    fastestLap: driverId,
    marginMs: z.number().int().min(0).max(MARGIN_MAX_MS),
    sprintWinner: driverId.nullable().default(null),
  })
  .refine((p) => new Set([p.p1, p.p2, p.p3]).size === 3, {
    message: "P1, P2 and P3 must be three different drivers",
    path: ["p3"],
  });

export type PicksInput = z.infer<typeof picksInputSchema>;

export type PicksValidation = { ok: true; picks: Picks } | { ok: false; error: string };

/** Validate a submission for a round: sprint winner only exists on sprint weekends. */
export function validatePicks(input: unknown, round: { isSprint: boolean }): PicksValidation {
  const parsed = picksInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.join(".") || "picks"}: ${issue.message}` : "Invalid picks" };
  }
  const p = parsed.data;
  if (round.isSprint && p.sprintWinner === null) return { ok: false, error: "sprintWinner: pick a sprint winner" };
  return {
    ok: true,
    picks: {
      pole: p.pole,
      p1: p.p1,
      p2: p.p2,
      p3: p.p3,
      fastestLap: p.fastestLap,
      marginMs: p.marginMs,
      sprintWinner: round.isSprint ? p.sprintWinner : null,
    },
  };
}
