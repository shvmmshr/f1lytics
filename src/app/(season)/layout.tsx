import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { F1 } from "@/components/shared/broadcast";

export default function SeasonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: F1.ink }}>
      <ScrollProgress />
      <Navbar />
      {/* Content sits in a centered, bordered frame so wide monitors don't get
          edge-to-edge sprawl; the darker page background fills the margins. */}
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
