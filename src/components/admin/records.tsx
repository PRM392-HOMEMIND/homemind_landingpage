"use client";
import Link from "next/link";
import { ActionMenu, type MenuAction } from "./action-menu";
import { money, date, unknown } from "@/lib/formatting/admin";
import { UUID_V4 } from "@/lib/admin-api/validation";
import { schemas } from "@/lib/admin-api/contract";
export const labels: Record<string, string> = {
  id: "Mã định danh",
  email: "Email",
  loginPhone: "Số điện thoại đăng nhập",
  contactPhone: "Số điện thoại liên hệ",
  displayName: "Tên hiển thị",
  address: "Địa chỉ",
  language: "Ngôn ngữ",
  status: "Trạng thái",
  createdAt: "Ngày tạo",
  updatedAt: "Ngày cập nhật",
  deletedAt: "Ngày đóng tài khoản",
  termsAcceptedAt: "Chấp thuận điều khoản",
  privacyAcceptedAt: "Chấp thuận chính sách bảo mật",
  lastExplicitLoginAt: "Đăng nhập tường minh gần nhất",
  lastLoginSource: "Nguồn thông tin đăng nhập",
  provenance: "Phân loại nguồn",
  name: "Tên",
  type: "Loại không gian",
  archivedAt: "Ngày lưu trữ",
  plan: "Gói sử dụng",
  source: "Nguồn gói",
  entitlementKnown: "Có dữ liệu quyền lợi",
  freeLifetimeAccess: "Quyền truy cập Free trọn đời",
  productLimit: "Giới hạn sản phẩm",
  productCount: "Sản phẩm chưa lưu trữ",
  grantId: "Mã quyền lợi",
  paidExpiresAt: "Hết bao phủ trả phí",
  membershipRole: "Vai trò thành viên",
  quota: "Quota dùng chung",
  workspaceId: "Không gian",
  userId: "Khách hàng",
  role: "Vai trò",
  payerId: "Người trả tiền gốc",
  orderCode: "Mã đơn",
  priceId: "Phiên bản giá đã mua",
  money: "Số tiền",
  amountPaid: "Số tiền đã xác minh",
  financialState: "Trạng thái tài chính",
  fulfillment: "Cấp quyền lợi",
  reviewReason: "Lý do cần kiểm tra",
  paidAt: "Thời điểm trả tiền",
  cancelledAt: "Thời điểm hủy",
  expiresAt: "Hết hạn (loại trừ)",
  attempts: "Số lần worker thực hiện",
  nextCheckAt: "Lần kiểm tra được lên lịch",
  completedSale: "Đơn mua gói hoàn tất",
  orderId: "Đơn thanh toán",
  reference: "Mã giao dịch xác minh",
  startsAt: "Bắt đầu (bao gồm)",
  originalExpiresAt: "Hạn gốc",
  supersededAt: "Thời điểm thay thế",
  supersededBy: "Quyền lợi thay thế",
  periodId: "Mã kỳ sử dụng",
  policyVersion: "Phiên bản chính sách",
  total: "Hạn mức",
  used: "Lượt đã dùng (committed)",
  reserved: "Lượt đang giữ chỗ",
  remaining: "Lượt còn lại",
  projectionOnly: "Kỳ dự kiến, chưa có row",
  actorId: "Người thực hiện",
  state: "Trạng thái sử dụng",
  completedAt: "Thời điểm hoàn thành",
  leaseUntil: "Hạn giữ chỗ",
  charged: "Đã tính lượt",
  kind: "Loại sự kiện",
  processingTimeMs: "Thời gian xử lý (ms)",
  errorCode: "Mã lỗi an toàn",
  committedAt: "Thời điểm committed",
  recipientId: "Người nhận",
  targetType: "Loại tài nguyên liên quan",
  targetId: "Mã tài nguyên liên quan",
  occurredAt: "Thời điểm sự kiện",
  deliveredAt: "Thời điểm giao",
  financial: "Thông báo tài chính",
  receivedAt: "Thời điểm nhận",
  readAt: "Khách hàng đọc lúc",
  requestId: "Mã yêu cầu",
  action: "Thao tác",
  outcome: "Kết quả",
  rowCount: "Số bản ghi đã trả",
  scopeHash: "Mã băm phạm vi",
  category: "Danh mục",
  unit: "Đơn vị",
  quantity: "Số lượng",
  nearestExpiry: "Hạn dùng gần nhất (ngày)",
  linkedProductId: "Sản phẩm liên kết",
  createdBy: "Người tạo",
  completedPurchases: "Đơn mua gói hoàn tất",
  completedSpending: "Chi tiêu hoàn tất",
  from: "Từ (bao gồm)",
  to: "Đến (loại trừ)",
  refunds: "Hoàn tiền",
  net: "Doanh thu ròng",
  refundAvailability: "Khả năng theo dõi hoàn tiền",
  sessionId: "Mã phiên",
  capabilities: "Quyền được cấp",
  idleSeconds: "Hạn không hoạt động (giây)",
  absoluteSeconds: "Hạn tuyệt đối (giây)",
  lastSeenAt: "Hoạt động phiên gần nhất",
  client: "Loại client",
  current: "Phiên hiện tại",
  bucketLocalStart: "Mốc lịch địa phương",
  completedSales: "Doanh số hoàn tất",
  signups: "Đăng ký mới",
  committedUsage: "Lượt AI committed",
  segment: "Phân khúc",
  workspaces: "Số không gian",
  purchases: "Số lần mua",
};
const vocabulary: Record<string, string> = {
  ACTIVE: "Hoạt động",
  DISABLED: "Vô hiệu hóa",
  DELETED: "Đã đóng",
  REAL: "Đã xác minh thực",
  SIMULATED_TEST: "Mô phỏng kiểm thử",
  UNCLASSIFIED_LEGACY: "Lịch sử chưa phân loại",
  free: "Free",
  personal: "Personal",
  family: "Family",
  micro_pos: "Micro POS",
  household: "Gia đình",
  store: "Cửa hàng",
  legacy_manual: "Cấp thủ công trước đây",
  billing: "Thanh toán",
  owner: "Chủ không gian",
  member: "Thành viên",
  UNPAID: "Chưa trả",
  PARTIAL: "Trả một phần",
  PAID: "Đã trả",
  REVIEW: "Cần kiểm tra",
  NONE: "Chưa cấp",
  GRANTED: "Đã cấp",
  PENDING: "Đang chờ",
  UNDERPAID: "Thiếu tiền",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  RESERVED: "Đang giữ chỗ",
  RELEASED: "Đã giải phóng",
  COMMITTED: "Đã tính lượt",
  SUCCESS: "Thành công",
  DENIED: "Từ chối",
  ERROR: "Lỗi",
  completed: "Hoàn thành",
  pending_confirmation: "Chờ xác nhận",
  committed: "Đã ghi nhận",
  cancelled: "Đã hủy",
  failed: "Thất bại",
  in_stock: "Còn hàng",
  out: "Hết hàng",
  needed: "Cần mua",
  bought: "Đã mua",
  skipped: "Đã bỏ qua",
  browser: "Trình duyệt",
  other: "Khác",
  UNAVAILABLE: "Chưa được hỗ trợ",
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
  "account.login outbox; null means unknown":
    "Sự kiện đăng nhập tường minh; chưa có dữ liệu nếu không ghi nhận",
};
export function word(value: string) {
  return vocabulary[value] || value;
}
export function record(value: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value));
}
export function ResourceLink({
  kind,
  id,
  compact = true,
}: {
  kind: "khach-hang" | "khong-gian" | "thanh-toan" | "thong-bao" | "nhat-ky";
  id: string;
  compact?: boolean;
}) {
  return UUID_V4.test(id) ? (
    <Link
      prefetch={false}
      className="hm-id hm-link"
      href={`/bang-dieu-khien/${kind}/${id}`}
      title={id}
    >
      {compact ? `${id.slice(0, 8)}…` : id}
    </Link>
  ) : (
    <span className="hm-id">{id}</span>
  );
}
export function Value({
  field,
  value,
  compact = false,
}: {
  field: string;
  value: unknown;
  compact?: boolean;
}) {
  if (value === null)
    return (
      <span className="hm-muted">
        {(
          {
            productLimit: "Không giới hạn",
            refunds: "Chưa được hỗ trợ",
            net: "Chưa được hỗ trợ",
            paidExpiresAt: "Không có bao phủ trả phí",
            archivedAt: "Chưa lưu trữ",
            deletedAt: "Chưa đóng tài khoản",
            readAt: "Chưa đọc",
            supersededAt: "Chưa bị thay thế",
            supersededBy: "Chưa bị thay thế",
          } as Record<string, string>
        )[field] || unknown}
      </span>
    );
  if (value === undefined) return <span className="hm-muted">{unknown}</span>;
  if (typeof value === "boolean")
    return (
      <span className={value ? "hm-badge" : "hm-badge hm-neutral"}>
        {value ? "Có" : "Không"}
      </span>
    );
  if (typeof value === "number")
    return <span className="hm-number">{value.toLocaleString("vi-VN")}</span>;
  if (typeof value === "object") {
    if (
      "currency" in value &&
      value.currency === "VND" &&
      "amount" in value &&
      typeof value.amount === "string"
    )
      return (
        <span className="hm-money">
          {money({ currency: "VND", amount: value.amount })}
        </span>
      );
    if (Array.isArray(value))
      return <span>{value.map(String).join(", ") || "Không có"}</span>;
    return (
      <dl className="hm-inline-definition">
        {Object.entries(value).map(([key, child]) => (
          <div key={key}>
            <dt>{labels[key] || word(key)}</dt>
            <dd>
              <Value field={key} value={child} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  const string = String(value);
  if (["workspaceId"].includes(field))
    return <ResourceLink kind="khong-gian" id={string} compact={compact} />;
  if (["userId", "payerId", "recipientId", "createdBy"].includes(field))
    return <ResourceLink kind="khach-hang" id={string} compact={compact} />;
  if (field === "orderId")
    return <ResourceLink kind="thanh-toan" id={string} compact={compact} />;
  if (
    /At$/.test(field) ||
    ["from", "to", "leaseUntil", "nearestExpiry"].includes(field)
  )
    return <span>{date(string)}</span>;
  if (field === "bucketLocalStart")
    return <span>{string.replace("T", " ")}</span>;
  if (
    [
      "status",
      "state",
      "financialState",
      "fulfillment",
      "provenance",
      "plan",
      "role",
      "membershipRole",
      "outcome",
      "source",
      "type",
      "client",
    ].includes(field)
  )
    return (
      <span
        className={
          [
            "REVIEW",
            "ERROR",
            "UNCLASSIFIED_LEGACY",
            "PARTIAL",
            "SIMULATED_TEST",
          ].includes(string)
            ? "hm-badge hm-warning"
            : "hm-badge hm-neutral"
        }
      >
        {word(string)}
      </span>
    );
  if (/Id$/.test(field) || field === "id" || field === "scopeHash")
    return (
      <span className="hm-id" title={compact ? string : undefined}>
        {compact && string.length > 16 ? `${string.slice(0, 8)}…` : string}
      </span>
    );
  return <span>{word(string)}</span>;
}
export function RecordDetails({
  schema,
  value,
}: {
  schema: string;
  value: object;
}) {
  const data = record(value);
  return (
    <dl className="hm-details">
      {Object.keys(schemas[schema].properties || {}).map((field) => (
        <div
          className={
            typeof data[field] === "object" &&
            data[field] !== null &&
            !("currency" in (data[field] as object))
              ? "hm-detail-wide"
              : ""
          }
          key={field}
        >
          <dt>{labels[field] || field}</dt>
          <dd>
            <Value field={field} value={data[field]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
export const tableFields: Record<string, string[]> = {
  Customer: [
    "displayName",
    "email",
    "loginPhone",
    "contactPhone",
    "status",
    "provenance",
    "createdAt",
  ],
  Workspace: [
    "name",
    "type",
    "archivedAt",
    "plan",
    "source",
    "productCount",
    "productLimit",
    "provenance",
    "membershipRole",
  ],
  Member: ["userId", "role", "createdAt"],
  Payment: [
    "orderCode",
    "payerId",
    "workspaceId",
    "money",
    "amountPaid",
    "status",
    "financialState",
    "fulfillment",
    "completedSale",
    "provenance",
    "paidAt",
  ],
  Transaction: ["reference", "money", "paidAt"],
  Entitlement: [
    "workspaceId",
    "orderId",
    "plan",
    "startsAt",
    "expiresAt",
    "originalExpiresAt",
    "supersededAt",
    "supersededBy",
  ],
  Period: [
    "workspaceId",
    "plan",
    "policyVersion",
    "startsAt",
    "expiresAt",
    "total",
    "used",
  ],
  UsageRequest: [
    "workspaceId",
    "actorId",
    "state",
    "charged",
    "createdAt",
    "completedAt",
    "leaseUntil",
  ],
  Turn: [
    "workspaceId",
    "actorId",
    "kind",
    "status",
    "processingTimeMs",
    "errorCode",
    "createdAt",
    "committedAt",
  ],
  Notification: [
    "recipientId",
    "workspaceId",
    "kind",
    "financial",
    "occurredAt",
    "receivedAt",
    "readAt",
  ],
  Activity: ["workspaceId", "kind", "occurredAt", "deliveredAt", "attempts"],
  Audit: [
    "action",
    "outcome",
    "actorId",
    "rowCount",
    "occurredAt",
    "requestId",
  ],
  Inventory: [
    "name",
    "category",
    "quantity",
    "unit",
    "status",
    "nearestExpiry",
    "archivedAt",
  ],
  Shopping: ["name", "quantity", "unit", "status", "source", "createdBy"],
  TrendItem: [
    "bucketLocalStart",
    "completedSales",
    "signups",
    "committedUsage",
  ],
  PlanDistributionItem: ["segment", "plan", "workspaces"],
  TopPayingItem: ["payerId", "purchases", "money"],
};
const detailRoutes: Record<string, MenuAction["href"]> = {
  Customer: "/bang-dieu-khien/khach-hang",
  Workspace: "/bang-dieu-khien/khong-gian",
  Payment: "/bang-dieu-khien/thanh-toan",
  Notification: "/bang-dieu-khien/thong-bao",
  Audit: "/bang-dieu-khien/nhat-ky",
};
export function RecordTable({
  schema,
  items,
}: {
  schema: string;
  items: object[];
}) {
  const fields = tableFields[schema] || [];
  return (
    <div
      className="hm-table-scroll"
      role="region"
      aria-label="Bảng dữ liệu, có thể cuộn ngang"
      tabIndex={0}
    >
      <table className="hm-table">
        <thead>
          <tr>
            {fields.map((field) => (
              <th
                className={
                  [
                    "money",
                    "amountPaid",
                    "workspaces",
                    "purchases",
                    "used",
                    "total",
                    "processingTimeMs",
                    "quantity",
                    "productCount",
                    "productLimit",
                  ].includes(field)
                    ? "hm-align-right"
                    : ""
                }
                key={field}
                scope="col"
              >
                {labels[field] || field}
              </th>
            ))}
            <th scope="col">
              <span className="hm-sr-only">Thao tác xem</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const row = record(item);
            const id = String(row.id || row.reference || index);
            const actions: MenuAction[] = [];
            if (detailRoutes[schema] && UUID_V4.test(id))
              actions.push({
                label: "Xem chi tiết",
                href: `${detailRoutes[schema]}/${id}`,
              });
            if (typeof row.workspaceId === "string")
              actions.push({
                label: "Xem không gian",
                href: `/bang-dieu-khien/khong-gian/${row.workspaceId}`,
              });
            const customer = row.payerId || row.userId || row.recipientId;
            if (typeof customer === "string")
              actions.push({
                label:
                  schema === "Payment"
                    ? "Xem người trả tiền"
                    : "Xem khách hàng",
                href: `/bang-dieu-khien/khach-hang/${customer}`,
              });
            if (typeof row.orderId === "string")
              actions.push({
                label: "Xem đơn thanh toán",
                href: `/bang-dieu-khien/thanh-toan/${row.orderId}`,
              });
            return (
              <tr key={id}>
                {fields.map((field) => (
                  <td
                    className={
                      [
                        "money",
                        "amountPaid",
                        "workspaces",
                        "purchases",
                        "used",
                        "total",
                        "processingTimeMs",
                        "quantity",
                        "productCount",
                        "productLimit",
                      ].includes(field)
                        ? "hm-align-right"
                        : ""
                    }
                    key={field}
                  >
                    <Value field={field} value={row[field]} compact />
                  </td>
                ))}
                <td>
                  {actions.length > 0 && (
                    <ActionMenu
                      label={`Thao tác bản ghi ${index + 1}`}
                      actions={actions}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
