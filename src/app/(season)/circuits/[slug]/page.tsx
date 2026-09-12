import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRaceResults } from "@/lib/api/jolpica";
import type { RaceResult } from "@/lib/api/types";
import { CIRCUIT_LIST, DRIVER_LIST, TEAMS, getApiRound, getCircuitBySlug } from "@/lib/constants";
import { getWeekendSchedule } from "@/lib/constants/sessions";
import { CIRCUIT_FACTS } from "@/lib/circuits/facts";
import { CIRCUIT_GUIDES } from "@/lib/circuits/guides";
import { circuitLapRecord, circuitWeekendState, matchingCircuitRace } from "@/lib/circuits/weekend";
import { nowMs } from "@/lib/clock";
import { mapConstructorToTeamId } from "@/lib/constructor-map";
import { countryCodeToFlag } from "@/lib/utils";
import { PageTransition } from "@/components/layout/page-transition";
import { F1, Grid as BroadcastGrid, SectionHeader } from "@/components/shared/broadcast";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { CircuitMap } from "@/components/shared/circuit-map";
import { SessionSchedule } from "@/components/shared/session-schedule";
import { JsonLd } from "@/components/shared/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, circuitSchema } from "@/lib/seo/schema";

interface CircuitPageProps { params: Promise<{ slug: string }> }
const labelClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted";
const sectionClass = "relative scroll-mt-28 border-t border-line px-[var(--page-gutter)] py-8 sm:py-10";
const stateLabels = { upcoming: "Upcoming", weekend: "Race weekend", completed: "Results published", awaiting: "Awaiting classification", cancelled: "Cancelled for 2026" };

export function generateStaticParams() {
  return CIRCUIT_LIST.map(circuit => ({ slug: circuit.slug }));
}

