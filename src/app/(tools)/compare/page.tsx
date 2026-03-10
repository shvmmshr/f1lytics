import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/page-transition";
import { SectionHeader } from "@/components/shared/section-header";
import { CompareTool } from "./compare-tool";

export const metadata: Metadata = {
  title: "Compare — GridLock F1 2026",
  description: "Head-to-head comparison of F1 drivers and teams",
};

export default function ComparePage() {
  return (
    <PageTransition>
      <SectionHeader title="Compare" subtitle="Head-to-head analysis" />
      <CompareTool />
    </PageTransition>
  );
}
