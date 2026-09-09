import { DRIVER_LIST, TEAM_LIST } from "@/lib/constants";

export interface ComparisonSelection { mode: "drivers" | "teams"; driverA: string; driverB: string; teamA: string; teamB: string }

/** Share links are untrusted input. Resolve only canonical entrant IDs. */
export function parseComparisonSelection(params: Pick<URLSearchParams, "get">): ComparisonSelection {
  const driverA = DRIVER_LIST.find((d) => d.id === params.get("driverA"))?.id ?? DRIVER_LIST[0].id;
  const driverB = DRIVER_LIST.find((d) => d.id === params.get("driverB") && d.id !== driverA)?.id ?? DRIVER_LIST.find((d) => d.id !== driverA)!.id;
  const teamA = TEAM_LIST.find((t) => t.id === params.get("teamA"))?.id ?? TEAM_LIST[0].id;
  const teamB = TEAM_LIST.find((t) => t.id === params.get("teamB") && t.id !== teamA)?.id ?? TEAM_LIST.find((t) => t.id !== teamA)!.id;
  return { mode: params.get("mode") === "teams" ? "teams" : "drivers", driverA, driverB, teamA, teamB };
}
