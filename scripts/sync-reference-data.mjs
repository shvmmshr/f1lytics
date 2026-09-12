import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { parseCircuitReference, parseTeamReference, trustedCircuitImage, validateScheduleRefresh } from "../src/lib/data/reference-parser.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = async path => JSON.parse(await readFile(join(root, path), "utf8"));
const manifest = await read("scripts/reference-manifest.json");
if (new Date().getUTCFullYear() !== manifest.season) throw Error("Season rollover requires a reviewed source manifest");
const previous = {
  circuits: await read("src/lib/data/circuit-reference.json"),
  teams: await read("src/lib/data/team-reference.json"),
  drivers: await read("src/lib/data/driver-reference.json"),
  sessions: await read("src/lib/data/session-reference.json"),
};
const next = structuredClone(previous);
const changes = [], review = [], failures = [], assets = [];
const write = process.argv.includes("--write");
const check = process.argv.includes("--check");

async function download(url, image = false) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || !["www.formula1.com", "media.formula1.com", "api.jolpi.ca"].includes(parsed.hostname)) throw Error("Untrusted source URL");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: "error", headers: { "User-Agent": "F1lytics/1.0.0 (https://f1lytics.com)" } });
      if (!response.ok) { await response.body?.cancel(); throw Error(`Source returned ${response.status}`); }
      if (image && !response.headers.get("content-type")?.startsWith("image/")) throw Error("Map response is not an image");
      const cap = image ? 300000 : 3000000;
      const reader = response.body.getReader();
      const chunks = []; let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > cap) throw Error("Source exceeds size limit");
          chunks.push(value);
        }
      } finally { await reader.cancel().catch(() => {}); }
      return Buffer.concat(chunks);
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

function changed(group, id, value) {
  if (JSON.stringify(previous[group][id]) !== JSON.stringify(value)) changes.push(`${group}/${id}`);
  next[group][id] = value;
}

let cursor = 0;
const tasks = [
  ...manifest.circuits.map(circuit => async () => {
    const html = (await download(circuit.source)).toString("utf8");
    const candidate = parseCircuitReference(html, previous.circuits[circuit.id]);
    if (candidate.firstGrandPrix !== previous.circuits[circuit.id].firstGrandPrix) throw Error("Circuit identity/history changed; review its source mapping");
    if (candidate.length !== previous.circuits[circuit.id].length) {
      // A changed layout may also alter corner numbers and invalidate old records.
      review.push(`${circuit.id}: circuit length changed; review geometry, map, turns and lap-record eligibility together`);
      return;
    }
    changed("circuits", circuit.id, candidate);
    if (circuit.mapYear === manifest.season) {
      const url = trustedCircuitImage(html, manifest.season);
      if (!url) throw Error("Current-season map missing");
      const bytes = await download(url, true);
      if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") throw Error("Expected an original WebP map");
      const target = join(root, "public", candidate.trackImage);
      const existing = await readFile(target);
      if (!existing.equals(bytes)) { assets.push({ target, bytes }); changes.push(`map/${circuit.id}`); }
    }
  }),
  ...manifest.teams.map(team => async () => {
    const html = (await download(team.url)).toString("utf8");
    changed("teams", team.id, parseTeamReference(html));
    const drivers = [...new Set([...html.matchAll(/href="\/en\/drivers\/([^"/]+)"/g)].map(match => match[1]))];
    if (JSON.stringify([...drivers].sort()) !== JSON.stringify([...team.drivers].sort())) review.push(`${team.id}: official driver lineup changed; reconcile driver IDs, assets and Lock In eligibility`);
  }),
];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < tasks.length) {
    const index = cursor++;
    try { await tasks[index](); } catch (error) { failures.push(`Source ${index + 1}: ${error.message}`); }
  }
}));

