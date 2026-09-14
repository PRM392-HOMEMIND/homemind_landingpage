"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Brand from "../common/Brand";
import { mainNav } from "@/config/navigation";
import Container from "../common/Container";
import AppStoreLink from "../common/AppStoreLink";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "py-3 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)]"
            : "py-4 bg-white/95 backdrop-blur-md"
        }`}
      >
        <Container className="flex items-center justify-between gap-4">
          <Brand />
          <nav aria-label="Điều hướng chính" className="hidden xl:flex items-center gap-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="whitespace-nowrap rounded-sm text-sm font-semibold text-slate-600 hover:text-primary-dark aria-[current=page]:text-primary-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-emerald-500 after:transition-all hover:after:w-full"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
            <AppStoreLink className="hidden sm:inline-flex py-2 px-4 text-xs font-bold whitespace-nowrap">
              Dùng thử miễn phí
            </AppStoreLink>
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Mở menu điều hướng"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              className="xl:hidden rounded-full p-2.5 text-slate-600 hover:text-primary-dark hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>
      <MobileMenu isOpen={isOpen} onClose={closeMenu} items={mainNav} />
    </>
  );
}
