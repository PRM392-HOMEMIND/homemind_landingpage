import { operations, schemas, type OperationId } from "./contract";
import { validateSchema } from "./schema";
export type Query = Record<string, string | undefined>;
export type PathParams = Record<string, string>;
export const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class InputError extends Error {}
export const enums: Record<string, readonly string[]> = {
  provenance: ["REAL", "SIMULATED_TEST", "UNCLASSIFIED_LEGACY"],
  plan: ["free", "personal", "family", "micro_pos"],
  segment: ["household", "store"],
  sort: ["newest", "oldest"],
  paying: ["true", "false"],
  archived: ["true", "false"],
  read: ["true", "false"],
  financialState: ["UNPAID", "PARTIAL", "PAID", "REVIEW"],
  fulfillment: ["NONE", "GRANTED", "REVIEW"],
  state: ["RESERVED", "RELEASED", "COMMITTED"],
  outcome: ["SUCCESS", "DENIED", "ERROR"],
  timezone: ["Asia/Ho_Chi_Minh", "UTC"],
  bucket: ["day", "week", "month"],
};
export function statusValues(id: OperationId): readonly string[] {
  if (id === "adminUsers") return ["ACTIVE", "DISABLED", "DELETED"];
  if (id === "adminWorkspaceInventory") return ["in_stock", "out"];
  if (id === "adminWorkspaceShopping") return ["needed", "bought", "skipped"];
  if (id === "adminUsageTurns")
    return [
      "completed",
      "pending_confirmation",
      "committed",
      "cancelled",
      "failed",
    ];
  return []; // Payment status vocabulary comes from authenticated /meta.
}
export function validateUtc(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))
    throw new InputError("Thời gian lọc phải là UTC hợp lệ.");
  const time = Date.parse(value);
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 19) !== value.slice(0, 19)
  )
    throw new InputError("Ngày lọc không hợp lệ.");
  return time;
}
export function validateWindow(query: Query): void {
  if (!!query.from !== !!query.to)
    throw new InputError("Chọn cả thời điểm bắt đầu và kết thúc.");
  if (query.from && query.to) {
    const span = validateUtc(query.to) - validateUtc(query.from);
    if (span <= 0 || span > 366 * 86400000)
      throw new InputError(
        "Khoảng báo cáo phải tăng dần và không vượt quá 366 ngày.",
      );
  }
}
export function buildUrl(
  id: OperationId,
  params: PathParams = {},
  query: Query = {},
  paymentStatuses: readonly string[] = [],
): string {
  const op = operations[id];
  if (!op) throw new InputError("Thao tác chưa được hỗ trợ.");
  for (const key of Object.keys(params))
    if (!(op.params as readonly string[]).includes(key))
      throw new InputError("Ngữ cảnh đường dẫn không hợp lệ.");
  let path: string = op.path;
  for (const key of op.params) {
    if (!UUID_V4.test(params[key] || ""))
      throw new InputError("Mã tài nguyên phải là UUID phiên bản 4.");
    if (query[key] && query[key] !== params[key])
      throw new InputError("Bộ lọc không khớp tài nguyên đang xem.");
    path = path.replace(`{${key}}`, params[key]);
  }
  const url = new URL(path, "https://api.homemind.vn");
  for (const [key, raw] of Object.entries(query)) {
    if (!(op.query as readonly string[]).includes(key))
      throw new InputError("Bộ lọc không được hỗ trợ trên trang này.");
    if (raw === undefined || raw === "") continue;
    if (typeof raw !== "string")
      throw new InputError("Bộ lọc phải có một giá trị duy nhất.");
    const value = key === "q" ? raw.trim() : raw;
    if (key === "q" && value.length > 120)
      throw new InputError("Tìm kiếm tối đa 120 ký tự.");
    if (key === "cursor" && value.length > 2048)
      throw new InputError("Thông tin phân trang không hợp lệ.");
    if (key === "limit" && (!/^[1-9]\d*$/.test(value) || Number(value) > 100))
      throw new InputError("Cỡ trang từ 1 đến 100.");
    if (key.endsWith("Id") && !UUID_V4.test(value))
      throw new InputError("Mã bộ lọc phải là UUID phiên bản 4.");
    const values =
      key === "status"
        ? id === "adminPayments"
          ? paymentStatuses
          : statusValues(id)
        : enums[key];
    if (values && (values.length === 0 || !values.includes(value)))
      throw new InputError("Giá trị bộ lọc không được hỗ trợ.");
    if (
      key === "kind" &&
      (value.length > 80 || !/^[a-z][a-z0-9._]*$/.test(value))
    )
      throw new InputError(
        "Loại sự kiện dùng chữ thường, dấu chấm hoặc gạch dưới, tối đa 80 ký tự.",
      );
    if (value) url.searchParams.set(key, value);
  }
  for (const key of op.requiredQuery)
    if (!url.searchParams.has(key))
      throw new InputError(
        "Chọn không gian trước khi tải mức sử dụng hiện tại.",
      );
  validateWindow(query);
  return url.href;
}
export function normalizeLogin(email: string, password: string) {
  const body = { email: email.trim().toLowerCase(), password };
  try {
    validateSchema(schemas.AdminLoginDto, body, schemas);
  } catch {
    throw new InputError(
      "Email hợp lệ, tối đa 254 ký tự; mật khẩu từ 16 đến 128 ký tự.",
    );
  }
  return body;
}
// Picker dates represent local midnight in an explicit reporting timezone.
export function dateBoundary(value: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new InputError("Chọn ngày hợp lệ.");
  const date = `${value}T00:00:00.000${timezone === "UTC" ? "Z" : "+07:00"}`;
  const time = Date.parse(date);
  const offset = timezone === "UTC" ? 0 : 7 * 3600000;
  if (
    !Number.isFinite(time) ||
    new Date(time + offset).toISOString().slice(0, 10) !== value
  )
    throw new InputError("Chọn ngày hợp lệ.");
  return new Date(time).toISOString();
}
