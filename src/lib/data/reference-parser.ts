export interface CircuitReference {
  firstGrandPrix: number; raceLaps: number; raceDistance: number;
  source: string; mapYear: number; length: number; turns: number;
  lapRecord: string; lapRecordHolder: string; lapRecordYear?: number; trackImage: string;
}
export interface TeamReference { fullName: string; base: string; principal: string; engine: string }

export function referenceText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&#(?:x([a-f\d]+)|(\d+));/gi, (_, hex, decimal) => {
    const n = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : " ";
  }).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse labelled public facts, never execute page scripts or copy biography HTML. */
export function referenceGrid(html: string) {
  const fields = new Map<string, { value: string; extra: string }>();
  for (const match of html.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>(?:<span[^>]*>([\s\S]*?)<\/span>)?/g)) {
    fields.set(referenceText(match[1]), { value: referenceText(match[2]), extra: referenceText(match[3] ?? "") });
  }
  return fields;
}

function boundedNumber(value: string | undefined, minimum: number, maximum: number) {
  if (!value || !/^\d+(?:\.\d+)?(?:km)?$/.test(value)) throw new Error("Missing or malformed numeric reference fact");
  const n = Number.parseFloat(value);
  if (n < minimum || n > maximum) throw new Error("Reference fact outside expected range");
  return n;
}

export function parseCircuitReference(html: string, previous: CircuitReference): CircuitReference {
  const fields = referenceGrid(html);
  const next = {
    ...previous,
    length: boundedNumber(fields.get("Circuit Length")?.value, 2, 10),
    firstGrandPrix: boundedNumber(fields.get("First Grand Prix")?.value, 1950, 2026),
    raceLaps: boundedNumber(fields.get("Number of Laps")?.value, 30, 100),
    raceDistance: boundedNumber(fields.get("Race Distance")?.value, 250, 330),
  };
  if (!Number.isInteger(next.firstGrandPrix) || !Number.isInteger(next.raceLaps)) throw new Error("Expected whole years and laps");
  const lap = fields.get("Fastest lap time");
  if (!lap) throw new Error("Lap record field missing");
  if (/^\d:[0-5]\d\.\d{3}$/.test(lap.value)) {
    const holder = lap.extra.match(/^(.{2,70}) \((\d{4})\)$/);
    if (!holder || Number(holder[2]) > 2026 || Number(holder[2]) < 1950) throw new Error("Lap record holder/year missing");
    next.lapRecord = lap.value;
    next.lapRecordHolder = holder[1];
    next.lapRecordYear = Number(holder[2]);
  } else if (previous.lapRecord !== "—") {
    throw new Error("Refusing to erase an established lap record");
  } else if (!/^(?:--|—|N\/A)$/.test(lap.value)) {
    throw new Error("Unrecognised empty lap record");
  }
  // Turn counts are not a consistently structured upstream field. Preserve the
  // reviewed value; a geometry change is reported for review by the sync job.
  return next;
}

export function parseTeamReference(html: string): TeamReference {
  const fields = referenceGrid(html);
  const read = (key: string) => {
    const value = fields.get(key)?.value;
    if (!value || value.length < 2 || value.length > 100 || /^(?:N\/A|TBC|--|—)$/i.test(value)) throw new Error(`Missing team reference: ${key}`);
    return value;
  };
  return { fullName: read("Full Team Name"), base: read("Base"), principal: read("Team Chief"), engine: read("Power Unit") };
}

export function trustedCircuitImage(html: string, season: number): string | null {
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    try {
      const url = new URL(match[1].replaceAll("&amp;", "&"));
      if (url.protocol === "https:" && url.hostname === "media.formula1.com" && !url.username && !url.password && url.pathname.includes(`/common/f1/${season}/track/`) && /detailed\.(?:webp|png)$/.test(url.pathname)) return url.toString();
    } catch { /* Relative/non-image URLs are not candidates. */ }
  }
  return null;
}

/** Routine timetable corrections must not move race identities or reopen picks. */
export function validateScheduleRefresh(previous: Record<string, string>, candidate: Record<string, string>, raceDate: string, now: number) {
  if (!candidate.race?.startsWith(`${raceDate}T`)) throw new Error("Race date changed; manual calendar reconciliation required");
  if (Object.keys(previous).sort().join() !== Object.keys(candidate).sort().join()) throw new Error("Weekend format changed");
  for (const time of Object.values(candidate)) {
    if (!/^2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(time) || !Number.isFinite(Date.parse(time)) || new Date(time).toISOString().replace(".000Z", "Z") !== time || Math.abs(Date.parse(time) - Date.parse(candidate.race)) > 4 * 86400000) throw new Error("Invalid weekend timestamp");
  }
  const lockKey = previous.sprintQualifying ? "sprintQualifying" : "qualifying";
  const locking = previous[lockKey];
  if (!locking || (Date.parse(locking) <= now && previous[lockKey] !== candidate[lockKey])) throw new Error("An elapsed pick deadline cannot change automatically");
  const order = candidate.sprint ? ["fp1", "sprintQualifying", "sprint", "qualifying", "race"] : ["fp1", "fp2", "fp3", "qualifying", "race"];
  for (let i = 1; i < order.length; i++) if (Date.parse(candidate[order[i]]) <= Date.parse(candidate[order[i - 1]])) throw new Error("Invalid session order");
  return candidate;
}
