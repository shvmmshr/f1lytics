"use client";

export function TeamsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-2">
      {children}
    </div>
  );
}
