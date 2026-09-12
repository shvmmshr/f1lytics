import CIRCUIT_REFERENCE from "@/lib/data/circuit-reference.json";
import SESSION_REFERENCE from "@/lib/data/session-reference.json";

export interface Circuit {
  id: string;
  name: string;
  fullName: string;
  country: string;
  countryCode: string;
  city: string;
  length: number;
  turns: number;
  lapRecord: string;
  lapRecordHolder: string;
  /** Race-lap record for the current layout, verified against the circuit guide. */
  lapRecordYear?: number;
  coordinates: { lat: number; lng: number };
  raceDate: string;
  /** Race start time in UTC, e.g. "13:00:00Z" (from Jolpica schedule) */
  raceTime: string;
  /** Qualifying start time in UTC */
  qualifyingTime?: string;
  /** Sprint race date (Saturday), only present for sprint weekends */
  sprintDate?: string;
  /** Sprint race start time in UTC (sprint weekends only) */
  sprintTime?: string;
  round: number;
  isSprint: boolean;
  slug: string;
  trackImage: string;
  /** Whether this race has been cancelled for the season */
  cancelled?: boolean;
}

export const CIRCUITS: Record<string, Circuit> = {
  albert_park: {
    ...CIRCUIT_REFERENCE.albert_park,
    id: "albert_park",
    name: "Albert Park",
    fullName: "Australian Grand Prix",
    country: "Australia",
    countryCode: "AU",
    city: "Melbourne",
    coordinates: { lat: -37.8497, lng: 144.968 },
    raceDate: "2026-03-08",
    raceTime: "04:00:00Z",
    qualifyingTime: "05:00:00Z",
    round: 1,
    isSprint: false,
    slug: "australian-gp",

  },
  shanghai: {
    ...CIRCUIT_REFERENCE.shanghai,
    id: "shanghai",
    name: "Shanghai International Circuit",
    fullName: "Chinese Grand Prix",
    country: "China",
    countryCode: "CN",
    city: "Shanghai",
    coordinates: { lat: 31.3389, lng: 121.2198 },
    raceDate: "2026-03-15",
    raceTime: "07:00:00Z",
    qualifyingTime: "07:00:00Z",
    sprintDate: "2026-03-14",
    sprintTime: "03:00:00Z",
    round: 2,
    isSprint: true,
    slug: "chinese-gp",

  },
  suzuka: {
    ...CIRCUIT_REFERENCE.suzuka,
    id: "suzuka",
    name: "Suzuka International Racing Course",
    fullName: "Japanese Grand Prix",
    country: "Japan",
    countryCode: "JP",
    city: "Suzuka",
    coordinates: { lat: 34.8431, lng: 136.5407 },
    raceDate: "2026-03-29",
    raceTime: "05:00:00Z",
    qualifyingTime: "06:00:00Z",
    round: 3,
    isSprint: false,
    slug: "japanese-gp",

  },
  bahrain: {
    ...CIRCUIT_REFERENCE.bahrain,
    id: "bahrain",
    name: "Bahrain International Circuit",
    fullName: "Bahrain Grand Prix",
    country: "Bahrain",
    countryCode: "BH",
    city: "Sakhir",
    coordinates: { lat: 26.0325, lng: 50.5106 },
    raceDate: "2026-04-12",
    raceTime: "14:00:00Z",
    round: 4,
    isSprint: false,
    slug: "bahrain-gp",
    cancelled: true,
  },
  jeddah: {
    ...CIRCUIT_REFERENCE.jeddah,
    id: "jeddah",
    name: "Jeddah Corniche Circuit",
    fullName: "Saudi Arabian Grand Prix",
    country: "Saudi Arabia",
    countryCode: "SA",
    city: "Jeddah",
    coordinates: { lat: 21.6319, lng: 39.1044 },
    raceDate: "2026-04-19",
    raceTime: "14:00:00Z",
    round: 5,
    isSprint: false,
    slug: "saudi-arabian-gp",
    cancelled: true,
  },
  miami: {
    ...CIRCUIT_REFERENCE.miami,
    id: "miami",
    name: "Miami International Autodrome",
    fullName: "Miami Grand Prix",
    country: "United States",
    countryCode: "US",
    city: "Miami",
    coordinates: { lat: 25.9581, lng: -80.2389 },
    raceDate: "2026-05-03",
    raceTime: "20:00:00Z",
    qualifyingTime: "20:00:00Z",
    sprintDate: "2026-05-02",
    sprintTime: "16:00:00Z",
    round: 6,
    isSprint: true,
    slug: "miami-gp",

  },
  montreal: {
    ...CIRCUIT_REFERENCE.montreal,
    id: "montreal",
    name: "Circuit Gilles Villeneuve",
    fullName: "Canadian Grand Prix",
    country: "Canada",
    countryCode: "CA",
    city: "Montreal",
    coordinates: { lat: 45.5017, lng: -73.5228 },
    raceDate: "2026-05-24",
    raceTime: "20:00:00Z",
    qualifyingTime: "20:00:00Z",
    sprintDate: "2026-05-23",
    sprintTime: "16:00:00Z",
    round: 7,
    isSprint: true,
    slug: "canadian-gp",

  },
  monaco: {
    ...CIRCUIT_REFERENCE.monaco,
    id: "monaco",
    name: "Circuit de Monaco",
    fullName: "Monaco Grand Prix",
    country: "Monaco",
    countryCode: "MC",
    city: "Monte Carlo",
    coordinates: { lat: 43.7347, lng: 7.4206 },
    raceDate: "2026-06-07",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 8,
    isSprint: false,
    slug: "monaco-gp",

  },
  barcelona: {
    ...CIRCUIT_REFERENCE.barcelona,
    id: "barcelona",
    name: "Circuit de Barcelona-Catalunya",
    fullName: "Barcelona Grand Prix",
    country: "Spain",
    countryCode: "ES",
    city: "Barcelona",
    coordinates: { lat: 41.57, lng: 2.2611 },
    raceDate: "2026-06-14",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 9,
    isSprint: false,
    slug: "spanish-gp",

  },
  spielberg: {
    ...CIRCUIT_REFERENCE.spielberg,
    id: "spielberg",
    name: "Red Bull Ring",
    fullName: "Austrian Grand Prix",
    country: "Austria",
    countryCode: "AT",
    city: "Spielberg",
    coordinates: { lat: 47.2197, lng: 14.7647 },
    raceDate: "2026-06-28",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 10,
    isSprint: false,
    slug: "austrian-gp",

  },
  silverstone: {
    ...CIRCUIT_REFERENCE.silverstone,
    id: "silverstone",
    name: "Silverstone Circuit",
    fullName: "British Grand Prix",
    country: "United Kingdom",
    countryCode: "GB",
    city: "Silverstone",
    coordinates: { lat: 52.0786, lng: -1.0169 },
    raceDate: "2026-07-05",
    raceTime: "14:00:00Z",
    qualifyingTime: "15:00:00Z",
    sprintDate: "2026-07-04",
    sprintTime: "11:00:00Z",
    round: 11,
    isSprint: true,
    slug: "british-gp",

  },
  spa: {
    ...CIRCUIT_REFERENCE.spa,
    id: "spa",
    name: "Circuit de Spa-Francorchamps",
    fullName: "Belgian Grand Prix",
    country: "Belgium",
    countryCode: "BE",
    city: "Stavelot",
    coordinates: { lat: 50.4372, lng: 5.9714 },
    raceDate: "2026-07-19",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 12,
    isSprint: false,
    slug: "belgian-gp",

  },
  budapest: {
    ...CIRCUIT_REFERENCE.budapest,
    id: "budapest",
    name: "Hungaroring",
    fullName: "Hungarian Grand Prix",
    country: "Hungary",
    countryCode: "HU",
    city: "Budapest",
    coordinates: { lat: 47.5789, lng: 19.2486 },
    raceDate: "2026-07-26",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 13,
    isSprint: false,
    slug: "hungarian-gp",

  },
  zandvoort: {
    ...CIRCUIT_REFERENCE.zandvoort,
    id: "zandvoort",
    name: "Circuit Zandvoort",
    fullName: "Dutch Grand Prix",
    country: "Netherlands",
    countryCode: "NL",
    city: "Zandvoort",
    coordinates: { lat: 52.3888, lng: 4.5409 },
    raceDate: "2026-08-23",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    sprintDate: "2026-08-22",
    sprintTime: "10:00:00Z",
    round: 14,
    isSprint: true,
    slug: "dutch-gp",

  },
  monza: {
    ...CIRCUIT_REFERENCE.monza,
    id: "monza",
    name: "Autodromo Nazionale Monza",
    fullName: "Italian Grand Prix",
    country: "Italy",
    countryCode: "IT",
    city: "Monza",
    coordinates: { lat: 45.6156, lng: 9.2811 },
    raceDate: "2026-09-06",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 15,
    isSprint: false,
    slug: "italian-gp",

  },
  madrid: {
    ...CIRCUIT_REFERENCE.madrid,
    id: "madrid",
    name: "Madring",
    fullName: "Spanish Grand Prix",
    country: "Spain",
    countryCode: "ES",
    city: "Madrid",
    coordinates: { lat: 40.4168, lng: -3.7038 },
    raceDate: "2026-09-13",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 16,
    isSprint: false,
    slug: "madrid-gp",

  },
  baku: {
    ...CIRCUIT_REFERENCE.baku,
    id: "baku",
    name: "Baku City Circuit",
    fullName: "Azerbaijan Grand Prix",
    country: "Azerbaijan",
    countryCode: "AZ",
    city: "Baku",
    coordinates: { lat: 40.3725, lng: 49.8533 },
    raceDate: "2026-09-26",
    raceTime: "11:00:00Z",
    qualifyingTime: "12:00:00Z",
    round: 17,
    isSprint: false,
    slug: "azerbaijan-gp",

  },
  sepang: {
    ...CIRCUIT_REFERENCE.sepang,
    id: "sepang",
    name: "Sepang International Circuit",
    fullName: "Bahrain Grand Prix in Malaysia",
    country: "Malaysia",
    countryCode: "MY",
    city: "Kuala Lumpur",
    coordinates: { lat: 2.76083, lng: 101.738 },
    raceDate: "2026-10-04",
    raceTime: "07:00:00Z",
    qualifyingTime: "08:00:00Z",
    round: 18,
    isSprint: false,
    slug: "bahrain-gp-malaysia",

  },
  singapore: {
    ...CIRCUIT_REFERENCE.singapore,
    id: "singapore",
    name: "Marina Bay Street Circuit",
    fullName: "Singapore Grand Prix",
    country: "Singapore",
    countryCode: "SG",
    city: "Singapore",
    coordinates: { lat: 1.2914, lng: 103.8636 },
    raceDate: "2026-10-11",
    raceTime: "12:00:00Z",
    qualifyingTime: "13:00:00Z",
    sprintDate: "2026-10-10",
    sprintTime: "09:00:00Z",
    round: 19,
    isSprint: true,
    slug: "singapore-gp",

  },
  austin: {
    ...CIRCUIT_REFERENCE.austin,
    id: "austin",
    name: "Circuit of the Americas",
    fullName: "United States Grand Prix",
    country: "United States",
    countryCode: "US",
    city: "Austin",
    coordinates: { lat: 30.1328, lng: -97.6411 },
    raceDate: "2026-10-25",
    raceTime: "20:00:00Z",
    qualifyingTime: "21:00:00Z",
    round: 20,
    isSprint: false,
    slug: "us-gp",

  },
  mexico_city: {
    ...CIRCUIT_REFERENCE.mexico_city,
    id: "mexico_city",
    name: "Autodromo Hermanos Rodriguez",
    fullName: "Mexico City Grand Prix",
    country: "Mexico",
    countryCode: "MX",
    city: "Mexico City",
    coordinates: { lat: 19.4042, lng: -99.0907 },
    raceDate: "2026-11-01",
    raceTime: "20:00:00Z",
    qualifyingTime: "21:00:00Z",
    round: 21,
    isSprint: false,
    slug: "mexico-city-gp",

  },
  interlagos: {
    ...CIRCUIT_REFERENCE.interlagos,
    id: "interlagos",
    name: "Autodromo Jose Carlos Pace",
    fullName: "Sao Paulo Grand Prix",
    country: "Brazil",
    countryCode: "BR",
    city: "Sao Paulo",
    coordinates: { lat: -23.7036, lng: -46.6997 },
    raceDate: "2026-11-08",
    raceTime: "17:00:00Z",
    qualifyingTime: "18:00:00Z",
    round: 22,
    isSprint: false,
    slug: "sao-paulo-gp",

  },
  las_vegas: {
    ...CIRCUIT_REFERENCE.las_vegas,
    id: "las_vegas",
    name: "Las Vegas Strip Circuit",
    fullName: "Las Vegas Grand Prix",
    country: "United States",
    countryCode: "US",
    city: "Las Vegas",
    coordinates: { lat: 36.1147, lng: -115.1728 },
    raceDate: "2026-11-22",
    raceTime: "04:00:00Z",
    qualifyingTime: "04:00:00Z",
    round: 23,
    isSprint: false,
    slug: "las-vegas-gp",

  },
  lusail: {
    ...CIRCUIT_REFERENCE.lusail,
    id: "lusail",
    name: "Lusail International Circuit",
    fullName: "Qatar Grand Prix",
    country: "Qatar",
    countryCode: "QA",
    city: "Lusail",
    coordinates: { lat: 25.49, lng: 51.4542 },
    raceDate: "2026-11-29",
    raceTime: "16:00:00Z",
    qualifyingTime: "18:00:00Z",
    round: 24,
    isSprint: false,
    slug: "qatar-gp",

  },
  yas_marina: {
    ...CIRCUIT_REFERENCE.yas_marina,
    id: "yas_marina",
    name: "Yas Marina Circuit",
    fullName: "Abu Dhabi Grand Prix",
    country: "United Arab Emirates",
    countryCode: "AE",
    city: "Abu Dhabi",
    coordinates: { lat: 24.4672, lng: 54.6031 },
    raceDate: "2026-12-06",
    raceTime: "13:00:00Z",
    qualifyingTime: "14:00:00Z",
    round: 25,
    isSprint: false,
    slug: "abu-dhabi-gp",

  },
} as const;

