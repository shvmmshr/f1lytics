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
    logo: "/teams/mclaren.svg",
    slug: "mclaren",
  },
  ferrari: {
    id: "ferrari",
    name: "Ferrari",
    fullName: "Scuderia Ferrari",
    color: "#E8002D",
    engine: "Ferrari",
    base: "Maranello, Italy",
    principal: "Frederic Vasseur",
    drivers: ["leclerc", "hamilton"],
    logo: "/teams/ferrari.svg",
    slug: "ferrari",
  },
  red_bull: {
    id: "red_bull",
    name: "Red Bull",
    fullName: "Oracle Red Bull Racing",
    color: "#3671C6",
    engine: "Red Bull/Ford",
    base: "Milton Keynes, United Kingdom",
    principal: "Christian Horner",
    drivers: ["verstappen", "hadjar"],
    logo: "/teams/red-bull.svg",
    slug: "red-bull",
  },
  mercedes: {
    id: "mercedes",
    name: "Mercedes",
    fullName: "Mercedes-AMG Petronas Formula One Team",
    color: "#27F4D2",
    engine: "Mercedes",
    base: "Brackley, United Kingdom",
    principal: "Toto Wolff",
    drivers: ["russell", "antonelli"],
    logo: "/teams/mercedes.svg",
    slug: "mercedes",
  },
  aston_martin: {
    id: "aston_martin",
    name: "Aston Martin",
    fullName: "Aston Martin Aramco Formula One Team",
    color: "#229971",
    engine: "Honda",
    base: "Silverstone, United Kingdom",
    principal: "Mike Krack",
    drivers: ["alonso", "stroll"],
    logo: "/teams/aston-martin.svg",
    slug: "aston-martin",
  },
  alpine: {
    id: "alpine",
    name: "Alpine",
    fullName: "BWT Alpine Formula One Team",
    color: "#FF87BC",
    engine: "Renault",
    base: "Enstone, United Kingdom",
    principal: "Oliver Oakes",
    drivers: ["gasly", "colapinto"],
    logo: "/teams/alpine.svg",
    slug: "alpine",
  },
  williams: {
    id: "williams",
    name: "Williams",
    fullName: "Williams Racing",
    color: "#64C4FF",
    engine: "Mercedes",
    base: "Grove, United Kingdom",
    principal: "James Vowles",
    drivers: ["albon", "sainz"],
    logo: "/teams/williams.svg",
    slug: "williams",
  },
  racing_bulls: {
    id: "racing_bulls",
    name: "Racing Bulls",
    fullName: "Visa Cash App Racing Bulls",
    color: "#6692FF",
    engine: "Red Bull",
    base: "Faenza, Italy",
    principal: "Laurent Mekies",
    drivers: ["lawson", "lindblad"],
    logo: "/teams/racing-bulls.svg",
    slug: "racing-bulls",
  },
  haas: {
    id: "haas",
    name: "Haas",
    fullName: "MoneyGram Haas F1 Team",
    color: "#B6BABD",
    engine: "Ferrari",
    base: "Kannapolis, United States",
    principal: "Ayao Komatsu",
    drivers: ["ocon", "bearman"],
    logo: "/teams/haas.svg",
    slug: "haas",
  },
  audi: {
    id: "audi",
    name: "Audi",
    fullName: "Audi Formula One Team",
    color: "#FF0000",
    engine: "Audi",
    base: "Hinwil, Switzerland",
    principal: "Mattia Binotto",
    drivers: ["hulkenberg", "bortoleto"],
    logo: "/teams/audi.svg",
    slug: "audi",
  },
  cadillac: {
    id: "cadillac",
    name: "Cadillac",
    fullName: "Cadillac Formula One Team",
    color: "#1E3D2F",
    engine: "Ferrari",
    base: "United States",
    principal: "TBD",
    drivers: ["bottas", "perez"],
    logo: "/teams/cadillac.svg",
    slug: "cadillac",
  },
} as const;

export const TEAM_LIST: Team[] = Object.values(TEAMS);

export function getTeamBySlug(slug: string): Team | undefined {
  return TEAM_LIST.find((team) => team.slug === slug);
}