try {
  const data = JSON.parse((await download(`https://api.jolpi.ca/ergast/f1/${manifest.season}/last/results.json`)).toString());
  const race = data.MRData?.RaceTable?.Races?.[0];
  const event = manifest.circuits.find(c => c.date === race?.date && !c.cancelled);
  if (!race || race.season !== String(manifest.season) || !event) throw Error("Latest classification did not match the active calendar");
  for (const result of race.Results ?? []) {
    if (!/^[a-z][a-z0-9_]{1,40}$/.test(result.Driver?.driverId ?? "")) throw Error("Invalid driver identity");
    const confirmed = manifest.confirmedSubstitutions?.find(item => item.dates.includes(race.date) && item.sourceId === result.Driver.driverId);
    const driver = manifest.drivers.find(d => d.sourceId === result.Driver?.driverId);
    if (!driver) { if (!confirmed) review.push(`Latest classification includes uncatalogued driver ${result.Driver?.driverId}; preserve their race row and review season entry`); continue; }
    const number = Number(result.Driver.permanentNumber);
    if (!Number.isInteger(number) || number < 1 || number > 99) throw Error("Invalid driver number");
    changed("drivers", driver.id, { number });
    const actualTeam = result.Constructor?.constructorId === "rb" ? "racing_bulls" : result.Constructor?.constructorId;
    if (actualTeam && actualTeam !== driver.teamId && confirmed?.teamId !== actualTeam) review.push(`${driver.id}: latest race team differs from the listed season team; review temporary entry or permanent transfer`);
  }
  const scheduleData = JSON.parse((await download(`https://api.jolpi.ca/ergast/f1/${manifest.season}.json?limit=100`)).toString());
  const schedule = scheduleData.MRData?.RaceTable?.Races;
  if (!Array.isArray(schedule) || schedule.length < 15) throw Error("Incomplete season schedule");
  const dates = new Set(schedule.map(r => r.date));
  for (const event of manifest.circuits.filter(c => !c.cancelled)) if (!dates.has(event.date)) review.push(`${event.id}: race date missing upstream; review cancellation/reschedule and locked predictions`);
  for (const event of schedule) if (!manifest.circuits.some(c => c.date === event.date && !c.cancelled)) review.push(`Unmapped upstream race ${event.date}: review season calendar`);
  const names = { FirstPractice: "fp1", SecondPractice: "fp2", ThirdPractice: "fp3", SprintQualifying: "sprintQualifying", Sprint: "sprint", Qualifying: "qualifying" };
  for (const event of schedule) {
    const old = previous.sessions[event.date];
    if (!old) continue;
    const candidate = { race: `${event.date}T${event.time}` };
    for (const [upstream, local] of Object.entries(names)) if (event[upstream]) candidate[local] = `${event[upstream].date}T${event[upstream].time}`;
    // Stable key order avoids treating a harmless API property order as a change.
    const ordered = Object.fromEntries([...new Set([...Object.keys(old), ...Object.keys(candidate)])].map(key => [key, candidate[key]]));
    if (JSON.stringify(old) === JSON.stringify(ordered)) continue;
    try { changed("sessions", event.date, validateScheduleRefresh(old, ordered, event.date, Date.now())); }
    catch (error) { review.push(`${event.date}: ${error.message}`); }
  }
} catch (error) { failures.push(`Season cross-check: ${error.message}`); }

const report = { checkedAt: new Date().toISOString(), changes, review: [...new Set(review)], failures, wrote: write && !failures.length };
await mkdir(join(root, "docs/quality"), { recursive: true });
await writeFile(join(root, "docs/quality/reference-sync.json"), JSON.stringify(report, null, 2) + "\n");
if (failures.length) throw Error(`Reference refresh aborted; existing data preserved. ${failures.join("; ")}`);
if (write) {
  // All sources pass before any app data is replaced. Workflow commits the full set.
  for (const [group, filename] of [["circuits", "circuit"], ["teams", "team"], ["drivers", "driver"], ["sessions", "session"]]) await writeFile(join(root, `src/lib/data/${filename}-reference.json`), JSON.stringify(next[group], null, 2) + "\n");
  for (const asset of assets) await writeFile(asset.target, asset.bytes);
}
console.log(`${write ? "Applied" : "Found"} ${changes.length} reference changes; ${report.review.length} items require identity/schedule review.`);
for (const item of changes) console.log(`  ${item}`);
for (const item of report.review) console.log(`  REVIEW: ${item}`);
if (check && (changes.length || review.length)) process.exitCode = 1;
// Deterministic digest is available to CI without exposing any private data.
console.log(`Reference digest: ${createHash("sha256").update(JSON.stringify(next)).digest("hex").slice(0, 16)}`);
