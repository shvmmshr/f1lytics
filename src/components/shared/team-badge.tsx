import type { Team } from "@/lib/constants/teams";

interface TeamBadgeProps {
  team: Team;
  size?: "sm" | "md" | "lg";
}

export function TeamBadge({ team, size = "md" }: TeamBadgeProps) {
  const sizes = {
    sm: "h-5 px-2 text-xs",
    md: "h-7 px-3 text-sm",
    lg: "h-9 px-4 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizes[size]}`}
      style={{ backgroundColor: team.color }}
    >
      {team.name}
    </span>
  );
}
