"use client";

import dynamic from "next/dynamic";
import type { GlobeCircuit } from "./circuit-globe";

const CircuitGlobe = dynamic(
  () => import("./circuit-globe").then((m) => ({ default: m.CircuitGlobe })),
  {
    ssr: false,
    loading: () => <div className="h-[500px] w-full rounded-2xl bg-card-bg" />,
  }
);

export function CircuitGlobeWrapper({ circuits }: { circuits: GlobeCircuit[] }) {
  return <CircuitGlobe circuits={circuits} />;
}
