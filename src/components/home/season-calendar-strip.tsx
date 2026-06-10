import { CIRCUIT_LIST, getNextRace } from "@/lib/constants";
import { format, parseISO } from "date-fns";
import { F1, Mono, LiveDot } from "@/components/shared/broadcast";

function countryCodeToFlag(countryCode: string): string {
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export function SeasonCalendarStrip() {
  const nextRace = getNextRace();
  const today = new Date().toISOString().split("T")[0];

  return (
    <section
      style={{
        background: F1.bg,
        borderTop: `1px solid ${F1.line}`,
        borderBottom: `1px solid ${F1.line}`,
        padding: "60px 32px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        <div className="flex items-center gap-3.5 mb-7">
          <Mono style={{ color: F1.red, fontSize: 11, letterSpacing: "0.24em", fontWeight: 700 }}>
            CALENDAR
          </Mono>
          <span style={{ width: 40, height: 1, background: F1.line }} />
          <Mono style={{ color: F1.fg3, fontSize: 11, letterSpacing: "0.18em" }}>
            {CIRCUIT_LIST.length} ROUNDS · 2026 SEASON
          </Mono>
        </div>

        <div
          className="flex overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ gap: 1, background: F1.line, border: `1px solid ${F1.line}` }}
        >
          {CIRCUIT_LIST.map((circuit) => {
            const isCancelled = circuit.cancelled === true;
            const isPast = circuit.raceDate < today;
            const isNext = nextRace?.id === circuit.id;
            const raceDate = parseISO(circuit.raceDate);
            const accent = isNext ? F1.red : isCancelled ? F1.fg4 : isPast ? F1.fg4 : F1.fg3;

            return (
              <div
                key={circuit.id}
                className="snap-start flex-shrink-0"
                style={{
                  minWidth: 196,
                  background: F1.bg,
                  padding: "14px 16px",
                  borderTop: `2px solid ${accent}`,
                  opacity: isCancelled ? 0.45 : isPast ? 0.6 : 1,
                  position: "relative",
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <Mono
                    style={{
                      fontSize: 10,
                      color: F1.fg,
                      background: F1.bg2,
                      border: `1px solid ${F1.line}`,
                      padding: "2px 8px",
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                    }}
                  >
                    R{String(circuit.round).padStart(2, "0")}
                  </Mono>
                  <span style={{ fontSize: 16 }}>{countryCodeToFlag(circuit.countryCode)}</span>
                </div>
                <div
                  className="font-display truncate"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: F1.fg,
                    letterSpacing: "-0.01em",
                    textDecoration: isCancelled ? "line-through" : "none",
                  }}
                >
                  {circuit.fullName.replace(" Grand Prix", " GP").toUpperCase()}
                </div>
                <Mono
                  className="block"
                  style={{ fontSize: 10, color: F1.fg3, letterSpacing: "0.14em", marginTop: 4 }}
                >
                  {circuit.country.toUpperCase()}
                </Mono>
                <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                  {isNext && <LiveDot size={6} />}
                  <Mono
                    style={{
                      fontSize: 10,
                      color: isCancelled ? F1.red : isNext ? F1.red : F1.fg2,
                      letterSpacing: "0.14em",
                      fontWeight: isNext ? 700 : 400,
                    }}
                  >
                    {isCancelled ? "CANCELLED" : format(raceDate, "MMM d").toUpperCase()}
                  </Mono>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
