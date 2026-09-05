import { DRIVER_LIST } from "@/lib/constants/drivers";
import { TEAMS, TEAM_LIST } from "@/lib/constants/teams";

/** Serializable driver plate for the pick board and cards. */
export interface BoardDriver {
  id: string;
  code: string;
  number: number;
  firstName: string;
  lastName: string;
  teamId: string;
  teamName: string;
  color: string;
}

let cached: BoardDriver[] | null = null;

/** Drivers ordered by team (constructor order), teammates adjacent, so the grid reads like a pit wall. */
export function getBoardDrivers(): BoardDriver[] {
  if (!cached) {
    const teamOrder = new Map(TEAM_LIST.map((t, i) => [t.id, i]));
    cached = [...DRIVER_LIST]
      .sort((a, b) => (teamOrder.get(a.teamId) ?? 99) - (teamOrder.get(b.teamId) ?? 99) || a.number - b.number)
      .map((d) => {
        const team = TEAMS[d.teamId];
        return {
          id: d.id,
          code: d.abbreviation,
          number: d.number,
          firstName: d.firstName,
          lastName: d.lastName,
          teamId: d.teamId,
          teamName: team?.name ?? d.teamId,
          color: team?.color ?? "#84848F",
        };
      });
  }
  return cached;
}

export function driverById(id: string | null | undefined): BoardDriver | null {
  if (!id) return null;
  return getBoardDrivers().find((d) => d.id === id) ?? null;
}

/** "code:XXX" results (unknown driver) render as their code. */
export function labelForDriverId(id: string | null | undefined): string {
  if (!id) return "";
  const d = driverById(id);
  if (d) return d.code;
  return id.startsWith("code:") ? id.slice(5) : id.toUpperCase();
}
