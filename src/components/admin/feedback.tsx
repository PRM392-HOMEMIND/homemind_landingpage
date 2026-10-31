"use client";
import { useEffect, useState } from "react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { ApiError, retryDeadline } from "@/lib/admin-api/client";
import type { Meta } from "@/lib/admin-api/types";
import { date } from "@/lib/formatting/admin";
export function Loading({ label = "Đang tải dữ liệu…" }: { label?: string }) {
  return (
    <div className="hm-loading" role="status">
      <LoaderCircle size={20} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
export function Empty({
  filtered = false,
  children,
}: {
  filtered?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="hm-empty" role="status">
      <Inbox size={28} aria-hidden="true" />
      <strong>
        {filtered ? "Không có kết quả phù hợp" : "Chưa có bản ghi"}
      </strong>
      <p>
        {children ||
          (filtered
            ? "Thử thay đổi hoặc xóa bộ lọc."
            : "Máy chủ chưa có dữ liệu trong phạm vi này.")}
      </p>
    </div>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  const deadline =
    error instanceof ApiError ? Math.max(error.retryAt, retryDeadline()) : 0;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  return (
    <div className="hm-error" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <div>
        <strong>{error.message}</strong>
        {error instanceof ApiError && error.requestId && (
          <p>
            Mã yêu cầu: <span className="hm-id">{error.requestId}</span>
          </p>
        )}
        {retry && (
          <button
            className="hm-button hm-secondary"
            onClick={retry}
            disabled={remaining > 0}
          >
            {remaining > 0 ? `Thử lại sau ${remaining} giây` : "Thử lại"}
          </button>
        )}
      </div>
    </div>
  );
}
export function Snapshot({ meta }: { meta: Meta }) {
  return (
    <p className="hm-snapshot">
      Ảnh chụp: {date(meta.asOf)} · UTC+7 · {meta.version} ·{" "}
      {meta.freshness === "live_session"
        ? "Trạng thái phiên"
        : "Snapshot riêng của yêu cầu"}
      <span className="hm-request">Mã yêu cầu: {meta.requestId}</span>
    </p>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hm-page-heading">
      <div>
        <p className="hm-eyebrow">HOMEMIND / QUẢN TRỊ HỆ THỐNG</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="hm-tabs" aria-label="Các phần dữ liệu">
      {items.map((item) => (
        <button
          key={item.id}
          className={item.id === value ? "hm-tab hm-selected" : "hm-tab"}
          aria-current={item.id === value ? "page" : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
