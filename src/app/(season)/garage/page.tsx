import { Garage } from "@/components/garage/garage";
import { GARAGE_LEGENDS, getGarageLegend } from "@/lib/garage/legends";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const { car: carId } = await searchParams;
  const car = carId ? getGarageLegend(carId) : null;
  return createPageMetadata({
    title: car ? `${car.year} ${car.team} ${car.name} · ${car.driver}` : "Legendary F1 Cars in 3D: RB19, W11, F2004 & More",
    description: car ? car.story : `Explore ${GARAGE_LEGENDS.length} legendary F1 cars in 3D, from Senna’s MP4/4 to Verstappen’s RB19, with Vettel’s RB9, Button’s Brawn and Alonso’s Renault R25.`,
    path: "/garage", imageEyebrow: "THE GARAGE · LEGENDS",
    imageContext: car ? `/garage?car=${car.id}` : "/garage",
  });
}

export default async function GaragePage({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const { car } = await searchParams;
  const selected = getGarageLegend(car);
  return (
    <div className="bg-bg-primary text-text-primary">
      <header className="border-b border-line px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted"><span className="text-signal-red">The Garage</span><span>Collection 01 / Championship icons</span></div>
        <h1 className="mt-4 font-display text-[clamp(44px,7vw,88px)] uppercase leading-[0.95] tracking-tight">Machines that made <span className="text-signal-red">history.</span></h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">{GARAGE_LEGENDS.length} legendary cars. {new Set(GARAGE_LEGENDS.map((entry) => entry.driver)).size} world champions. Get closer to the machines behind the moments.</p>
      </header>
      <Garage initialCarId={selected.id} />
    </div>
  );
}
