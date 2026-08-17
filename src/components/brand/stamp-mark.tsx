"use client";

import { motion } from "framer-motion";

/**
 * The PaperGuard signature mark: a circular approval stamp, like the ones
 * moderators press onto a verified exam paper. Used on the homepage hero,
 * the loading screen (as a "stamping down" animation), and small verified
 * badges throughout the app.
 */
export function StampMark({
  size = 96,
  animate = true,
  className = "",
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      initial={animate ? { opacity: 0, y: -24, rotate: -14, scale: 0.9 } : undefined}
      animate={animate ? { opacity: 1, y: 0, rotate: -8, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
    >
      <circle cx="50" cy="50" r="46" className="stroke-primary" strokeWidth="3" fill="none" />
      <circle
        cx="50"
        cy="50"
        r="38"
        className="stroke-primary"
        strokeWidth="1.5"
        strokeDasharray="2.5 4"
        fill="none"
      />
      {/* corner ticks, like exam-paper crop marks */}
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="4"
          x2="50"
          y2="12"
          className="stroke-primary"
          strokeWidth="2.5"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <text
        x="50"
        y="49"
        textAnchor="middle"
        className="fill-primary font-display font-bold"
        style={{ fontSize: "22px" }}
      >
        PG
      </text>
      <text
        x="50"
        y="66"
        textAnchor="middle"
        className="fill-primary font-mono uppercase"
        style={{ fontSize: "7px", letterSpacing: "0.14em" }}
      >
        Verified
      </text>
    </motion.svg>
  );
}
