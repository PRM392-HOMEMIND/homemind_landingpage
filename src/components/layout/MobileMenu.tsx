"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NavItem } from "@/types";
import ThemeButton from "../common/ThemeButton";
import Brand from "../common/Brand";
import AppStoreLink from "../common/AppStoreLink";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export default function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const drawer = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const desktop = window.matchMedia("(min-width: 1280px)");
    const handleResize = () => { if (desktop.matches) onClose(); };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
      const focusable = Array.from(drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
        .filter(element => element.tabIndex >= 0 && element.getAttribute("aria-disabled") !== "true" && !element.closest("[inert], [hidden]") && element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible");
      if (!focusable.length) return;
      // Native WebKit Tab preferences can skip links. Own the complete dialog
      // order so Tab cannot escape between a link and the initial close button.
      const current = focusable.indexOf(document.activeElement as HTMLElement);
      const next = current < 0 ? (event.shiftKey ? focusable.length - 1 : 0) : (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    };
    document.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", handleResize);
      opener?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm xl:hidden"
          />
          {/* Drawer */}
          <motion.div
            data-lenis-prevent
            ref={drawer}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Menu HomeMind"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm overflow-y-auto bg-white p-6 shadow-xl border-l border-slate-100 xl:hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <Brand onClick={onClose} />
                <button
                  onClick={onClose}
                  aria-label="Đóng menu điều hướng"
                  className="rounded-full p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Điều hướng di động" className="flex flex-col gap-1">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="rounded-sm text-base font-semibold text-slate-600 hover:text-primary-dark aria-[current=page]:text-primary-dark transition-colors py-2.5 border-b border-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <ThemeButton className="w-full" variant="secondary" onClick={onClose}>
                Đăng nhập
              </ThemeButton>
              <AppStoreLink className="w-full" onClick={onClose}>
                Dùng thử miễn phí
              </AppStoreLink>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
