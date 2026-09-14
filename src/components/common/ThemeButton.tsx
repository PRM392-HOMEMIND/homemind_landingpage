"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export type ThemeButtonVariant = "primary" | "secondary" | "glass";

export function themeButtonClassName(variant: ThemeButtonVariant, className?: string) {
  return cn(
    "relative inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer overflow-hidden group",
    variant === "primary" && "bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:bg-emerald-600 hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]",
    variant === "secondary" && "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50",
    variant === "glass" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100",
    className
  );
}

interface ThemeButtonProps extends Omit<HTMLMotionProps<"button">, "variant" | "children"> {
  variant?: ThemeButtonVariant;
  children?: React.ReactNode;
}

export default function ThemeButton({
  variant = "primary",
  className,
  children,
  ...props
}: ThemeButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={themeButtonClassName(variant, className)}
      {...props}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      )}
      {children}
    </motion.button>
  );
}
