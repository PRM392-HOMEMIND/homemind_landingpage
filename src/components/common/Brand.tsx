import Image from "next/image";
import Link from "next/link";
import logo from "@/app/logo.png";
import { siteConfig } from "@/config/site";

export default function Brand({ footer = false, onClick }: { footer?: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="HomeMind — Trang chủ"
      className="group inline-flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
    >
      {!footer && (
        <Image
          src={logo}
          alt="HomeMind logo"
          width={36}
          height={36}
          sizes="36px"
          priority
          className="h-9 w-9 shrink-0 object-contain"
        />
      )}
      <span className="flex flex-col items-start whitespace-nowrap">
        <span className={`text-xl font-extrabold leading-6 tracking-tight transition-colors ${footer ? "text-primary-dark" : "text-slate-800 group-hover:text-primary-dark group-focus-visible:text-primary-dark"}`}>
          {siteConfig.name}
        </span>
        <span className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500">
          {siteConfig.tagline}
        </span>
      </span>
    </Link>
  );
}