export async function generateMetadata({ params }: CircuitPageProps): Promise<Metadata> {
  const circuit = getCircuitBySlug((await params).slug);
  if (!circuit) return { title: "Not Found" };
  const facts = CIRCUIT_FACTS[circuit.id as keyof typeof CIRCUIT_FACTS];
  return createPageMetadata({
    title: `${circuit.name} F1 Circuit Guide`,
    description: `Explore ${circuit.name} in ${circuit.city}: ${circuit.length.toFixed(3)} km, ${circuit.turns} corners and ${facts.raceLaps} race laps. Track map, key sections, racing notes, lap record and 2026 weekend information.`,
    path: `/circuits/${circuit.slug}`,
    imageEyebrow: `CIRCUIT GUIDE · ${circuit.country.toUpperCase()}`,
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

// Future circuits skip their result fetch at build time; keep ISR explicit.
export const revalidate = 300;

export default async function CircuitPage({ params }: CircuitPageProps) {
  const circuit = getCircuitBySlug((await params).slug);
  if (!circuit) notFound();
  const id = circuit.id as keyof typeof CIRCUIT_FACTS;
  const facts = CIRCUIT_FACTS[id];
  const guide = CIRCUIT_GUIDES[id];
  const breadcrumbs: readonly BreadcrumbItem[] = [
    { name: "Home", href: "/" }, { name: "Circuits", href: "/circuits" }, { name: circuit.name },
  ];
  const index = CIRCUIT_LIST.findIndex(c => c.id === circuit.id);
  const previous = CIRCUIT_LIST[index - 1];
  const next = CIRCUIT_LIST[index + 1];
  const now = nowMs();
  let race: RaceResult | undefined;
  let resultsUnavailable = false;
  if (!circuit.cancelled && now >= Date.parse(`${circuit.raceDate}T${circuit.raceTime}`)) {
    try {
      const results = await getRaceResults("2026", String(getApiRound(circuit)));
      race = matchingCircuitRace(circuit, results[0]);
      if (results.length && !race) console.error("[f1lytics] circuit classification did not match its race date:", circuit.slug);
    } catch (error) {
      resultsUnavailable = true;
      console.warn("[f1lytics] optional circuit results unavailable:", error);
    }
  }
  const state = circuitWeekendState(circuit, now, race);
  const record = circuitLapRecord(circuit, race);
  const schedule = !circuit.cancelled ? getWeekendSchedule(circuit.raceDate) : undefined;
  const topResults = state === "completed" ? [...(race?.Results ?? [])].sort((a, b) => Number(a.position) - Number(b.position)).slice(0, 5) : [];
  const racePath = `/races/${circuit.slug}` as const;

  return (
    <PageTransition>
      <JsonLd data={[breadcrumbSchema(breadcrumbs), circuitSchema(circuit)]} />
      <article className="relative bg-bg-primary text-text-primary">
        <BroadcastGrid color={F1.line} size={64} opacity={0.12} />
        <header className="relative px-[var(--page-gutter)] py-7 sm:py-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <Breadcrumbs items={breadcrumbs} />
            <p className={`${labelClass} flex flex-wrap items-center gap-3`}>
              <span>Round {String(circuit.round).padStart(2, "0")}</span>
              <span className={`border px-2.5 py-1.5 ${circuit.cancelled ? "border-signal-red/50 text-signal-red" : "border-line text-text-secondary"}`}>{stateLabels[state]}</span>
            </p>
          </div>
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-9">
            <div className="min-w-0 lg:py-3">
              <p className={`${labelClass} flex flex-wrap gap-x-4 gap-y-2`}><span>{countryCodeToFlag(circuit.countryCode)} {circuit.city}, {circuit.country}</span><span>{guide.kind}</span></p>
              <h1 className="mt-4 font-display text-[clamp(42px,5.4vw,76px)] uppercase leading-[1.02] tracking-tight">{circuit.name}<span className="text-signal-red">.</span></h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-[1.8] text-text-secondary sm:text-base">{guide.intro}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={racePath} className="inline-flex min-h-11 items-center justify-center gap-4 bg-signal-red px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-bg-ink hover:bg-red-500">{state === "completed" ? "Race results" : circuit.cancelled ? "Race status" : "Race centre"}<span aria-hidden>→</span></Link>
                {!circuit.cancelled && <a href="#weekend" className="inline-flex min-h-11 items-center justify-center border border-line px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-text-secondary hover:border-text-muted">2026 weekend <span aria-hidden className="ml-3">↓</span></a>}
              </div>
            </div>
            <figure className="min-w-0 border border-line bg-bg-secondary">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5"><span className={labelClass}>Track layout</span><span className={labelClass}>{facts.mapYear} reference</span></div>
              <CircuitMap circuit={circuit} priority />
              <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line px-4 py-1 text-xs text-text-secondary sm:px-5">
                <span>{circuit.turns} corners · {circuit.length.toFixed(3)} km</span>
                <a href={circuit.trackImage} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4 hover:text-text-primary">Full-size map <span aria-hidden>↗</span><span className="sr-only"> (opens in a new tab)</span></a>
              </figcaption>
            </figure>
          </div>
          <dl className="mt-7 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 xl:grid-cols-6" aria-label="Circuit facts">
            {[["Lap length", `${circuit.length.toFixed(3)} km`], ["Corners", String(circuit.turns)], [circuit.cancelled ? "Usual race laps" : "Race laps", String(facts.raceLaps)], ["First F1 GP", String(facts.firstGrandPrix)]].map(([label, value]) => <div key={label} className="bg-bg-primary px-4 py-5"><dt className={labelClass}>{label}</dt><dd className="mt-2 font-display text-3xl leading-none sm:text-[34px]">{value}</dd></div>)}
            <div className="col-span-2 bg-bg-secondary px-4 py-5 sm:col-span-4 xl:col-span-2">
              <dt className={labelClass}>Race lap record</dt>
              <dd className="mt-2 font-display text-3xl leading-none sm:text-[34px]">{record?.time ?? "Not established"}</dd>
              <dd className="mt-2 text-xs leading-relaxed text-text-secondary">{record ? `${record.holder}${record.year ? ` · ${record.year}` : ""}` : "No Formula 1 race record is available yet."}</dd>
            </div>
          </dl>
        </header>

        <section id="lap" className={sectionClass} aria-label="Key circuit sections">
          <SectionHeader label="KEY SECTIONS" />
          <div className="grid gap-4 lg:grid-cols-3">
            {guide.sections.map(([turns, name, detail], i) => <div key={turns} className="relative border border-line bg-bg-secondary p-5 sm:p-6">
              <div className="flex items-center justify-between"><p className={`${labelClass} text-text-secondary`}>{turns}</p><span aria-hidden className="font-display text-4xl leading-none text-text-muted/40">0{i + 1}</span></div>
              <h3 className="mt-4 font-display text-2xl uppercase leading-tight">{name}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{detail}</p>
            </div>)}
          </div>
          <div className="mt-6 grid gap-x-8 gap-y-5 border-l-2 border-signal-red pl-5 md:grid-cols-2">
            <div><h3 className={`${labelClass} text-text-primary`}>Setup focus</h3><p className="mt-2 text-sm leading-7 text-text-secondary">{guide.setup}</p></div>
            <div><h3 className={`${labelClass} text-text-primary`}>Racing focus</h3><p className="mt-2 text-sm leading-7 text-text-secondary">{guide.racing}</p></div>
          </div>
        </section>

        <section id="weekend" className={sectionClass} aria-label="2026 race weekend">
          <SectionHeader label="THE 2026 GRAND PRIX" />
          <div className={`grid items-start gap-6 ${schedule ? "lg:grid-cols-2" : ""}`}>
            <div className="min-w-0 border border-line bg-bg-secondary">
              <div className="border-b border-line p-5 sm:p-6">
                <p className={`${labelClass} ${circuit.isSprint && !circuit.cancelled ? "text-signal-amber" : "text-text-secondary"}`}>{stateLabels[state]}{circuit.isSprint && !circuit.cancelled ? " · Sprint weekend" : ""}</p>
                <h3 className="mt-3 font-display text-3xl uppercase leading-tight">{circuit.fullName}</h3>
                <p className="mt-2 text-sm text-text-secondary">{circuit.cancelled ? "Originally scheduled for " : "Race date · "}<time dateTime={circuit.raceDate}>{formatDate(circuit.raceDate)}</time></p>
                {!circuit.cancelled && <p className="mt-2 text-xs text-text-muted">{facts.raceLaps} scheduled laps · {facts.raceDistance.toFixed(3)} km</p>}
              </div>
              {topResults.length > 0 ? <table className="w-full table-fixed border-collapse" data-circuit-results>
                <caption className="sr-only">Top five finishers, 2026 {circuit.fullName}</caption>
                <thead><tr className="border-b border-line bg-bg-primary"><th scope="col" className={`${labelClass} w-12 py-3 pl-4 text-left sm:w-14`}>Pos</th><th scope="col" className={`${labelClass} py-3 pl-2 text-left`}>Driver / team</th><th scope="col" className={`${labelClass} w-24 py-3 pr-4 text-right sm:w-28`}>Time / gap</th></tr></thead>
                <tbody>{topResults.map(result => {
                  const driver = DRIVER_LIST.find(candidate => candidate.id === result.Driver.driverId || candidate.abbreviation === result.Driver.code?.toUpperCase());
                  const teamId = mapConstructorToTeamId(result.Constructor?.constructorId ?? "", result.Constructor?.name ?? "");
                  const team = teamId ? TEAMS[teamId] : undefined;
                  const name = `${result.Driver.givenName} ${result.Driver.familyName}`;
                  return <tr key={result.Driver.driverId} className="border-b border-line last:border-b-0">
                    <td className={`py-3 pl-4 align-top font-mono text-sm ${result.position === "1" ? "text-signal-amber" : "text-text-secondary"}`}>{result.position}</td>
                    <td className="px-2 py-2"><div className="font-display text-lg leading-tight">{driver ? <Link href={`/drivers/${driver.slug}`} className="inline-flex min-h-11 items-center hover:underline">{name}</Link> : name}</div><p className="pb-1 text-[11px] leading-relaxed text-text-muted">{team?.name ?? result.Constructor?.name}</p></td>
                    <td className="break-words py-3 pr-4 text-right align-top font-mono text-xs leading-6 text-text-secondary">{result.Time?.time ?? result.status}</td>
                  </tr>;
                })}</tbody>
              </table> : <p className="px-5 py-5 text-sm leading-7 text-text-secondary sm:px-6">{circuit.cancelled ? "This round was cancelled. There is no 2026 race classification or active session schedule for this venue." : resultsUnavailable ? "Race results are temporarily unavailable. The circuit guide and published weekend schedule remain available." : state === "awaiting" ? "A race classification has not been published here yet. Check the race centre for the latest session information." : state === "weekend" ? "The weekend is under way. Follow practice, qualifying and race-session coverage in the race centre; the race classification will appear here when published." : "Use the schedule to plan your weekend. The race centre brings together session information, qualifying and results as they become available."}</p>}
              <Link href={racePath} className="flex min-h-12 items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm text-text-secondary hover:bg-white/[0.04] sm:px-6"><span>{topResults.length ? "Full classification & race analysis" : circuit.cancelled ? "View cancellation details" : "Open the race centre"}</span><span aria-hidden>→</span></Link>
            </div>
            {schedule && <div className="min-w-0"><SessionSchedule schedule={schedule} title={state === "completed" ? "WEEKEND SESSION TIMES" : "WEEKEND SCHEDULE"} /></div>}
          </div>
        </section>

        <footer className="relative border-t border-line px-[var(--page-gutter)] pb-8 pt-4 sm:pb-10">
          <details className="mb-6 text-sm leading-7 text-text-secondary">
            <summary className="w-fit cursor-pointer py-3 underline underline-offset-4">Sources & circuit notes</summary>
            <div className="max-w-3xl space-y-2 pb-3">
              <p>Facts and map: <a href={facts.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Formula 1 circuit guide ↗</a>. The first Grand Prix year refers to the venue’s World Championship history; its layout may have changed since.</p>
              <p>The lap record is a race lap, not a qualifying lap. {record?.source === "classification" ? "The published 2026 classification supplies the newest record shown here." : "Current-season race laps can update the reference record once the classification is available."} Race results come from Jolpica; the track notes are F1lytics’ editorial guide.</p>
              {facts.mapYear < 2026 && <p>This cancelled venue uses a {facts.mapYear} reference map. Any DRS markings belong to that earlier season.</p>}
              {id === "madrid" && <p>Corner names and layout details also reference the <a href="https://www.madring.com/en/circuit" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Madring technical guide ↗</a>.</p>}
            </div>
          </details>
          <nav aria-label="Browse circuits" className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {previous ? <Link href={`/circuits/${previous.slug}`} className="flex min-h-24 items-center gap-4 bg-bg-primary p-5 hover:bg-bg-secondary"><span aria-hidden>←</span><div className="min-w-0"><p className={labelClass}>Previous circuit</p><p className="mt-2 font-display text-xl uppercase leading-tight">{previous.name}</p></div></Link> : <Link href="/circuits" className="flex min-h-24 items-center bg-bg-primary p-5 text-sm hover:bg-bg-secondary">← All circuits</Link>}
            {next ? <Link href={`/circuits/${next.slug}`} className="flex min-h-24 items-center justify-end gap-4 bg-bg-primary p-5 text-right hover:bg-bg-secondary"><div className="min-w-0"><p className={labelClass}>Next circuit</p><p className="mt-2 font-display text-xl uppercase leading-tight">{next.name}</p></div><span aria-hidden>→</span></Link> : <Link href="/circuits" className="flex min-h-24 items-center justify-end bg-bg-primary p-5 text-sm hover:bg-bg-secondary">All circuits →</Link>}
          </nav>
        </footer>
      </article>
    </PageTransition>
  );
}
