import type { MetadataRoute } from "next";
import { CIRCUIT_LIST, DRIVER_LIST, TEAM_LIST } from "@/lib/constants";
import { SITE_URL } from "@/lib/seo/metadata";
import { env } from "@/lib/env";

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = Date.now();
  const staticPaths = [
    "/",
    "/standings",
    "/calendar",
    "/drivers",
    "/teams",
    "/circuits",
    "/races",
    "/live",
    "/compare",
    "/news",
    "/about",
    "/privacy",
    "/support",
    ...(env.lockInEnabled ? (["/lockin", "/lockin/leaderboard", "/lockin/leagues"] as const) : []),
  ];

  const staticPages = staticPaths.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
  }));
  const circuitPages = CIRCUIT_LIST.map((circuit) => ({
    url: `${SITE_URL}/circuits/${circuit.slug}`,
  }));
  const driverPages = DRIVER_LIST.map((driver) => ({
    url: `${SITE_URL}/drivers/${driver.slug}`,
  }));
  const teamPages = TEAM_LIST.map((team) => ({
    url: `${SITE_URL}/teams/${team.slug}`,
  }));
  const racePages = CIRCUIT_LIST.filter((circuit) => !circuit.cancelled).map((circuit) => {
    const scheduledStart = new Date(`${circuit.raceDate}T${circuit.raceTime}`);
    return scheduledStart.getTime() < now
      ? { url: `${SITE_URL}/races/${circuit.slug}`, lastModified: scheduledStart }
      : { url: `${SITE_URL}/races/${circuit.slug}` };
  });

  return [...staticPages, ...circuitPages, ...driverPages, ...teamPages, ...racePages];
}
