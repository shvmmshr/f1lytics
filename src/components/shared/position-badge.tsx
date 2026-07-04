import { cn } from "@/lib/utils";

interface PositionBadgeProps {
  position: number;
  change?: number;
}

const METALLIC_GRADIENTS: Record<number, string> = {
  1: "linear-gradient(135deg, #FFD700, #B8860B)",
  2: "linear-gradient(135deg, #C0C0C0, #808080)",
  3: "linear-gradient(135deg, #CD7F32, #8B4513)",
};

export function PositionBadge({ position, change }: PositionBadgeProps) {
  const gradient = METALLIC_GRADIENTS[position];

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded font-mono text-sm font-bold",
          gradient && "text-white",
          !gradient && "bg-bg-tertiary text-text-secondary"
        )}
        style={gradient ? { background: gradient } : undefined}
      >
        {position}
      </span>
      {change !== undefined && change !== 0 && (
        <span
          className={cn(
            "font-mono text-xs font-medium",
            change > 0 && "text-status-green",
            change < 0 && "text-status-red"
          )}
        >
          {change > 0 ? `+${change}` : `−${Math.abs(change)}`}
        </span>
      )}
    </div>
  );
}
