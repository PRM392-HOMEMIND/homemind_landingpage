import type { Money } from "../admin-api/types";
export const unknown = "Chưa có dữ liệu";
export function money(value: Money): string {
  return `${BigInt(value.amount).toLocaleString("vi-VN")} ₫`;
}
export function quantity(value: string | null): string {
  return value === null ? unknown : value;
}
export function date(
  value: string | null,
  timezone = "Asia/Ho_Chi_Minh",
): string {
  if (value === null) return unknown;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value))
    return value.split("-").reverse().join("/");
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
// Scale only chart coordinates to <= 10,000; exact money remains in labels.
export function moneyCoordinate(amount: string, maximum: string): number {
  const max = BigInt(maximum);
  return max === BigInt(0)
    ? 0
    : Number((BigInt(amount) * BigInt(10000)) / max) / 10000;
}
