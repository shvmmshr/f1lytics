import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { AnimatedOutlet } from "@/components/layout/animated-outlet";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">
        <AnimatedOutlet>{children}</AnimatedOutlet>
      </main>
      <Footer />
    </div>
  );
}
