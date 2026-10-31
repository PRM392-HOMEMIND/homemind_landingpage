# HomeMind — API / UI matrix

Normalized source checksum (LF; SHA256): 284fd68a55088218617397c5da46aabbb3a6404aff4b650ffe11b0014b9e4eb7. 36/36 operations đã triển khai. Routes ngắn bên dưới nằm dưới /bang-dieu-khien, trừ /dang-nhap. Evidence 2026-10-07: Chromium actual API + UI candidate; không có business mock. Coverage dưới đây là fresh happy-path status/schema khi thực sự quan sát được, không phải dữ liệu ví dụ của hợp đồng.

| Operation | Method / path đầy đủ | data schema | Query allowlist | Auth / path / mutation | UI | Bằng chứng |
| --- | --- | --- | --- | --- | --- | --- |
| adminCsrf | GET /v1/admin/auth/csrf | Csrf | Không | CSRF/login public | /dang-nhap; phục hồi CSRF | PASS_LIVE |
| adminLogin | POST /v1/admin/auth/login | Login | Không | CSRF/login public; Origin + CSRF | /dang-nhap; phục hồi CSRF | PASS_LIVE |
| adminMe | GET /v1/admin/auth/me | Identity | Không | SYSTEM_ADMIN | guard; mọi module; phien-dang-nhap | PASS_LIVE |
| adminRefresh | POST /v1/admin/auth/refresh | Refresh | Không | SYSTEM_ADMIN; Origin + CSRF | phien-dang-nhap / menu tài khoản | PASS_LIVE |
| adminLogout | POST /v1/admin/auth/logout | Revoked | Không | SYSTEM_ADMIN; Origin + CSRF | phien-dang-nhap / menu tài khoản | PASS_LIVE (UI) |
| adminLogoutAll | POST /v1/admin/auth/logout-all | Revoked | Không | SYSTEM_ADMIN; Origin + CSRF | phien-dang-nhap / menu tài khoản | NOT_RUN_NOT_ISOLATED |
| adminSessions | GET /v1/admin/auth/sessions | Sessions | Không | SYSTEM_ADMIN | phien-dang-nhap / menu tài khoản | PASS_LIVE |
| adminRevokeSession | DELETE /v1/admin/auth/sessions/{sessionId} | Revoked | Không | SYSTEM_ADMIN; UUIDv4 sessionId; Origin + CSRF | phien-dang-nhap / menu tài khoản | PASS_LIVE |
| adminMeta | GET /v1/admin/meta | Vocabulary | Không | SYSTEM_ADMIN | guard; mọi module; phien-dang-nhap | PASS_LIVE |
| adminOverview | GET /v1/admin/dashboard/overview | Overview | from, to, provenance, timezone | SYSTEM_ADMIN | /bang-dieu-khien | PASS_LIVE |
| adminTrends | GET /v1/admin/dashboard/trends | Trends | from, to, provenance, timezone, bucket | SYSTEM_ADMIN | /bang-dieu-khien | PASS_LIVE |
| adminPlanDistribution | GET /v1/admin/dashboard/plan-distribution | PlanDistribution | Không | SYSTEM_ADMIN | /bang-dieu-khien | PASS_LIVE |
| adminTopPayingUsers | GET /v1/admin/dashboard/top-paying-users | TopPayingUsers | from, to, provenance, timezone, limit | SYSTEM_ADMIN | /bang-dieu-khien | PASS_LIVE |
| adminUsers | GET /v1/admin/users | CustomerPage | limit, cursor, sort, from, to, status, q, segment, plan, paying, provenance | SYSTEM_ADMIN | khach-hang | PASS_LIVE |
| adminUser | GET /v1/admin/users/{userId} | Customer | Không | SYSTEM_ADMIN; UUIDv4 userId | khach-hang/:userId; các tab | PASS_LIVE |
| adminUserWorkspaces | GET /v1/admin/users/{userId}/workspaces | WorkspacePage | userId, limit, cursor, sort, from, to, segment, plan, archived, provenance | SYSTEM_ADMIN; UUIDv4 userId | khach-hang/:userId; các tab | PASS_LIVE |
| adminUserSpending | GET /v1/admin/users/{userId}/spending | Spending | from, to, provenance | SYSTEM_ADMIN; UUIDv4 userId | khach-hang/:userId; các tab | PASS_LIVE |
| adminUserActivity | GET /v1/admin/users/{userId}/activity | ActivityPage | userId, limit, cursor, sort, from, to, workspaceId, kind | SYSTEM_ADMIN; UUIDv4 userId | khach-hang/:userId; các tab | PASS_LIVE |
| adminWorkspaces | GET /v1/admin/workspaces | WorkspacePage | limit, cursor, sort, from, to, segment, plan, archived, userId, provenance | SYSTEM_ADMIN | khong-gian; picker usage | PASS_LIVE |
| adminWorkspace | GET /v1/admin/workspaces/{workspaceId} | Workspace | Không | SYSTEM_ADMIN; UUIDv4 workspaceId | khong-gian/:workspaceId; các tab | PASS_LIVE |
| adminWorkspaceMembers | GET /v1/admin/workspaces/{workspaceId}/members | MemberPage | workspaceId, limit, cursor, sort, from, to, userId | SYSTEM_ADMIN; UUIDv4 workspaceId | khong-gian/:workspaceId; các tab | PASS_LIVE |
| adminWorkspaceInventory | GET /v1/admin/workspaces/{workspaceId}/inventory | InventoryPage | workspaceId, limit, cursor, sort, from, to, status | SYSTEM_ADMIN; UUIDv4 workspaceId | khong-gian/:workspaceId; các tab | PASS_LIVE |
| adminWorkspaceShopping | GET /v1/admin/workspaces/{workspaceId}/shopping | ShoppingPage | workspaceId, limit, cursor, sort, from, to, status | SYSTEM_ADMIN; UUIDv4 workspaceId | khong-gian/:workspaceId; các tab | PASS_LIVE |
| adminPayments | GET /v1/admin/payments | PaymentPage | limit, cursor, sort, from, to, status, financialState, fulfillment, provenance, userId, workspaceId | SYSTEM_ADMIN | thanh-toan; related customer | PASS_LIVE |
| adminPayment | GET /v1/admin/payments/{paymentId} | Payment | Không | SYSTEM_ADMIN; UUIDv4 paymentId | thanh-toan/:paymentId; các tab | BLOCKED_DATA |
| adminPaymentTransactions | GET /v1/admin/payments/{paymentId}/transactions | TransactionPage | limit, cursor | SYSTEM_ADMIN; UUIDv4 paymentId | thanh-toan/:paymentId; các tab | BLOCKED_DATA |
| adminEntitlements | GET /v1/admin/entitlements | EntitlementPage | limit, cursor, sort, from, to, workspaceId, userId, plan | SYSTEM_ADMIN | goi-su-dung; workspace/payment grants | PASS_LIVE |
| adminCurrentUsage | GET /v1/admin/usage/current | Workspace | workspaceId (bắt buộc) | SYSTEM_ADMIN | su-dung-ai; related customer/workspace | PASS_LIVE |
| adminUsagePeriods | GET /v1/admin/usage/periods | PeriodPage | limit, cursor, sort, from, to, workspaceId, userId, plan | SYSTEM_ADMIN | su-dung-ai; related customer/workspace | PASS_LIVE |
| adminUsageRequests | GET /v1/admin/usage/requests | UsageRequestPage | limit, cursor, sort, from, to, workspaceId, userId, state | SYSTEM_ADMIN | su-dung-ai; related customer/workspace | PASS_LIVE |
| adminUsageTurns | GET /v1/admin/usage/turns | TurnPage | limit, cursor, sort, from, to, workspaceId, userId, status, kind | SYSTEM_ADMIN | su-dung-ai; related customer/workspace | PASS_LIVE |
| adminNotifications | GET /v1/admin/notifications | NotificationPage | limit, cursor, sort, from, to, workspaceId, userId, kind, read | SYSTEM_ADMIN | thong-bao; thong-bao/:notificationId | PASS_LIVE |
| adminNotification | GET /v1/admin/notifications/{notificationId} | Notification | Không | SYSTEM_ADMIN; UUIDv4 notificationId | thong-bao; thong-bao/:notificationId | PASS_LIVE |
| adminOperations | GET /v1/admin/operations/status | Operations | Không | SYSTEM_ADMIN | van-hanh | PASS_LIVE |
| adminAuditLogs | GET /v1/admin/audit-logs | AuditPage | limit, cursor, sort, from, to, adminId, outcome | SYSTEM_ADMIN | nhat-ky; nhat-ky/:entryId | PASS_LIVE |
| adminAuditLog | GET /v1/admin/audit-logs/{entryId} | Audit | Không | SYSTEM_ADMIN; UUIDv4 entryId | nhat-ky; nhat-ky/:entryId | PASS_LIVE |

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
