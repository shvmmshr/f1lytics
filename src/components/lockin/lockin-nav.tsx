"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { F1 } from "@/components/shared/broadcast";

const ITEMS = [
  { href: "/lockin", label: "THIS ROUND", exact: true },
  { href: "/lockin/leaderboard", label: "LEADERBOARD" },
  { href: "/lockin/leagues", label: "LEAGUES" },
];

export function LockInNav({ signedIn, displayName }: { signedIn: boolean; displayName: string | null }) {
  const pathname = usePathname();
  const items = [...ITEMS, signedIn ? { href: "/lockin/account", label: displayName ? displayName.toUpperCase() : "ACCOUNT" } : { href: `/lockin/sign-in?next=${encodeURIComponent(pathname)}`, label: "SIGN IN" }];
  return (
    <nav aria-label="Lock In" className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${F1.line}`, background: F1.bg }}>
      {items.map((item) => {
        const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href.split("?")[0]);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="relative shrink-0 font-mono transition-colors hover:text-white"
            style={{ padding: "14px 16px", fontSize: 11, letterSpacing: "0.16em", color: active ? F1.fg : F1.fg2, borderRight: `1px solid ${F1.line}`, fontWeight: active ? 700 : 500 }}
          >
            {active && <span aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: F1.red }} />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
