import { describe, expect, it } from "vitest";
import { parseCircuitReference, parseTeamReference, referenceGrid, referenceText, trustedCircuitImage, validateScheduleRefresh } from "./reference-parser";
import reference from "./circuit-reference.json";
import schedules from "./session-reference.json";

const grid = (pairs: [string, string, string?][]) => pairs.map(([k, v, extra]) => `<dt class="label">${k}</dt><dd><strong>${v}</strong></dd>${extra ? `<span>${extra}</span>` : ""}`).join("\n");
const circuit = grid([["Circuit Length", "5.414km"], ["First Grand Prix", "2026"], ["Number of Laps", "57"], ["Race Distance", "308.399km"], ["Fastest lap time", "1:32.000", "Test Driver (2026)"]]);

describe("reference refresh source guards", () => {
  it("parses labelled facts and encoded names without evaluating HTML", () => {
    expect(referenceGrid(grid([["Team Chief", "Fr&eacute;d&eacute;ric"]])).size).toBe(1);
    expect(referenceText("<b>Pierre Wach&#233;</b> &amp; team")).toBe("Pierre Waché & team");
    expect(referenceText("&#x110000;")).toBe("");
  });
  it("accepts a maiden race record and preserves source identity and corner count", () => {
    const result = parseCircuitReference(circuit, reference.madrid);
    expect(result.lapRecord).toBe("1:32.000");
    expect(result.lapRecordYear).toBe(2026);
    expect(result.turns).toBe(22);
    expect(result.source).toBe(reference.madrid.source);
  });
  it("rejects login pages, missing fields, invalid units, fractional laps and erased records", () => {
    for (const html of ["<html>Access denied</html>", circuit.replace("5.414km", "5414km"), circuit.replace(">57<", ">57.5<"), circuit.replace("(2026)", "(3026)")]) expect(() => parseCircuitReference(html, reference.madrid)).toThrow();
    expect(() => parseCircuitReference(circuit.replace("1:32.000", "--"), reference.monza)).toThrow();
  });
  it("validates complete team facts before replacing the old reference", () => {
    const html = grid([["Full Team Name", "Audi Revolut F1 Team"], ["Base", "Hinwil, Switzerland"], ["Team Chief", "Mattia Binotto"], ["Power Unit", "Audi"]]);
    expect(parseTeamReference(html).principal).toBe("Mattia Binotto");
    expect(() => parseTeamReference(html.replace("Mattia Binotto", "TBC"))).toThrow();
  });
  it("only accepts current-season maps from the trusted media host", () => {
    const url = "https://media.formula1.com/image/upload/common/f1/2026/track/2026trackmadringdetailed.webp";
    expect(trustedCircuitImage(`<img src="${url}">`, 2026)).toBe(url);
    for (const other of [url.replace("https:", "http:"), url.replace("media.formula1.com", "evil.example"), url.replace("media.formula1.com", "user@media.formula1.com"), url.replace("/2026/", "/2025/")]) expect(trustedCircuitImage(`<img src="${other}">`, 2026)).toBeNull();
  });
  it("accepts future timetable corrections without reopening an elapsed pick deadline", () => {
    const old = schedules["2026-09-13"];
    const candidate = { ...old, qualifying: "2026-09-12T14:30:00Z" };
    expect(validateScheduleRefresh(old, candidate, "2026-09-13", Date.parse("2026-09-10"))).toEqual(candidate);
    expect(() => validateScheduleRefresh(old, candidate, "2026-09-13", Date.parse("2026-09-12T15:00:00Z"))).toThrow(/deadline/);
    expect(() => validateScheduleRefresh(old, { ...old, race: "2026-09-14T13:00:00Z" }, "2026-09-13", Date.parse("2026-09-10"))).toThrow(/date/);
    expect(() => validateScheduleRefresh(old, { ...old, fp1: "2026-09-13T14:00:00Z" }, "2026-09-13", Date.parse("2026-09-10"))).toThrow(/order/);
    expect(() => validateScheduleRefresh(old, { ...old, sprint: "2026-09-12T10:00:00Z" }, "2026-09-13", Date.parse("2026-09-10"))).toThrow(/format/);
  });
});
