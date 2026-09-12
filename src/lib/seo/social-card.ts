import { CIRCUIT_LIST } from "@/lib/constants/circuits";
import { DRIVER_LIST } from "@/lib/constants/drivers";
import { TEAM_LIST, TEAMS } from "@/lib/constants/teams";
import { GARAGE_LEGENDS, getGarageLegend } from "@/lib/garage/legends";
import { ROOT_DESCRIPTION, ROOT_TITLE } from "./metadata";

export interface SocialCardInput { path?: string | null; title?: string | null; description?: string | null; eyebrow?: string | null }
export interface SocialCardModel { title: string; description: string; eyebrow: string; accent: string; path: string; stats: readonly { label: string; value: string }[] }

/** Bound public inputs to the glyphs bundled with the card; no remote font requests. */
export function cleanSocialText(value: string | null | undefined, max: number): string {
  const text = (value ?? "").normalize("NFC").replace(/[^\x20-\x7E\u00A0-\u024F\u2013\u2014\u2019\u00B7]/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
}

/** Public metadata only. Never fetch classifications or telemetry to draw a preview. */
export function socialCardModel(input: SocialCardInput = {}): SocialCardModel {
  const rawPath = input.path?.startsWith("/") && !input.path.startsWith("//") && !/[\\\x00-\x1F]/.test(input.path) ? input.path : "/";
  const url = new URL(rawPath, "https://f1lytics.com");
  const path = url.pathname;
  const activeRaces = CIRCUIT_LIST.filter(c => !c.cancelled);
  const card: SocialCardModel = {
    path: cleanSocialText(path, 56), title: cleanSocialText(input.title, 112) || ROOT_TITLE,
    description: cleanSocialText(input.description, 220) || ROOT_DESCRIPTION,
    eyebrow: cleanSocialText(input.eyebrow, 60) || "2026 FORMULA 1",
    accent: "#FF1801",
    stats: [{ label: "RACES", value: String(activeRaces.length) }, { label: "DRIVERS", value: String(DRIVER_LIST.length) }, { label: "TEAMS", value: String(TEAM_LIST.length) }],
  };

  const [, area, slug] = path.split("/");
  if (area === "drivers" && slug) {
    const driver = DRIVER_LIST.find(d => d.slug === slug);
    const team = driver ? TEAMS[driver.teamId] : undefined;
    if (driver && team) {
      card.accent = team.color;
      card.stats = [{ label: "CAR NUMBER", value: `#${driver.number}` }, { label: "TEAM", value: team.name }, { label: "SEASON", value: "2026" }];
    }
  } else if (area === "teams" && slug) {
    const team = TEAM_LIST.find(t => t.slug === slug);
    if (team) {
      card.accent = team.color;
      card.stats = [{ label: "ENGINE", value: team.engine }, { label: "DRIVERS", value: String(team.drivers.length) }, { label: "SEASON", value: "2026" }];
    }
  } else if ((area === "races" || area === "circuits") && slug) {
    const circuit = CIRCUIT_LIST.find(c => c.slug === slug);
    if (circuit) {
      const date = new Date(`${circuit.raceDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).toUpperCase();
      card.stats = [{ label: "ROUND", value: String(circuit.round).padStart(2, "0") }, { label: circuit.cancelled ? "ORIGINAL DATE" : "RACE DATE", value: `${date} 2026` }, { label: "WEEKEND", value: circuit.cancelled ? "CANCELLED" : circuit.isSprint ? "SPRINT" : "GRAND PRIX" }];
    }
  } else if (area === "garage") {
    if (url.searchParams.has("car")) {
      const car = getGarageLegend(url.searchParams.get("car"));
      card.title = `${car.team} ${car.name}`;
      card.eyebrow = `${car.year} · ${car.driver} · THE GARAGE`;
      card.description = car.story;
      card.accent = car.accent;
      card.stats = car.stats;
    } else {
      const years = GARAGE_LEGENDS.map(c => Number(c.year));
      card.stats = [{ label: "LEGENDARY CARS", value: String(GARAGE_LEGENDS.length) }, { label: "WORLD CHAMPIONS", value: String(new Set(GARAGE_LEGENDS.map(c => c.driver)).size) }, { label: "THE COLLECTION", value: `${Math.min(...years)}–${Math.max(...years)}` }];
    }
  } else if (area === "calendar" || area === "races") {
    card.stats = [{ label: "SCHEDULED SLOTS", value: String(CIRCUIT_LIST.length) }, { label: "ACTIVE RACES", value: String(activeRaces.length) }, { label: "SPRINT WEEKENDS", value: String(activeRaces.filter(c => c.isSprint).length) }];
  } else if (area === "live") {
    card.stats = [{ label: "FOLLOW", value: "POSITIONS" }, { label: "ANALYSE", value: "LAP TIMES" }, { label: "REVISIT", value: "SESSIONS" }];
  }
  return { ...card, title: cleanSocialText(card.title, 112), description: cleanSocialText(card.description, 220), eyebrow: cleanSocialText(card.eyebrow, 60) };
}
