import type { Metadata } from "next";
import "@/styles/admin.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  title: "Quản trị hệ thống",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
