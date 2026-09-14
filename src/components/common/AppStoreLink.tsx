"use client";

import { motion } from "framer-motion";
import { APP_STORE_URL } from "@/config/app-links";
import { themeButtonClassName, type ThemeButtonVariant } from "./ThemeButton";

interface AppStoreLinkProps {
  children: React.ReactNode;
  variant?: ThemeButtonVariant;
  className?: string;
  onClick?: () => void;
}

export default function AppStoreLink({ children, variant = "primary", className, onClick }: AppStoreLinkProps) {
  return (
    <motion.a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Tải HomeMind trên App Store (mở trong tab mới)"
      onClick={onClick}
      whileHover={{ scale: 1.02, translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={themeButtonClassName(variant, className)}
    >
      {variant === "primary" && <span aria-hidden="true" className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />}
      {children}
    </motion.a>
  );
}
