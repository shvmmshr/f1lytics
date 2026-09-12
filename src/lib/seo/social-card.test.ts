import { describe, expect, it } from "vitest";
import { CIRCUIT_LIST } from "@/lib/constants/circuits";
import { DRIVER_LIST } from "@/lib/constants/drivers";
import { GARAGE_LEGENDS } from "@/lib/garage/legends";
import { cleanSocialText, socialCardModel } from "./social-card";
import { socialImagePath, versionedImagePath, SOCIAL_IMAGE_VERSION } from "./social-url";
import { createPageMetadata } from "./metadata";

describe("social preview freshness", () => {
  it("versions URLs and changes them when page copy or selected exhibit changes", () => {
    const input = { path: "/garage", title: "The Garage", description: "Nine cars" };
    expect(socialImagePath(input)).not.toBe(socialImagePath({ ...input, description: "Ten cars" }));
    expect(socialImagePath(input)).not.toBe(socialImagePath({ ...input, path: "/garage?car=r25" }));
    expect(new URL(socialImagePath(input), "https://f1lytics.com").searchParams.get("v")).toBe(SOCIAL_IMAGE_VERSION);
    expect(versionedImagePath("/api/og/lockin?share=abc")).toContain("share=abc&v=");
  });
  it("keeps the canonical stable while sharing a specific Garage car", () => {
    const metadata = createPageMetadata({ title: "R25", description: "Alonso", path: "/garage", imageContext: "/garage?car=r25" });
    expect(metadata.alternates?.canonical).toBe("https://f1lytics.com/garage");
    expect(JSON.stringify(metadata.openGraph?.images)).toContain("car%3Dr25");
  });
  it("gets season and collection counts from the actual catalogs", () => {
    expect(socialCardModel({ path: "/" }).stats[0].value).toBe(String(CIRCUIT_LIST.filter(c=>!c.cancelled).length));
    expect(socialCardModel({ path: "/garage" }).stats[0].value).toBe(String(GARAGE_LEGENDS.length));
  });
  it.each(GARAGE_LEGENDS)("shares the correct $name exhibit and history", car => {
    const image = socialCardModel({ path: `/garage?car=${car.id}` });
    expect(image.title).toContain(car.name);
    expect(image.eyebrow).toContain(car.driver);
    expect(image.stats).toEqual(car.stats);
  });
  it("uses the current driver number and distinguishes cancelled/sprint weekends", () => {
    const driver = DRIVER_LIST.find(d => d.slug === "max-verstappen")!;
    expect(socialCardModel({ path: "/drivers/max-verstappen" }).stats[0].value).toBe(`#${driver.number}`);
    expect(socialCardModel({ path: "/races/bahrain-gp" }).stats[2].value).toBe("CANCELLED");
    expect(socialCardModel({ path: "/races/chinese-gp" }).stats[2].value).toBe("SPRINT");
    expect(socialCardModel({ path: "/races/madrid-gp" }).stats[1].value).toBe("13 SEPT 2026");
  });
  it("bounds image inputs, preserves supported names and has honest fallbacks", () => {
    expect(cleanSocialText("Häkkinen · Pérez", 30)).toBe("Häkkinen · Pérez");
    expect(cleanSocialText("😀\n  PÉREZ", 30)).toBe("PÉREZ");
    expect(cleanSocialText("x".repeat(500), 112)).toHaveLength(112);
    expect(socialCardModel({ path: "https://untrusted.example", title: "" }).path).toBe("/");
    expect(socialCardModel({ path: "/\\[invalid" }).path).toBe("/");
    expect(socialCardModel({ path: "/" + "a".repeat(1000) }).path).toHaveLength(56);
    expect(socialCardModel({ path: "/garage?car=__proto__" }).title).toContain("RB19");
  });
});
