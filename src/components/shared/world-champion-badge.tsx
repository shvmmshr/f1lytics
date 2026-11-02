import { Trophy } from "lucide-react";
import { getConfirmedDriverChampionship } from "@/lib/championship";
import { cn } from "@/lib/utils";

export function WorldChampionBadge({
  season,
  driverId,
  className,
}: {
  season: number;
  driverId: string;
  className?: string;
}) {
  const title = getConfirmedDriverChampionship(season, driverId);
  if (!title) return null;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 border border-[#D8BA7240] bg-[#171710] px-2 py-1 font-mono text-[10px] font-medium leading-4 tracking-[0.08em] text-[#E4C77E] uppercase",
        className,
      )}
    >
      <Trophy size={12} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
      <span>{title.season} World Champion</span>
    </span>
  );
}
