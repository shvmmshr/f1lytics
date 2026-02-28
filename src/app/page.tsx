export default function Home() {
  const teams = [
    { name: "McLaren", className: "bg-team-mclaren" },
    { name: "Ferrari", className: "bg-team-ferrari" },
    { name: "Red Bull", className: "bg-team-redbull" },
    { name: "Mercedes", className: "bg-team-mercedes" },
    { name: "Aston Martin", className: "bg-team-aston-martin" },
    { name: "Alpine", className: "bg-team-alpine" },
    { name: "Williams", className: "bg-team-williams" },
    { name: "Racing Bulls", className: "bg-team-racing-bulls" },
    { name: "Haas", className: "bg-team-haas" },
    { name: "Audi", className: "bg-team-audi" },
    { name: "Cadillac", className: "bg-team-cadillac" },
  ];

  const statusColors = [
    { label: "Green", className: "bg-status-green" },
    { label: "Red", className: "bg-status-red" },
    { label: "Yellow", className: "bg-status-yellow" },
    { label: "Blue", className: "bg-status-blue" },
  ];

  return (
    <div className="min-h-screen bg-bg-primary p-8 md:p-16">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-5xl font-bold tracking-tight text-text-primary">
          GridLock
        </h1>
        <p className="mt-2 text-lg text-text-secondary">
          Design Token Showcase &mdash; F1 2026
        </p>
      </header>

      {/* Typography */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-text-primary">
          Typography
        </h2>
        <div className="space-y-4 rounded-xl border border-border-subtle bg-bg-secondary p-8">
          <h3 className="text-4xl font-bold tracking-tighter text-text-primary">
            Display / Heading &mdash; Geist Sans, tight tracking
          </h3>
          <p className="text-base text-text-primary">
            Body text in Geist Sans. The quick brown fox jumps over the lazy
            dog.
          </p>
          <p className="text-sm text-text-secondary">
            Secondary text for supporting information and labels.
          </p>
          <p className="text-xs text-text-muted">
            Muted text for timestamps, footnotes, and subtle UI details.
          </p>
          <p className="font-mono text-lg text-text-primary">
            1:24.367 &mdash; Monospace for lap times &amp; data (Geist Mono)
          </p>
        </div>
      </section>

      {/* Background swatches */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-text-primary">
          Backgrounds
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border-subtle bg-bg-primary p-6">
            <p className="text-sm font-medium text-text-secondary">
              bg-primary
            </p>
            <p className="font-mono text-xs text-text-muted">#0C0C0E</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
            <p className="text-sm font-medium text-text-secondary">
              bg-secondary
            </p>
            <p className="font-mono text-xs text-text-muted">#141418</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-tertiary p-6">
            <p className="text-sm font-medium text-text-secondary">
              bg-tertiary
            </p>
            <p className="font-mono text-xs text-text-muted">#1C1C22</p>
          </div>
        </div>
      </section>

      {/* Borders */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-text-primary">
          Borders
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-bg-secondary p-6">
            <p className="text-sm font-medium text-text-secondary">
              border-subtle
            </p>
            <p className="font-mono text-xs text-text-muted">#27272A</p>
          </div>
          <div className="rounded-xl border border-border-active bg-bg-secondary p-6">
            <p className="text-sm font-medium text-text-secondary">
              border-active
            </p>
            <p className="font-mono text-xs text-text-muted">#3F3F46</p>
          </div>
        </div>
      </section>

      {/* Status Colors */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-text-primary">
          Status Colors
        </h2>
        <div className="flex flex-wrap gap-6">
          {statusColors.map((status) => (
            <div key={status.label} className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full ${status.className}`}
              />
              <span className="text-sm font-medium text-text-secondary">
                {status.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Team Colors */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-text-primary">
          F1 2026 Team Colors
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {teams.map((team) => (
            <div
              key={team.name}
              className="flex flex-col items-center gap-3 rounded-xl border border-border-subtle bg-bg-secondary p-4"
            >
              <div
                className={`h-12 w-12 rounded-full ${team.className}`}
              />
              <span className="text-xs font-medium text-text-secondary">
                {team.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Card */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-text-primary">
          Sample Component
        </h2>
        <div className="max-w-md rounded-2xl border border-border-subtle bg-bg-secondary p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-text-primary">
              Race Results
            </h3>
            <span className="rounded-full bg-status-green/20 px-3 py-1 text-xs font-medium text-status-green">
              Final
            </span>
          </div>
          <div className="space-y-3">
            {[
              { pos: 1, driver: "L. Norris", team: "McLaren", time: "1:24.367", color: "border-team-mclaren" },
              { pos: 2, driver: "C. Leclerc", team: "Ferrari", time: "+2.148", color: "border-team-ferrari" },
              { pos: 3, driver: "M. Verstappen", team: "Red Bull", time: "+5.902", color: "border-team-redbull" },
            ].map((result) => (
              <div
                key={result.pos}
                className={`flex items-center gap-4 rounded-lg border-l-2 ${result.color} bg-bg-tertiary px-4 py-3`}
              >
                <span className="font-mono text-lg font-bold text-text-primary">
                  P{result.pos}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {result.driver}
                  </p>
                  <p className="text-xs text-text-muted">{result.team}</p>
                </div>
                <span className="font-mono text-sm text-text-secondary">
                  {result.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle pt-8">
        <p className="text-sm text-text-muted">
          GridLock Design System &mdash; All tokens verified.
        </p>
      </footer>
    </div>
  );
}
