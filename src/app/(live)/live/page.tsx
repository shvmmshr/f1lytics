import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/page-transition";
import { LiveContent } from "./live-content";

export const metadata: Metadata = {
  title: "Live — GridLock F1 2026",
  description:
    "Live F1 session timing, positions, and race control data for the 2026 season",
};

export default function LivePage() {
  return (
    <PageTransition>
      <LiveContent />
    </PageTransition>
  );
}
