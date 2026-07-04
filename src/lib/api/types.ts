// =============================================================================
// Jolpica-F1 API Types (Ergast successor)
// =============================================================================

/** Generic wrapper for all Jolpica API responses */
export interface JolpicaResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & T;
}

/** Circuit location info */
export interface CircuitLocation {
  lat: string;
  long: string;
  locality: string;
  country: string;
}

/** Circuit info returned in race/qualifying data */
export interface Circuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: CircuitLocation;
}

/** Driver info as returned by the Jolpica API */
export interface Driver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

/** Constructor info as returned by the Jolpica API */
export interface Constructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

/** Fastest lap details within a race result */
export interface FastestLap {
  rank: string;
  lap: string;
  Time: {
    time: string;
  };
  AverageSpeed: {
    units: string;
    speed: string;
  };
}

/** Individual result entry for a driver in a race */
export interface ResultItem {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis?: string;
    time: string;
  };
  FastestLap?: FastestLap;
}

/** A race event with optional Results array (populated for race results) */
export interface RaceResult {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  Results?: ResultItem[];
}

/** Race results table from Jolpica response */
export interface RaceTable {
  RaceTable: {
    season: string;
    round?: string;
    Races: RaceResult[];
  };
}

/** Driver standing entry */
export interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
}

/** Driver standings table from Jolpica response */
export interface StandingsTable {
  StandingsTable: {
    season: string;
    StandingsLists: {
      season: string;
      round: string;
      DriverStandings?: DriverStanding[];
      ConstructorStandings?: ConstructorStanding[];
    }[];
  };
}

/** Constructor standing entry */
export interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: Constructor;
}

/** Individual qualifying result for a driver */
export interface QualifyingResultItem {
  number: string;
  position: string;
  Driver: Driver;
  Constructor: Constructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

/** A qualifying event with results */
export interface QualifyingResult {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  QualifyingResults: QualifyingResultItem[];
}

/** Qualifying results table from Jolpica response */
export interface QualifyingTable {
  RaceTable: {
    season: string;
    round: string;
    Races: QualifyingResult[];
  };
}

/** A sprint race event with SprintResults (from the /sprint endpoint).
 *  Rows share the race ResultItem shape (position, points, grid, Time…). */
export interface SprintRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  SprintResults?: ResultItem[];
}

/** Sprint results table from Jolpica response */
export interface SprintTable {
  RaceTable: {
    season: string;
    round?: string;
    Races: SprintRace[];
  };
}

/** Sprint event info (optional on schedule) */
export interface SprintInfo {
  date: string;
  time?: string;
}

/** Race schedule entry */
export interface RaceSchedule {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: SprintInfo;
}

/** Schedule table from Jolpica response */
export interface ScheduleTable {
  RaceTable: {
    season: string;
    Races: RaceSchedule[];
  };
}

// =============================================================================
// OpenF1 API Types
// =============================================================================

/** Session information from OpenF1 */
export interface OpenF1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  session_type: string;
  meeting_key: number;
  location: string;
  country_name: string;
  circuit_short_name: string;
  year: number;
}

/** Position data from OpenF1 */
export interface OpenF1Position {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  position: number;
}

/** Car telemetry data from OpenF1 */
export interface OpenF1CarData {
  driver_number: number;
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  rpm: number;
  gear: number;
  drs: number;
}

/** Lap timing data from OpenF1 */
export interface OpenF1Lap {
  session_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  sector_1_duration: number | null;
  sector_2_duration: number | null;
  sector_3_duration: number | null;
  is_pit_out_lap: boolean;
  date_start: string;
}

/** Tyre stint data from OpenF1 */
export interface OpenF1Stint {
  session_key: number;
  driver_number: number;
  stint_number: number;
  /** Tyre compound — null when OpenF1 hasn't classified the stint */
  compound: string | null;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
}

/** Gap/interval data from OpenF1.
 *  Note: OpenF1 returns a STRING ("+1 LAP" / "+2 LAPS") for lapped cars, not a
 *  number — hence the `string` member. Consumers must handle it (see formatGap). */
export interface OpenF1Interval {
  session_key: number;
  driver_number: number;
  date: string;
  gap_to_leader: number | string | null;
  interval: number | string | null;
}

/** Car location (x/y/z coordinates) from OpenF1 */
export interface OpenF1Location {
  session_key: number;
  driver_number: number;
  date: string;
  x: number;
  y: number;
  z: number;
}

/** Race control messages from OpenF1 */
export interface OpenF1RaceControl {
  session_key: number;
  date: string;
  category: string;
  flag: string | null;
  message: string;
  driver_number: number | null;
  lap_number: number | null;
}

/** Pit stop data from OpenF1 */
export interface OpenF1Pit {
  session_key: number;
  driver_number: number;
  date: string;
  lap_number: number;
  pit_duration: number;
}

/** Team radio recording from OpenF1 */
export interface OpenF1TeamRadio {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  recording_url: string;
}

/** Driver information from OpenF1 */
export interface OpenF1Driver {
  session_key: number;
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  country_code: string;
}

/** Final classification row from OpenF1's session_result endpoint.
 *  `duration` is a single lap time for races, or [Q1, Q2, Q3] for qualifying
 *  (entries null/absent when the driver was eliminated earlier). */
export interface OpenF1SessionResult {
  session_key: number;
  meeting_key: number;
  position: number | null;
  driver_number: number;
  number_of_laps: number | null;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  duration: number | (number | null)[] | null;
  gap_to_leader: number | string | (number | null)[] | null;
}

/** Weather reading from OpenF1 (one row per ~minute during a session) */
export interface OpenF1Weather {
  session_key: number;
  meeting_key: number;
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  wind_direction: number;
  wind_speed: number;
}
