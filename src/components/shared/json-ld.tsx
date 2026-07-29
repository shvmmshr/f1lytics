import type { Thing, WithContext } from "schema-dts";

export function JsonLd({ data }: { data: WithContext<Thing> | readonly WithContext<Thing>[] }) {
  const payload = Array.isArray(data)
    ? {
        "@context": "https://schema.org",
        "@graph": data.map((entry) =>
          Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "@context")),
        ),
      }
    : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
