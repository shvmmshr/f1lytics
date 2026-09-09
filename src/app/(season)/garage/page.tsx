import { Garage } from "@/components/garage/garage";
import { getGarageLegend } from "@/lib/garage/legends";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Legendary F1 Cars in 3D: RB19, W11 & Ferrari F2004",
  description: "Explore detailed 3D exhibits of the Red Bull RB19, Mercedes W11 and Ferrari F2004, alongside the stories of Verstappen, Hamilton and Schumacher.",
  path: "/garage", imageEyebrow: "THE GARAGE · LEGENDS",
});

export default async function GaragePage({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const { car } = await searchParams;
  const selected = getGarageLegend(car);
  return (
    <div className="bg-bg-primary text-text-primary">
      <header className="border-b border-line px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted"><span className="text-signal-red">The Garage</span><span>Collection 01 / Championship icons</span></div>
        <h1 className="mt-4 font-display text-[clamp(44px,7vw,88px)] uppercase leading-[0.95] tracking-tight">Machines that made <span className="text-signal-red">history.</span></h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">Three legendary cars. Three world champions. Get closer to the machines behind the moments.</p>
      </header>
      <Garage initialCarId={selected.id} />
    </div>
  );
}
