import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const rawInput = await readFile(
  new URL("../docs/HOMEMIND_ADMIN_OPENAPI.json", import.meta.url),
  "utf8",
);
const input=rawInput.replaceAll('\r\n','\n');
const document = JSON.parse(input);
const groups = [
  [["adminCsrf", "adminLogin"], "/dang-nhap; phục hồi CSRF"],
  [["adminMe", "adminMeta"], "guard; mọi module; phien-dang-nhap"],
  [
    [
      "adminRefresh",
      "adminLogout",
      "adminLogoutAll",
      "adminSessions",
      "adminRevokeSession",
    ],
    "phien-dang-nhap / menu tài khoản",
  ],
  [
    [
      "adminOverview",
      "adminTrends",
      "adminPlanDistribution",
      "adminTopPayingUsers",
    ],
    "/bang-dieu-khien",
  ],
  [["adminUsers"], "khach-hang"],
  [
    [
      "adminUser",
      "adminUserWorkspaces",
      "adminUserSpending",
      "adminUserActivity",
    ],
    "khach-hang/:userId; các tab",
  ],
  [["adminWorkspaces"], "khong-gian; picker usage"],
  [
    [
      "adminWorkspace",
      "adminWorkspaceMembers",
      "adminWorkspaceInventory",
      "adminWorkspaceShopping",
    ],
    "khong-gian/:workspaceId; các tab",
  ],
  [["adminPayments"], "thanh-toan; related customer"],
  [
    ["adminPayment", "adminPaymentTransactions"],
    "thanh-toan/:paymentId; các tab",
  ],
  [["adminEntitlements"], "goi-su-dung; workspace/payment grants"],
  [
    [
      "adminCurrentUsage",
      "adminUsagePeriods",
      "adminUsageRequests",
      "adminUsageTurns",
    ],
    "su-dung-ai; related customer/workspace",
  ],
  [
    ["adminNotifications", "adminNotification"],
    "thong-bao; thong-bao/:notificationId",
  ],
  [["adminOperations"], "van-hanh"],
  [["adminAuditLogs", "adminAuditLog"], "nhat-ky; nhat-ky/:entryId"],
];
const operations = [];
for (const [path, methods] of Object.entries(document.paths))
  for (const [method, operation] of Object.entries(methods)) {
    const id = operation.operationId;
    const destination = groups.find(([ids]) => ids.includes(id))?.[1];
    if (!destination) throw Error("Unmapped operation " + id);
    const schema = operation.responses["200"].content[
      "application/json"
    ].schema.properties.data.$ref
      .split("/")
      .at(-1);
    const queries = operation.parameters
      .filter((p) => p.in === "query")
      .map((p) => p.name + (p.required ? " (bắt buộc)" : ""));
    const paths = operation.parameters
      .filter((p) => p.in === "path")
      .map((p) => p.name);
    const live = ["adminPayment", "adminPaymentTransactions"].includes(id)
      ? "BLOCKED_DATA"
      : id === "adminLogoutAll"
        ? "NOT_RUN_NOT_ISOLATED"
        : id==='adminLogout' ? "PASS_LIVE (UI)" : "PASS_LIVE";
    operations.push(
      `| ${id} | ${method.toUpperCase()} ${path} | ${schema} | ${queries.join(", ") || "Không"} | ${operation.security.length ? "SYSTEM_ADMIN" : "CSRF/login public"}${paths.length ? "; UUIDv4 " + paths.join(", ") : ""}${method !== "get" ? "; Origin + CSRF" : ""} | ${destination} | ${live} |`,
    );
  }
