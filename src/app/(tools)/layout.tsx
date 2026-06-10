import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Pages manage their own max-width/padding — see (season)/layout note. */}
      <main className="w-full flex-1">{children}</main>
      <Footer />
    </div>
  );
}
