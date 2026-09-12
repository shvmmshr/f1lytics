import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { F1 } from "@/components/shared/broadcast";

it("keeps CSS utilities and hex-compatible broadcast colours in agreement", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  const roles = {
    ink: "bg-ink", bg: "bg-primary", bg2: "bg-secondary", bg3: "bg-tertiary", bg4: "bg-hover",
    fg: "text-primary", fg2: "text-secondary", fg3: "text-muted", fg4: "text-faint",
    line: "line", lineHi: "line-hi", red: "signal-red", redDeep: "signal-red-deep",
    amber: "signal-amber", cyan: "signal-cyan", purple: "signal-purple", green: "status-green", yellow: "status-yellow",
  } satisfies Record<keyof typeof F1, string>;
  for (const [key, role] of Object.entries(roles)) {
    expect(css.match(new RegExp(`--color-${role}:\\s*(#[\\da-f]+);`, "i"))?.[1].toUpperCase()).toBe(F1[key as keyof typeof F1]);
  }
});
