import { TEAMS, TEAM_LIST } from "@/lib/constants";

/**
 * Maps Jolpica/Ergast `constructorId` values to f1lytics internal team IDs.
 *
 * Single source of truth — previously duplicated verbatim across the standings,
 * teams, and team-detail pages (and a separate fragile substring matcher lived in
 * the compare tool). Update team mappings (new teams, renames) here only.
 */
export const CONSTRUCTOR_TO_TEAM: Record<string, string> = {
  mclaren: "mclaren",
  ferrari: "ferrari",
  red_bull: "red_bull",
  mercedes: "mercedes",
  aston_martin: "aston_martin",
  alpine: "alpine",
  williams: "williams",
  rb: "racing_bulls",
  racing_bulls: "racing_bulls",
  haas: "haas",
  sauber: "audi",
  kick_sauber: "audi",
  audi: "audi",
  cadillac: "cadillac",
  andretti: "cadillac",
  andretti_cadillac: "cadillac",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Resolves a Jolpica constructor (`constructorId` + display name) to an f1lytics
 * team ID, or `undefined` if no confident match is found.
 */
export function mapConstructorToTeamId(
  constructorId: string,
  constructorName: string,
): string | undefined {
  const mappedId = CONSTRUCTOR_TO_TEAM[constructorId];
  if (mappedId && TEAMS[mappedId]) return mappedId;

  const normalizedName = normalize(constructorName);

  // Name-based fallbacks for new/renamed 2026 teams whose IDs may vary by source.
  if (normalizedName.includes("racingbulls") || normalizedName === "rb") return "racing_bulls";
  if (normalizedName.includes("sauber")) return "audi";
  if (normalizedName.includes("audi")) return "audi";
  if (normalizedName.includes("redbull")) return "red_bull";
  if (normalizedName.includes("cadillac") || normalizedName.includes("andretti")) return "cadillac";
  if (normalizedName.includes("haas")) return "haas";

  const matchedTeam = TEAM_LIST.find((team) => {
    const teamName = normalize(team.name);
    const teamFullName = normalize(team.fullName);
    return (
      teamName === normalizedName ||
      teamFullName.includes(normalizedName) ||
      normalizedName.includes(teamName)
    );
  });

  return matchedTeam?.id;
}
