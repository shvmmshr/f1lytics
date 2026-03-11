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
    id: "mclaren",
    name: "McLaren",
    fullName: "McLaren Formula 1 Team",
    color: "#FF8000",
    engine: "Mercedes",
    base: "Woking, United Kingdom",
    principal: "Andrea Stella",
    drivers: ["norris", "piastri"],
    logo: "/teams/mclaren.webp",
    slug: "mclaren",
  },
  ferrari: {
    id: "ferrari",
    name: "Ferrari",
    fullName: "Scuderia Ferrari HP",
    color: "#E8002D",
    engine: "Ferrari",
    base: "Maranello, Italy",
    principal: "Frederic Vasseur",
    drivers: ["leclerc", "hamilton"],
    logo: "/teams/ferrari.webp",
    slug: "ferrari",
  },
  red_bull: {
    id: "red_bull",
    name: "Red Bull",
    fullName: "Oracle Red Bull Racing",
    color: "#3671C6",
    engine: "Red Bull Ford",
    base: "Milton Keynes, United Kingdom",
    principal: "Laurent Mekies",
    drivers: ["verstappen", "hadjar"],
    logo: "/teams/red-bull.webp",
    slug: "red-bull",
  },
  mercedes: {
    id: "mercedes",
    name: "Mercedes",
    fullName: "Mercedes-AMG PETRONAS Formula One Team",
    color: "#27F4D2",
    engine: "Mercedes",
    base: "Brackley, United Kingdom",
    principal: "Toto Wolff",
    drivers: ["russell", "antonelli"],
    logo: "/teams/mercedes.webp",
    slug: "mercedes",
  },
  aston_martin: {
    id: "aston_martin",
    name: "Aston Martin",
    fullName: "Aston Martin Aramco Formula One Team",
    color: "#229971",
    engine: "Honda",
    base: "Silverstone, United Kingdom",
    principal: "Adrian Newey",
    drivers: ["alonso", "stroll"],
    logo: "/teams/aston-martin.webp",
    slug: "aston-martin",
  },
  alpine: {
    id: "alpine",
    name: "Alpine",
    fullName: "BWT Alpine Formula One Team",
    color: "#FF87BC",
    engine: "Mercedes",
    base: "Enstone, United Kingdom",
    principal: "Flavio Briatore",
    drivers: ["gasly", "colapinto"],
    logo: "/teams/alpine.webp",
    slug: "alpine",
  },
  williams: {
    id: "williams",
    name: "Williams",
    fullName: "Atlassian Williams F1 Team",
    color: "#64C4FF",
    engine: "Mercedes",
    base: "Grove, United Kingdom",
    principal: "James Vowles",
    drivers: ["albon", "sainz"],
    logo: "/teams/williams.webp",
    slug: "williams",
  },
  racing_bulls: {
    id: "racing_bulls",
    name: "Racing Bulls",
    fullName: "Visa Cash App Racing Bulls",
    color: "#6692FF",
    engine: "Red Bull Ford",
    base: "Faenza, Italy",
    principal: "Alan Permane",
    drivers: ["lawson", "lindblad"],
    logo: "/teams/racing-bulls.webp",
    slug: "racing-bulls",
  },
  haas: {
    id: "haas",
    name: "Haas",
    fullName: "TGR Haas F1 Team",
    color: "#B6BABD",
    engine: "Ferrari",
    base: "Kannapolis, United States",
    principal: "Ayao Komatsu",
    drivers: ["ocon", "bearman"],
    logo: "/teams/haas.webp",
    slug: "haas",
  },
  audi: {
    id: "audi",
    name: "Audi",
    fullName: "Audi Formula 1 Team",
    color: "#FF0000",
    engine: "Audi",
    base: "Hinwil, Switzerland",
    principal: "Jonathan Wheatley",
    drivers: ["hulkenberg", "bortoleto"],
    logo: "/teams/audi.webp",
    slug: "audi",
  },
  cadillac: {
    id: "cadillac",
    name: "Cadillac",
    fullName: "Cadillac Formula 1 Team",
    color: "#1E3D2F",
    engine: "Ferrari",
    base: "Silverstone, United Kingdom",
    principal: "Graeme Lowdon",
    drivers: ["bottas", "perez"],
    logo: "/teams/cadillac.webp",
    slug: "cadillac",
  },
} as const;

export const TEAM_LIST: Team[] = Object.values(TEAMS);

export function getTeamBySlug(slug: string): Team | undefined {
  return TEAM_LIST.find((team) => team.slug === slug);
}
