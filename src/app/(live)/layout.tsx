import { Navbar } from "@/components/layout/navbar";

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1800px] flex-1 border-x border-line">{children}</main>
    </div>
  );
}
