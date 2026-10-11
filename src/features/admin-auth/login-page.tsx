"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import Brand from "@/components/common/Brand";
import { Failure, Loading } from "@/components/admin/feedback";
import { login, revalidate } from "@/lib/auth/admin-session";
import { ApiError, retryDeadline } from "@/lib/admin-api/client";
import { useSession } from "./use-session";
export default function LoginPage() {
  const session = useSession();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (session.phase === "authenticated") router.replace("/bang-dieu-khien");
  }, [session.phase, router]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError(null);
    try {
      if (Date.now() < retryDeadline())
        throw new ApiError(429, "CLIENT_RATE_WAIT", "", retryDeadline());
      await login(String(fields.get("email")), String(fields.get("password")));
      form.reset();
      router.replace("/bang-dieu-khien");
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.status === 401
          ? Object.assign(new Error("Email hoặc mật khẩu không đúng."), {
              name: "LoginError",
            })
          : (failure as Error),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="hm-admin hm-auth">
      <div className="hm-auth-brand">
        <Brand />
        <Link href="/" className="hm-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Về trang chủ
        </Link>
      </div>
      <section className="hm-login-card">
        <div className="hm-login-icon">
          <ShieldCheck size={28} aria-hidden="true" />
        </div>
        <p className="hm-eyebrow">QUẢN TRỊ HỆ THỐNG</p>
        <h1>Đăng nhập HomeMind</h1>
        <p className="hm-muted">
          Dành cho tài khoản quản trị hệ thống được cấp quyền.
        </p>
        {session.phase === "checking" || session.phase === "authenticated" ? (
          <Loading label="Đang kiểm tra phiên đăng nhập…" />
        ) : session.phase === "error" ? (
          <Failure error={session.error!} retry={() => void revalidate()} />
        ) : (
          <form onSubmit={submit} className="hm-login-form">
            <label htmlFor="admin-email">Email quản trị</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
              disabled={busy}
            />
            <label htmlFor="admin-password">Mật khẩu</label>
            <div className="hm-password">
              <input
                id="admin-password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                minLength={16}
                maxLength={128}
                required
                disabled={busy}
              />
              <button
                type="button"
                className="hm-icon-button"
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={show}
                onClick={() => setShow((value) => !value)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <Failure error={error} />}
            <button
              type="submit"
              className="hm-button hm-primary"
              disabled={busy}
            >
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
        )}
        <p className="hm-auth-note">
          Phiên tự kết thúc sau 15 phút không hoạt động và tối đa 8 giờ.
        </p>
      </section>
      <p className="hm-auth-footer">HomeMind · Smart Pantry, Fresh Life</p>
    </main>
  );
}
