"use client";

import { motion } from "framer-motion";
import { StampMark } from "@/components/brand/stamp-mark";

/**
 * Full-page loading state. The stamp "presses down" onto the paper and
 * settles — a nod to the moderation workflow papers go through before
 * they're marked approved. Used for route-level Suspense boundaries.
 */
export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-16 w-16 rounded-full border-2 border-highlight animate-ring-pulse" />
        <StampMark size={72} />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
      >
        {label}…
      </motion.p>
    </div>
  );
}
