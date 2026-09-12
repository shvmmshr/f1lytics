import TEAM_REFERENCE from "@/lib/data/team-reference.json";

export interface Team {
  id: string;
  name: string;
  fullName: string;
  color: string;
  engine: string;
  base: string;
  principal: string;
  drivers: [string, string];
  logo: string;
  slug: string;
}

export const TEAMS: Record<string, Team> = {
  mclaren: {
    ...TEAM_REFERENCE.mclaren,
    id: "mclaren",
    name: "McLaren",
    color: "#FF8000",
    drivers: ["norris", "piastri"],
    logo: "/teams/mclaren.webp",
    slug: "mclaren",
  },
  ferrari: {
    ...TEAM_REFERENCE.ferrari,
    id: "ferrari",
    name: "Ferrari",
    color: "#E8002D",
    drivers: ["leclerc", "hamilton"],
    logo: "/teams/ferrari.webp",
    slug: "ferrari",
  },
  red_bull: {
    ...TEAM_REFERENCE.red_bull,
    id: "red_bull",
    name: "Red Bull",
    color: "#3671C6",
    drivers: ["verstappen", "hadjar"],
    logo: "/teams/red-bull.webp",
    slug: "red-bull",
  },
  mercedes: {
    ...TEAM_REFERENCE.mercedes,
    id: "mercedes",
    name: "Mercedes",
    color: "#27F4D2",
    drivers: ["russell", "antonelli"],
    logo: "/teams/mercedes.webp",
    slug: "mercedes",
  },
  aston_martin: {
    ...TEAM_REFERENCE.aston_martin,
    id: "aston_martin",
    name: "Aston Martin",
    color: "#229971",
    drivers: ["alonso", "stroll"],
    logo: "/teams/aston-martin.webp",
    slug: "aston-martin",
  },
  alpine: {
    ...TEAM_REFERENCE.alpine,
    id: "alpine",
    name: "Alpine",
    color: "#FF87BC",
    drivers: ["gasly", "colapinto"],
    logo: "/teams/alpine.webp",
    slug: "alpine",
  },
  williams: {
    ...TEAM_REFERENCE.williams,
    id: "williams",
    name: "Williams",
    color: "#64C4FF",
    drivers: ["albon", "sainz"],
    logo: "/teams/williams.webp",
    slug: "williams",
  },
  racing_bulls: {
    ...TEAM_REFERENCE.racing_bulls,
    id: "racing_bulls",
    name: "Racing Bulls",
    color: "#6692FF",
    drivers: ["lawson", "lindblad"],
    logo: "/teams/racing-bulls.webp",
    slug: "racing-bulls",
  },
  haas: {
    ...TEAM_REFERENCE.haas,
    id: "haas",
    name: "Haas",
    color: "#B6BABD",
    drivers: ["ocon", "bearman"],
    logo: "/teams/haas.webp",
    slug: "haas",
  },
  audi: {
    ...TEAM_REFERENCE.audi,
    id: "audi",
    name: "Audi",
    color: "#FF0000",
    drivers: ["hulkenberg", "bortoleto"],
    logo: "/teams/audi.webp",
    slug: "audi",
  },
  cadillac: {
    ...TEAM_REFERENCE.cadillac,
    id: "cadillac",
    name: "Cadillac",
    color: "#1E3D2F",
    drivers: ["bottas", "perez"],
    logo: "/teams/cadillac.webp",
    slug: "cadillac",
  },
} as const;

export const TEAM_LIST: Team[] = Object.values(TEAMS);

export function getTeamBySlug(slug: string): Team | undefined {
  return TEAM_LIST.find((team) => team.slug === slug);
}
