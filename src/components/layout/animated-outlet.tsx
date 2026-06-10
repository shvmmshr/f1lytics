"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Wraps page content in an AnimatePresence whose direct child is keyed by the
 * pathname — that's what lets Framer run an EXIT animation on route change
 * (mode="wait": old page fades out before the new one mounts). The per-page
 * <PageTransition> still handles the richer enter flourish; `initial={false}`
 * here avoids a competing enter fade on first load.
 *
 * Lives inside the route-group layouts (around <main> children) so the persistent
 * navbar/footer are NOT remounted on navigation.
 */
export function AnimatedOutlet({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
