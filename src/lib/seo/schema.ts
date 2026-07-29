import type {
  BreadcrumbList,
  CollectionPage,
  ItemList,
  Person,
  Place,
  SportsEvent,
  SportsTeam,
  WebSite,
  WithContext,
} from "schema-dts";
import type { Circuit } from "@/lib/constants/circuits";
import type { Driver } from "@/lib/constants/drivers";
import type { Team } from "@/lib/constants/teams";
import { absoluteUrl, ROOT_DESCRIPTION, SITE_NAME, SITE_URL } from "./metadata";
import type { BreadcrumbItem } from "@/components/shared/breadcrumbs";

const context = "https://schema.org" as const;

export function websiteSchema(): WithContext<WebSite> {
  return {
    "@context": context,
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "F1 Analytics",
    url: SITE_URL,
    inLanguage: "en",
    description: ROOT_DESCRIPTION,
    about: {
      "@type": "SportsOrganization",
      name: "Formula 1",
      sport: "Motorsport",
    },
  };
}
export function breadcrumbSchema(items: readonly BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    "@context": context,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function collectionSchema(
  name: string,
  description: string,
  path: "/" | `/${string}`,
  items: readonly { name: string; path?: "/" | `/${string}`; url?: string }[],
): readonly [WithContext<CollectionPage>, WithContext<ItemList>] {
  const url = absoluteUrl(path);
  return [
    {
      "@context": context,
      "@type": "CollectionPage",
      name,
      description,
      url,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": context,
      "@type": "ItemList",
      name,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url ?? absoluteUrl(item.path!),
      })),
    },
  ];
}

export function driverSchema(driver: Driver, team: Team): WithContext<Person> {
  const name = `${driver.firstName} ${driver.lastName}`;
  return {
    "@context": context,
    "@type": "Person",
    name,
    url: absoluteUrl(`/drivers/${driver.slug}`),
    image: absoluteUrl(driver.image as `/${string}`),
    birthDate: driver.dateOfBirth,
    nationality: driver.nationality,
    identifier: {
      "@type": "PropertyValue",
      name: "Formula 1 car number",
      value: String(driver.number),
    },
    memberOf: {
      "@type": "SportsTeam",
      name: team.fullName,
      url: absoluteUrl(`/teams/${team.slug}`),
      sport: "Formula 1",
    },
  };
}

export function teamSchema(team: Team, drivers: readonly Driver[]): WithContext<SportsTeam> {
  return {
    "@context": context,
    "@type": "SportsTeam",
    name: team.fullName,
    alternateName: team.name,
    sport: "Formula 1",
    url: absoluteUrl(`/teams/${team.slug}`),
    logo: absoluteUrl(team.logo as `/${string}`),
    location: { "@type": "Place", name: team.base },
    athlete: drivers.map((driver) => ({
      "@type": "Person",
      name: `${driver.firstName} ${driver.lastName}`,
      url: absoluteUrl(`/drivers/${driver.slug}`),
    })),
  };
}

export function circuitSchema(circuit: Circuit): WithContext<Place> {
  return {
    "@context": context,
    "@type": "Place",
    name: circuit.name,
    alternateName: circuit.fullName,
    url: absoluteUrl(`/circuits/${circuit.slug}`),
    image: absoluteUrl(circuit.trackImage as `/${string}`),
    address: {
      "@type": "PostalAddress",
      addressLocality: circuit.city,
      addressCountry: circuit.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: circuit.coordinates.lat,
      longitude: circuit.coordinates.lng,
    },
  };
}

export function raceSchema(
  circuit: Circuit,
  description: string,
): WithContext<SportsEvent> {
  return {
    "@context": context,
    "@type": "SportsEvent",
    name: `2026 ${circuit.fullName}`,
    description,
    url: absoluteUrl(`/races/${circuit.slug}`),
    startDate: `${circuit.raceDate}T${circuit.raceTime}`,
    eventStatus: circuit.cancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    sport: "Formula 1",
    location: {
      "@type": "Place",
      name: circuit.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: circuit.city,
        addressCountry: circuit.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: circuit.coordinates.lat,
        longitude: circuit.coordinates.lng,
      },
    },
  };
}
