import { CIRCUIT_LIST, getNextRace } from "@/lib/constants";
import { format, parseISO } from "date-fns";

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
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-8 text-center">
          2026 Calendar
        </h2>

        <div
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {CIRCUIT_LIST.map((circuit) => {
            const isCancelled = circuit.cancelled === true;
            const isPast = circuit.raceDate < today;
            const isNext = nextRace?.id === circuit.id;
            const raceDate = parseISO(circuit.raceDate);

            return (
              <div
                key={circuit.id}
                className={`snap-start min-w-[200px] flex-shrink-0 rounded-xl border p-4 transition-all ${
                  isCancelled
                    ? "border-border-subtle bg-bg-secondary opacity-40"
                    : isNext
                      ? "border-status-red shadow-[0_0_15px_var(--color-glow-red)] bg-bg-secondary"
                      : isPast
                        ? "border-border-subtle bg-bg-secondary opacity-50"
                        : "border-border-subtle bg-bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-text-muted bg-bg-tertiary rounded-full px-2 py-0.5">
                    R{circuit.round}
                  </span>
                  <span className="text-lg">
                    {countryCodeToFlag(circuit.countryCode)}
                  </span>
                </div>
                <p className={`text-sm font-semibold text-text-primary truncate${isCancelled ? " line-through" : ""}`}>
                  {circuit.fullName.replace(" Grand Prix", " GP")}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {circuit.country}
                </p>
                {isCancelled ? (
                  <p className="text-xs font-semibold text-status-red mt-0.5">
                    Cancelled
                  </p>
                ) : (
                  <p className="text-xs text-text-muted mt-0.5">
                    {format(raceDate, "MMM d")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
