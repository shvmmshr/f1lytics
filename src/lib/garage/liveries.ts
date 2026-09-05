import { TEAM_LIST } from "@/lib/constants/teams";

/**
 * Colourways for the garage car. Team entries come from the constants file so
 * they stay in step with the season; era entries are named by colour and year
 * rather than by sponsor or team, which keeps the page free of other people's
 * trademarks while still reading unmistakably to fans.
 */
export interface Livery {
  id: string;
  name: string;
  era: string;
  primary: string;
  secondary: string;
  accent: string;
  /** Wheel rim colour. */
  rim: string;
}

function darken(hex: string, amount: number): string {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export const TEAM_LIVERIES: Livery[] = TEAM_LIST.map((team) => ({
  id: `team-${team.id}`,
  name: team.name,
  era: "2026",
  primary: team.color,
  secondary: darken(team.color, 0.55),
  accent: "#F4F4F5",
  rim: "#1C1C22",
}));

export const ERA_LIVERIES: Livery[] = [
  { id: "era-1978", name: "Black and gold", era: "1978", primary: "#0B0B0D", secondary: "#C9A227", accent: "#C9A227", rim: "#C9A227" },
  { id: "era-1988", name: "Red and white", era: "1988", primary: "#F4F4F5", secondary: "#D7263D", accent: "#D7263D", rim: "#1C1C22" },
  { id: "era-1992", name: "Blue and yellow", era: "1992", primary: "#1B3C8C", secondary: "#F5C400", accent: "#F4F4F5", rim: "#1C1C22" },
  { id: "era-2004", name: "Rosso", era: "2004", primary: "#D40000", secondary: "#8C0000", accent: "#F4F4F5", rim: "#1C1C22" },
  { id: "era-2010", name: "Navy and yellow", era: "2010", primary: "#0D1B4C", secondary: "#F5C400", accent: "#D7263D", rim: "#1C1C22" },
  { id: "era-2019", name: "Silver", era: "2019", primary: "#C8CBD0", secondary: "#101014", accent: "#27F4D2", rim: "#101014" },
  { id: "era-2021", name: "Papaya", era: "2021", primary: "#FF8000", secondary: "#47C7FC", accent: "#0B0B0D", rim: "#1C1C22" },
];

export const LIVERIES: Livery[] = [...TEAM_LIVERIES, ...ERA_LIVERIES];

export function getLivery(id: string | null | undefined): Livery {
  return LIVERIES.find((l) => l.id === id) ?? TEAM_LIVERIES[0];
}
