import Image from "next/image";
import type { Circuit } from "@/lib/constants/circuits";

/** The source maps already contain readable colours and corner labels.
 * Keep their aspect ratio and colours; inversion destroys those annotations. */
export function CircuitMap({ circuit, priority = false, sizes = "(max-width: 1024px) 100vw, 55vw", className = "" }: {
  circuit: Pick<Circuit, "name" | "trackImage">;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[16/10] w-full ${className}`} data-circuit-map>
      <Image src={circuit.trackImage} alt={`${circuit.name} circuit layout and corner numbers`} fill priority={priority} sizes={sizes} className="object-contain p-3 sm:p-5" />
    </div>
  );
}
