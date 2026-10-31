"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowBadgeProps {
  text: string;
  className?: string;
}

export default function GlowBadge({ text, className }: GlowBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      {text}
    </motion.div>
  );
}
