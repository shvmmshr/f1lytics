import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { AnimatedOutlet } from "@/components/layout/animated-outlet";

export default function SeasonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <Navbar />
      {/* Pages manage their own max-width/padding (most target ~1400px with their
          own 32px inset); the previous max-w-7xl + px-* wrapper double-padded and
          clipped them. */}
      <main className="w-full flex-1">
        <AnimatedOutlet>{children}</AnimatedOutlet>
      </main>
      <Footer />
    </div>
  );
}
