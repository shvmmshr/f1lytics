import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AnimatedOutlet } from "@/components/layout/animated-outlet";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Pages manage their own max-width/padding — see (season)/layout note. */}
      <main className="w-full flex-1">
        <AnimatedOutlet>{children}</AnimatedOutlet>
      </main>
      <Footer />
    </div>
  );
}