if (operations.length !== 36) throw Error("Expected 36 operations");
const text = `# HomeMind — API / UI matrix

Normalized source checksum (LF; SHA256): ${createHash("sha256").update(input).digest("hex")}. 36/36 operations đã triển khai. Routes ngắn bên dưới nằm dưới /bang-dieu-khien, trừ /dang-nhap. Evidence 2026-10-07: Chromium actual API + UI candidate; không có business mock. Coverage dưới đây là fresh happy-path status/schema khi thực sự quan sát được, không phải dữ liệu ví dụ của hợp đồng.

| Operation | Method / path đầy đủ | data schema | Query allowlist | Auth / path / mutation | UI | Bằng chứng |
| --- | --- | --- | --- | --- | --- | --- |
${operations.join("\n")}

OPTIONS /v1/admin/*: technical204; Chromium CDP quan sát preflight login thực với allow-origin đúng https://homemind.vn và allow-credentials=true. Không tạo business screen.

## Quy tắc wire và trình bày

- Success {data,meta}, error {error:{code,message,requestId,fields?}}; validator từ 51 schemas, không coercion. Meta version phải admin-v1. RequestId/asOf/freshness riêng từng response; không gom thành snapshot chung.
- Nullable là giá trị thật: thiếu profile = chưa biết; productLimit null = không giới hạn; archivedAt/readAt/supersededAt null = chưa lưu trữ/chưa đọc/chưa thay thế; refunds/net null = chưa hỗ trợ. Field required vẫn phải tồn tại.
- OpenAPI additionalProperties:false so với Markdown cho phép additions: runtime giữ chặt declared fields/type/version nhưng chấp nhận additive fields; UI chỉ render declared fields. Đây là quyết định theo hai nguồn được ghi rõ, không sửa contract.
- Output date-time RFC3339 gồm offset/microseconds hợp lệ; query thời gian UTC Z theo Markdown, paired from/to tăng dần tối đa366 ngày. Date-only dùng lịch, không parse sang timezone khác. Dashboard picker hỗ trợ UTC+7/UTC, end-exclusive.
- UUIDv4 cho path/context; context query không mâu thuẫn path. Enum normative và vocabulary meta; bool string true/false, limit1..100, q trim≤120 chỉ endpoint khai báo, kind lowercase≤80. Bỏ unset, không gửi GET body/query lạ.
- Page limit,hasMore,nextCursor, không totalCount/offset; scope đổi reset cursor, có nút về đầu khi cursor error; grant payment đối chiếu orderId tại client trên toàn bộ các trang đọc theo workspaceId.
- Money VND integer string → BigInt/locale; amountPaid khác money; quantity decimal string. Chỉ chart coordinate scale bằng BigInt ở biên SVG; bảng số liệu giữ nguyên giá trị thực.

## Business mapping cần giữ

| Nhóm | Ngữ nghĩa UI |
| --- | --- |
| Overview | allRecords khác total theo scope; provenance counts riêng customer/workspace/order; ACTIVE không online; date chỉ áp dụng window metrics |
| Financial | completedSale = PAID + GRANTED, completedSales theo paid_at và giá snapshot; verifiedReceipts theo transaction thời điểm nhận; attention hiện tại/lifetime; không tự tính refund/net/growth |
| Customer | loginPhone khác contactPhone; lastExplicitLoginAt là login tường minh, không refresh; payer là người tạo đơn gốc, khác membership/current owner |
| Workspace | current coverage quyết định plan/source; quota dùng chung, fixed30-day period, Free access lifetime nhưng quota AI hữu hạn; projectionOnly chưa persisted, entitlementKnown=false phải cảnh báo |
| Entitlement | history có thể expired/superseded, không suy active bằng starts/expires riêng; giữ originalExpiresAt và supersededBy |
| Usage | RESERVED/RELEASED/COMMITTED khác nhau; historical plan theo kỳ; chỉ metadata, không AI text; không tạo/reset period khi xem |
| Notification | readAt do customer ghi nhận; mở admin detail không đánh dấu read, không resend |
| Operations | Snapshot toàn hệ thống không query; số0 không chứng minh provider healthy; online/provider unsupported hiện rõ |
| Audit | Metadata an toàn, không raw query/PII/token, không polling; đọc privileged phải audit fail-closed ở backend |
| Auth/session | 15min idle/8h absolute; refresh không kéo absolute, rotate cookie/CSRF, serialize tabs; chỉ revoke session task trong tests, logout-all không chạy khi không isolated |

## Coverage chưa có môi trường

Payment detail/transactions không có record; partial/review/superseded cases, pagination next/filter-bound cursor expiry, 409/429/503/audit-failure và logout-all chưa có isolated real backend. Không thay dữ liệu production để đạt coverage. Chi tiết checkpoint và defect trong report/register. Unit evidence là pure-input riêng, không gọi PASS_LIVE.
`;
await writeFile(
  new URL("../docs/HOMEMIND_ADMIN_FRONTEND_API_UI_MATRIX.md", import.meta.url),
  text,
);
console.log("Documented 36 operation mappings; no credential input.");
