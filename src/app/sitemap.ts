import type { MetadataRoute } from "next";
import { CIRCUIT_LIST, DRIVER_LIST, TEAM_LIST } from "@/lib/constants";

const BASE_URL = "https://f1lytics.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/standings`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/calendar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/drivers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/teams`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/circuits`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/races`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/live`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamic circuit pages
  const circuitPages: MetadataRoute.Sitemap = CIRCUIT_LIST.map((circuit) => ({
    url: `${BASE_URL}/circuits/${circuit.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic driver pages
  const driverPages: MetadataRoute.Sitemap = DRIVER_LIST.map((driver) => ({
    url: `${BASE_URL}/drivers/${driver.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic team pages
  const teamPages: MetadataRoute.Sitemap = TEAM_LIST.map((team) => ({
    url: `${BASE_URL}/teams/${team.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic race pages
  const racePages: MetadataRoute.Sitemap = CIRCUIT_LIST.map((circuit) => ({
    url: `${BASE_URL}/races/${circuit.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...circuitPages,
    ...driverPages,
    ...teamPages,
    ...racePages,
  ];
}
