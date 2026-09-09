/** Reduce time-series payloads before caching, without relying on feed ordering. */
export function latestByDriver<T extends { driver_number: number; date: string }>(rows: T[]): T[] {
  const latest = new Map<number, T>();
  for (const row of rows) {
    const previous = latest.get(row.driver_number);
    if (!previous || Date.parse(row.date) >= Date.parse(previous.date)) latest.set(row.driver_number, row);
  }
  return [...latest.values()];
}

export function latestRows<T extends { date: string }>(rows: T[], count: number): T[] {
  return [...rows].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, count);
}