// One refreshed timetable feeds every countdown, schedule and locking helper.
// Identity, calendar dates and sprint format remain explicit reviewed metadata.
for (const circuit of Object.values(CIRCUITS)) {
  const schedule = SESSION_REFERENCE[circuit.raceDate as keyof typeof SESSION_REFERENCE];
  if (!schedule || circuit.cancelled) continue;
  circuit.raceTime = schedule.race.slice(11);
  circuit.qualifyingTime = schedule.qualifying?.slice(11);
  if ("sprint" in schedule) {
    circuit.sprintDate = schedule.sprint.slice(0, 10);
    circuit.sprintTime = schedule.sprint.slice(11);
  }
}

export const CIRCUIT_LIST: Circuit[] = Object.values(CIRCUITS).sort(
  (a, b) => a.round - b.round
);

export function getCircuitBySlug(slug: string): Circuit | undefined {
  return CIRCUIT_LIST.find((circuit) => circuit.slug === slug);
}

/**
 * Round number as used by external APIs (Jolpica/Ergast). Cancelled races are
 * removed from the official calendar entirely, so API round numbers shift down
 * by the number of cancelled rounds before this one — e.g. with Bahrain (4) and
 * Saudi Arabia (5) cancelled, our Miami round 6 is Jolpica round 4.
 */
