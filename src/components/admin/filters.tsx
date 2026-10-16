"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Filter, Search } from "lucide-react";
import { operations, type OperationId } from "@/lib/admin-api/contract";
import {
  buildUrl,
  dateBoundary,
  enums,
  statusValues,
  type PathParams,
  type Query,
} from "@/lib/admin-api/validation";
import { useSession } from "@/features/admin-auth/use-session";
import { labels, word } from "./records";
import { Failure } from "./feedback";
const filterLabels: Record<string, string> = {
  ...labels,
  q: "Tìm tên, email, số điện thoại hoặc UUID",
  limit: "Bản ghi / trang",
  sort: "Thứ tự",
  paying: "Đã mua gói REAL trong lịch sử",
  archived: "Đã lưu trữ",
  read: "Khách hàng đã đọc",
  adminId: "Mã quản trị viên",
  timezone: "Múi giờ báo cáo",
  bucket: "Nhóm xu hướng",
};
export function Filters({
  operation,
  query,
  params = {},
  onChange,
  locked = [],
}: {
  operation: OperationId;
  query: Query;
  params?: PathParams;
  onChange: (query: Query) => void;
  locked?: string[];
}) {
  const session = useSession();
  const prefix = useId();
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState(query.q || "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const allowed = (operations[operation].query as readonly string[]).filter(
    (key) => key !== "cursor" && key !== "q" && !locked.includes(key),
  );
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    const form = new FormData(event.currentTarget);
    const next: Query = {};
    for (const field of locked) next[field] = query[field];
    if (
      (operations[operation].query as readonly string[]).includes("q") &&
      search.trim()
    )
      next.q = search.trim();
    try {
      for (const key of allowed) {
        const value = String(form.get(key) || "");
        if (value) next[key] = value;
      }
      if (next.from)
        next.from = dateBoundary(
          next.from,
          next.timezone || "Asia/Ho_Chi_Minh",
        );
      if (next.to)
        next.to = dateBoundary(next.to, next.timezone || "Asia/Ho_Chi_Minh");
      buildUrl(operation, params, next, session.vocabulary?.orderStatuses);
      setError(null);
      onChange(next);
    } catch (failure) {
      setError(failure as Error);
    }
  }
  function options(key: string): readonly string[] {
    if (key === "status")
      return operation === "adminPayments"
        ? session.vocabulary?.orderStatuses || []
        : statusValues(operation);
    if (key === "plan") return session.vocabulary?.plans || enums.plan;
    if (key === "segment") return session.vocabulary?.segments || enums.segment;
    if (key === "provenance")
      return session.vocabulary?.provenances || enums.provenance;
    if (key === "timezone")
      return session.vocabulary?.timezones || enums.timezone;
    return enums[key] || [];
  }
  const pickerValue = (value: string | undefined) => {
    if (!value) return "";
    const offset = query.timezone === "UTC" ? 0 : 7 * 3600000;
    return new Date(Date.parse(value) + offset).toISOString().slice(0, 10);
  };
  return (
    <div className="hm-filter-wrap">
      {"q" in query ||
      (operations[operation].query as readonly string[]).includes("q") ? (
        <div className="hm-search">
          <Search size={18} aria-hidden="true" />
          <label className="hm-sr-only" htmlFor={`${prefix}-q`}>
            Tìm khách hàng
          </label>
          <input
            id={`${prefix}-q`}
            type="search"
            maxLength={120}
            value={search}
            placeholder="Tìm tên, email, số điện thoại hoặc UUID…"
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => {
                const next = { ...query, q: value.trim(), cursor: undefined };
                onChange(next);
              }, 600);
            }}
          />
        </div>
      ) : null}
      <details className="hm-filters" open>
        <summary>
          <Filter size={16} aria-hidden="true" />
          Bộ lọc và phạm vi
        </summary>
        <form key={JSON.stringify(query)} onSubmit={submit}>
          <div className="hm-filter-grid">
            {allowed.map((key) => {
              const values = options(key);
              return (
                <label key={key} htmlFor={`${prefix}-${key}`}>
                  <span>
                    {key === "from"
                      ? "Từ ngày (bao gồm)"
                      : key === "to"
                        ? "Đến ngày (không gồm)"
                        : filterLabels[key] || key}
                  </span>
                  {values.length ? (
                    <select
                      name={key}
                      id={`${prefix}-${key}`}
                      defaultValue={query[key] || ""}
                    >
                      <option value="">
                        {key === "timezone"
                          ? "UTC+7 (mặc định)"
                          : key === "bucket"
                            ? "Ngày (mặc định)"
                            : key === "sort"
                              ? "Mới nhất (mặc định)"
                              : "Tất cả / mặc định"}
                      </option>
                      {values.map((value) => (
                        <option key={value} value={value}>
                          {value === "true"
                            ? "Có"
                            : value === "false"
                              ? "Không"
                              : value === "newest"
                                ? "Mới nhất"
                                : value === "oldest"
                                  ? "Cũ nhất"
                                  : value === "day"
                                    ? "Ngày"
                                    : value === "week"
                                      ? "Tuần"
                                      : value === "month"
                                        ? "Tháng"
                                        : word(value)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={key}
                      id={`${prefix}-${key}`}
                      type={
                        key === "limit"
                          ? "number"
                          : key === "from" || key === "to"
                            ? "date"
                            : "text"
                      }
                      defaultValue={
                        key === "from" || key === "to"
                          ? pickerValue(query[key])
                          : query[key] || ""
                      }
                      min={key === "limit" ? 1 : undefined}
                      max={key === "limit" ? 100 : undefined}
                      maxLength={key === "kind" ? 80 : undefined}
                      placeholder={
                        key.endsWith("Id")
                          ? "UUID v4"
                          : key === "limit"
                            ? "25"
                            : undefined
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
          <div className="hm-filter-actions">
            <span>
              Ngày được chuyển từ {query.timezone === "UTC" ? "UTC" : "UTC+7"}{" "}
              sang UTC; khoảng [từ, đến).
            </span>
            <button
              type="button"
              className="hm-button hm-secondary"
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                setSearch("");
                setError(null);
                onChange(
                  Object.fromEntries(locked.map((key) => [key, query[key]])),
                );
              }}
            >
              Xóa bộ lọc
            </button>
            <button className="hm-button hm-primary" type="submit">
              Áp dụng
            </button>
          </div>
        </form>
      </details>
      {error && <Failure error={error} />}
    </div>
  );
}
