"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  House,
  CreditCard,
  Layers,
  AudioLines,
  Bell,
  Activity,
  ScrollText,
  ShieldCheck,
  Menu,
  X,
  Gift,
} from "lucide-react";
import Brand from "@/components/common/Brand";
import { ActionMenu } from "@/components/admin/action-menu";
import { Confirmation } from "@/components/admin/confirmation";
import { Failure, Loading } from "@/components/admin/feedback";
import { useSession } from "@/features/admin-auth/use-session";
import { logout, revalidate } from "@/lib/auth/admin-session";
const destinations = [
  ["", "Tổng quan", LayoutDashboard],
  ["khach-hang", "Khách hàng", Users],
  ["khong-gian", "Không gian", House],
  ["thanh-toan", "Thanh toán", CreditCard],
  ["store-doi-soat", "Store và đối soát", CreditCard],
  ["goi-su-dung", "Gói sử dụng", Layers],
  ["phan-hoi-qua-tang", "Phản hồi và quà tặng", Gift],
  ["su-dung-ai", "Sử dụng AI", AudioLines],
  ["thong-bao", "Thông báo", Bell],
  ["van-hanh", "Vận hành", Activity],
  ["nhat-ky", "Nhật ký", ScrollText],
  ["phien-dang-nhap", "Phiên đăng nhập", ShieldCheck],
] as const;
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (session.phase === "guest") router.replace("/dang-nhap");
  }, [session.phase, router]);
  useEffect(() => {
    if (mobile) drawer.current?.showModal();
    else drawer.current?.close();
  }, [mobile]);
  const nav = (
    <nav aria-label="Điều hướng quản trị">
      {destinations.map(([slug, label, Icon]) => {
        const href = `/bang-dieu-khien${slug ? `/${slug}` : ""}`;
        const selected = slug ? pathname.startsWith(href) : pathname === href;
        return (
          <Link
            prefetch={false}
            href={href}
            key={href}
            aria-current={selected ? "page" : undefined}
            onClick={() => setMobile(false)}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
  if (session.phase !== "authenticated")
    return (
      <main className="hm-admin hm-guard">
        <Brand />
        {session.phase === "error" ? (
          <Failure error={session.error!} retry={() => void revalidate()} />
        ) : (
          <Loading label="Đang xác minh quyền truy cập…" />
        )}
        <Link href="/">Về trang chủ</Link>
      </main>
    );
  return (
    <div className="hm-admin hm-shell">
      <a className="hm-skip" href="#admin-main">
        Đến nội dung chính
      </a>
      <aside className="hm-sidebar">
        <Brand />
        <p className="hm-sidebar-label">QUẢN TRỊ HỆ THỐNG</p>
        {nav}
        <div className="hm-sidebar-note">
          <ShieldCheck size={18} />
          <p>
            Dữ liệu khách hàng chỉ đọc.
            <br />
            Thay đổi campaign cần xác nhận.
          </p>
        </div>
      </aside>
      <div className="hm-main-wrap">
        <header className="hm-header">
          <button
            className="hm-icon-button hm-mobile-toggle"
            aria-label="Mở điều hướng quản trị"
            onClick={() => setMobile(true)}
          >
            <Menu size={22} />
          </button>
          <span className="hm-header-title">Không gian quản trị</span>
          <div className="hm-header-account">
            <span className="hm-badge">SYSTEM_ADMIN</span>
            <ActionMenu
              label="Menu tài khoản quản trị"
              actions={[
                {
                  label: "Phiên đăng nhập",
                  href: "/bang-dieu-khien/phien-dang-nhap",
                },
                { label: "Về trang chủ", href: "/" },
                {
                  label: "Đăng xuất",
                  danger: true,
                  onClick: () => setConfirm(true),
                },
              ]}
            />
          </div>
        </header>
        <main id="admin-main" className="hm-main" tabIndex={-1}>
          {error && <Failure error={error} />}
          <div key={session.revision}>{children}</div>
        </main>
        <footer className="hm-footer">
          HomeMind · Dữ liệu trực tiếp từ hệ thống · admin-v1
        </footer>
      </div>
      <dialog
        ref={drawer}
        className="hm-admin hm-mobile-drawer"
        aria-label="Điều hướng quản trị"
        onCancel={() => setMobile(false)}
      >
        <div className="hm-drawer-top">
          <Brand />
          <button
            className="hm-icon-button"
            aria-label="Đóng điều hướng"
            onClick={() => setMobile(false)}
          >
            <X size={22} />
          </button>
        </div>
        {nav}
      </dialog>
      {confirm && (
        <Confirmation
          title="Đăng xuất phiên hiện tại?"
          description="Dữ liệu quản trị trong bộ nhớ sẽ được xóa. Bạn cần đăng nhập lại để tiếp tục."
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await logout();
            } catch (failure) {
              setError(failure as Error);
            } finally {
              setBusy(false);
              setConfirm(false);
            }
          }}
        />
      )}
    </div>
  );
}
