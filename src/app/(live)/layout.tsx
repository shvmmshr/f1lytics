import { Navbar } from "@/components/layout/navbar";
import { AnimatedOutlet } from "@/components/layout/animated-outlet";

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatedOutlet>{children}</AnimatedOutlet>
      </main>
    </div>
  );
}
