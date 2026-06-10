import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { F1 } from "@/components/shared/broadcast";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: F1.ink }}>
      <Navbar />
      {/* Same centered frame as the season layout — see note there. */}
      <main className="w-full flex-1">
        <div
          className="mx-auto w-full min-h-full"
          style={{
            maxWidth: 1480,
            background: F1.bg,
            borderLeft: `1px solid ${F1.line}`,
            borderRight: `1px solid ${F1.line}`,
          }}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
