import { expect, it } from "vitest";
import { latestByDriver, latestRows } from "./latest";

it("keeps the latest reading per driver even if the upstream is unsorted", () => {
  const older = { driver_number: 4, date: "2026-09-06T12:00:00Z", position: 2 };
  const newer = { ...older, date: "2026-09-06T12:01:00Z", position: 1 };
  const other = { ...older, driver_number: 81 };
  expect(latestByDriver([newer, other, older])).toEqual([newer, other]);
});
it("limits cached messages to the latest requested rows without mutating input", () => {
  const rows = [{ date: "2026-09-06T12:00:00Z" }, { date: "2026-09-06T12:01:00Z" }];
  expect(latestRows(rows, 1)).toEqual([rows[1]]);
  expect(rows[0].date).toBe("2026-09-06T12:00:00Z");
});