export function getApiRound(circuit: Circuit): number {
  const cancelledBefore = CIRCUIT_LIST.filter(
    (c) => c.cancelled && c.round < circuit.round
  ).length;
  return circuit.round - cancelledBefore;
}

export function getNextRace(currentDate: Date = new Date()): Circuit | undefined {
  const dateStr = currentDate.toISOString().split("T")[0];
  return CIRCUIT_LIST.find((circuit) => !circuit.cancelled && circuit.raceDate >= dateStr);
}

export interface NextEvent {
  circuit: Circuit;
  eventType: "sprint" | "race";
  eventDate: string;
  /** UTC time component for the event, e.g. "13:00:00Z" */
  eventTime: string;
}

/** Fallback UTC start time used only if a circuit somehow lacks one. */
const DEFAULT_EVENT_TIME = "14:00:00Z";

/**
 * Returns the next upcoming event (sprint or race), whichever comes first.
 * On sprint weekends, this will return the sprint on Saturday before the race on Sunday.
 */
export function getNextEvent(currentDate: Date = new Date()): NextEvent | undefined {
  // An event stays "next" until ~2h after its start (covers the running
  // session), then we roll over — datetime-based, not date-based, so a sprint
  // that finished Saturday morning yields to Sunday's race the same day.
  const GRACE_MS = 2 * 60 * 60 * 1000;
  const stillUpcoming = (date: string, time: string) =>
    new Date(`${date}T${time}`).getTime() + GRACE_MS > currentDate.getTime();

  for (const circuit of CIRCUIT_LIST) {
    if (circuit.cancelled) continue;
    // Check sprint first — it happens before the race on sprint weekends
    if (
      circuit.isSprint &&
      circuit.sprintDate &&
      stillUpcoming(circuit.sprintDate, circuit.sprintTime ?? DEFAULT_EVENT_TIME)
    ) {
      return {
        circuit,
        eventType: "sprint",
        eventDate: circuit.sprintDate,
        eventTime: circuit.sprintTime ?? DEFAULT_EVENT_TIME,
      };
    }
    if (stillUpcoming(circuit.raceDate, circuit.raceTime ?? DEFAULT_EVENT_TIME)) {
      return {
        circuit,
        eventType: "race",
        eventDate: circuit.raceDate,
        eventTime: circuit.raceTime ?? DEFAULT_EVENT_TIME,
      };
    }
  }
  return undefined;
}
