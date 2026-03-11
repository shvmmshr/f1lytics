"use client";

export function DriversGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2">
      {children}
    </div>
  );
}
