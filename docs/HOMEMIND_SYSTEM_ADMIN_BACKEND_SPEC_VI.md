# HomeMind — SYSTEM_ADMIN: nghiệp vụ, hợp đồng API và hồ sơ triển khai

Phiên bản hợp đồng: admin-v1. Thời điểm bắt đầu: 06/10/2026, Asia/Ho_Chi_Minh.
Trạng thái: BACKEND_IMPLEMENTED_AND_LIVE_VERIFIED; release/reset tiếp tục theo checkpoint cuối. Các original MAIN/PR FAIL được giữ nguyên. Batch test-only đã tái hiện/sửa retry, cursor tampering, expiry-marker và rollback-observation fixtures; latest local backend277PASS, production source không đổi. Chờ requiredDEV/PR/MAIN/deploy/smoke của exactcandidate trước reset/seed; PhaseB CHƯA BẮT ĐẦU.

## 1. Phạm vi và ranh giới đã chốt trước triển khai

Backend duy nhất; không tạo Flutter/web admin. SYSTEM_ADMIN nằm trong namespace principal/session riêng, không phải User, owner/member, household/store hoặc gói trả phí. Không có đăng ký, nâng quyền hoặc cập nhật nghiệp vụ qua HTTP admin. Customer trùng email không được kế thừa quyền. API production `https://api.homemind.vn/v1/admin`; origin được chủ dự án xác nhận `https://homemind.vn`. Local sử dụng backend/DB test riêng, không dùng VPS để sinh dữ liệu thử tài chính.

Role runtime đã triển khai `homemind_admin_api`: NOSUPERUSER, NOBYPASSRLS, NOINHERIT, không sở hữu bảng, không có role membership. Chỉ SELECT các cột nghiệp vụ được allowlist, có policy SELECT riêng nhận diện role DB này. Không thay policy customer. Session/admin audit có quyền ghi hẹp; principal chỉ operator được tạo/đổi. Các truy vấn nghiệp vụ chạy transaction REPEATABLE READ, READ ONLY, timeout 3 giây; tối đa 4 kết nối và 8 request đồng thời mỗi instance. Không gọi helper billing/quota có side effect, PayOS hoặc Gemini.

## 2. Định nghĩa tiền và usage đã đóng băng

Tiền là `{currency:"VND",amount:"58000"}`: chuỗi số nguyên đơn vị đồng, không float. Hoàn tất mua gói = order financial_state PAID, fulfillment GRANTED, có grant theo order_id; cộng price_snapshot.amount đúng một lần/order, thời gian paid_at. Grant bị thay thế vẫn thuộc lịch sử mua. Không dùng giá catalog hôm nay, không nhân theo membership/webhook, không SUM(DISTINCT amount). Payer = actor_id bất biến của order; workspace hưởng gói là chiều riêng. Verified receipts = tổng transaction duy nhất theo khóa (channel,reference), thời gian transaction paid_at. Partial/excess/review/chưa grant phải báo riêng. Pending/hủy/expired chưa trả tiền không là doanh số. Refund và net = UNAVAILABLE vì chưa có nguồn refund/reversal được xác minh.

Provenance REAL: origin REAL_PAYOS và snapshot.policyVersion=voice-30d-v2; SIMULATED_TEST: origin test có đánh dấu bền vững; trường hợp còn lại UNCLASSIFIED_LEGACY, tách khỏi mặc định REAL. Không suy nguồn từ email hoặc môi trường hiện tại.

Effective plan tính theo workspace, không theo số thành viên. Nguồn legacy_manual giữ nguyên; billing lấy grant starts_at <= asOf < coalesce(effective_until,expires_at); nếu billing hết coverage thì free. Free không có hạn truy cập trả phí nhưng quota hữu hạn 15 lượt/2.592.000 giây; Personal60, Family100, Micro POS200. Anchor giống assistant_period_at: workspace.created_at hoặc active grant start, free sau paid coverage bắt đầu từ max coverage đã kết thúc. Admin GET chỉ project kỳ chưa tạo với used=0, không INSERT period. Reserved còn lease tính riêng; remaining=max(0,limit-used-reserved). Không transcript hoặc response AI trong API.

## 3. Session web và bảo vệ

Thiết kế chốt: cookie `__Host-homemind-admin`, Secure, HttpOnly, SameSite=Strict, Path=/, không Domain; không copy token sang JSON/localStorage. Idle15 phút, absolute8 giờ; refresh xoay cookie, replay thu hồi session family; frontend serialize refresh. GET auth/csrf trước login trả challenge, unsafe methods yêu cầu Origin allowlist và `X-HomeMind-Admin-CSRF`. Origin/CORS không thay auth. Mỗi request kiểm tra principal ACTIVE và session chưa thu hồi. Login generic, throttle IP/account có thời hạn; không khóa admin vĩnh viễn. Audit cần ghi thành công trước trả dữ liệu đặc quyền, lỗi audit fail closed riêng admin. Không ghi PII/query/password/cookie/hash/token.

<!-- ADMIN_CONTRACT_START -->

## 6. Hợp đồng frontend hoàn chỉnh (generated từ controllers thật, không source access cần thiết)

Mọi JSON ví dụ trong phần này là **ILLUSTRATIVE**, không dữ liệu production. Schema/interface và công thức là contract; giá trị ví dụ không phải evidence. Các trường required luôn xuất hiện, null có ý nghĩa được mô tả. Không có endpoint cập nhật nghiệp vụ.

### 6.1 Quy tắc chung

Mọi GET không có body. Ngoại trừ CSRF/login và OPTIONS, mọi endpoint yêu cầu cookie admin hợp lệ. Cookie không nằm trong JSON; frontend dùng `fetch(url,{credentials:"include"})`. Unsafe POST/DELETE cần Origin được allowlist và header X-HomeMind-Admin-CSRF. Không gửi customer Bearer thay admin cookie.

Login: GET /auth/csrf → giữ csrfToken trong memory → POST /auth/login {email,password} với CSRF. Cookie pre-session5 phút và admin-session được browser giữ HttpOnly. Login200 trả csrfToken mới. Reload tab GET /auth/csrf khi session còn sống. Refresh POST /auth/refresh không body, serialize đúng một request, thay csrfToken trong memory sau200. Replay/concurrent refresh có thể buộc login lại; không retry vòng lặp.401 xóa cookie server và về Login;403 kiểm Origin/CSRF;429 chờ tối thiểu60s;503 chỉ retry GET có bounded backoff, không tự retry bootstrap/login/refresh mutation.

Mọi read business dùng snapshot DB nhất quán; audit ghi thành công trước response. Auth state có thể cập nhật lastSeenAt, audit được append; không order/grant/notification/customer/quota mutation. Responses private,no-store; không cache admin qua CDN.

Query không được mô tả bị400; arrays/repeated query, boolean khác true/false, numeric ngoài dạng integer, UUID ngoài v4 bị400. Date query UTC YYYY-MM-DDTHH:mm:ss[.sss]Z, từ ngày hợp lệ, from/to cùng có, from<to, window<=366 ngày. Window [from,to); default dashboard30 ngày kết thúc server now; spending không date là lifetime.

Lists: limit25,max100; sort newest(default)/oldest theo timestamp resource và UUID cùng chiều. Cursor15 phút bind admin/resource/filter/sort, không PII. Giữ nguyên filters/sort khi nextCursor; size có thể đổi. Không offset/all/totalCount. Khi cursor hết hạn tải trang đầu. SQL giữ microsecond cursor để không mất rows cùng timestamp.

Directory mặc định mọi User/mọi status/mọi provenance; principal admin không có trong User. Metrics customer/workspace mặc định REAL đã được operator xác minh trong reporting annotation riêng; legacy chưa phân loại giữ UNCLASSIFIED_LEGACY, không suy từ email. allRecords/provenanceCounts luôn cho biết phạm vi còn unknown/test. Financial provenance theo durable order origin; không đồng nhất với provenance customer/workspace.

Errors theo envelope `{error:{code,message,requestId,fields}}`; fields=[] cho lỗi nonvalidation;400 dùng [{field:email/password/request,code:INVALID_VALUE/UNKNOWN_PROPERTY}], không rejected value; query/path lỗi dùng request: INVALID_REQUEST400, ADMIN_UNAUTHORIZED/ADMIN_INVALID_CREDENTIALS/ADMIN_SESSION_REPLAY401, ADMIN_FORBIDDEN/ADMIN_ORIGIN_DENIED/ADMIN_CSRF_INVALID403, NOT_FOUND404, CONFLICT409, ADMIN_RATE_LIMITED429, ADMIN_UNAVAILABLE/ADMIN_BUSY/ADMIN_BOOTSTRAP_BLOCKED503. Message sanitized, không SQL/credential/stack/PII. Không return200 khi query lỗi.

### 6.2 Kiểu dữ liệu đầy đủ và ý nghĩa trường

#### Meta

```typescript

interface Meta {

  /** UUID correlation server tạo; không token */

  requestId: string;

  /** Timestamp snapshot UTC */

  asOf: string;

  /** admin-v1 */

  version: string;

  /** transaction_snapshot hoặc live_session */

  freshness: string;

}

```

#### Error

```typescript

interface Error {

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  error: {
    /** Giá trị vocabulary theo resource, không có quyền ghi. */
    code: string;
    /** Giá trị vocabulary theo resource, không có quyền ghi. */
    message: string;
    /** UUID correlation server tạo; không token */
    requestId: string;
    /** Giá trị vocabulary theo resource, không có quyền ghi. */
    fields: Array<{
    /** Giá trị vocabulary theo resource, không có quyền ghi. */
    field: string;
    /** Giá trị vocabulary theo resource, không có quyền ghi. */
    code: "INVALID_VALUE" | "UNKNOWN_PROPERTY";
  }>;
  };

}

```

#### Money

```typescript

interface Money {

  /** VND; amount là số nguyên đồng dạng chuỗi */

  currency: "VND";

  /** Chuỗi số nguyên không âm; dùng BigInt/decimal, không parseFloat để cộng */

  amount: string;

}

```

#### Page

```typescript

interface Page {

  /** Cỡ trang/top, default25/max100 */

  limit: number;

  /** Có row tiếp theo xác định bằng limit+1 */

  hasMore: boolean;

  /** Opaque signed metadata15 phút; null ở trang cuối */

  nextCursor: string | null;

}

```

#### Csrf

```typescript

interface Csrf {

  /** Nonce chống CSRF được JSON trả theo contract; không phải session credential */

  csrfToken: string;

  /** Số giây challenge CSRF còn dùng được */

  expiresIn: number;

}

```

#### Login

```typescript

interface Login {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Email đầy đủ được admin có quyền xem; null nếu chưa có */

  email: string;

  /** SYSTEM_ADMIN; không có client role assignment */

  role: "SYSTEM_ADMIN";

  /** ID an toàn của session, không token cookie */

  sessionId: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** Nonce chống CSRF được JSON trả theo contract; không phải session credential */

  csrfToken: string;

}

```

#### Refresh

```typescript

interface Refresh {

  /** ID an toàn của session, không token cookie */

  sessionId: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** Nonce chống CSRF được JSON trả theo contract; không phải session credential */

  csrfToken: string;

}

```

#### Revoked

```typescript

interface Revoked {

  /** True khi session đã thu hồi */

  revoked: boolean;

}

```

#### Identity

```typescript

interface Identity {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Email đầy đủ được admin có quyền xem; null nếu chưa có */

  email: string;

  /** SYSTEM_ADMIN; không có client role assignment */

  role: "SYSTEM_ADMIN";

  /** ID an toàn của session, không token cookie */

  sessionId: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** Danh sách permission đọc; không quyền sửa business */

  capabilities: Array<string>;

  /** 900 giây inactivity */

  idleSeconds: number;

  /** 28800 giây absolute, refresh không kéo dài */

  absoluteSeconds: number;

}

```

#### Session

```typescript

interface Session {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Hoạt động session admin gần nhất */

  lastSeenAt: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** browser/other; không UA/IP nguyên bản */

  client: "browser" | "other";

  /** Session đang gọi endpoint */

  current: boolean;

}

```

#### Sessions

```typescript

type Sessions = Array<Session>;

```

#### Customer

```typescript

interface Customer {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Email đầy đủ được admin có quyền xem; null nếu chưa có */

  email: string | null;

  /** Số đăng nhập E.164; không phải contactPhone */

  loginPhone: string | null;

  /** Số liên hệ Profile; có thể khác số đăng nhập hoặc null */

  contactPhone: string | null;

  /** Tên hiển thị Profile; null nếu Profile không tồn tại */

  displayName: string | null;

  /** Địa chỉ liên hệ Profile; null là chưa có */

  address: string | null;

  /** Ngôn ngữ Profile vi/en; null nếu không có Profile */

  language: string | null;

  /** Trạng thái persisted; dùng enum của resource */

  status: "ACTIVE" | "DISABLED" | "DELETED";

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Thời điểm cập nhật persisted UTC, không suy là lần đổi status */

  updatedAt: string;

  /** Thời điểm đóng tài khoản theo status-only; null nếu không có */

  deletedAt: string | null;

  /** Timestamp consent thực tế; null cho legacy chưa biết */

  termsAcceptedAt: string | null;

  /** Timestamp consent thực tế; null cho legacy chưa biết */

  privacyAcceptedAt: string | null;

  /** MAX account.login của outbox; không tính refresh; null=không biết */

  lastExplicitLoginAt: string | null;

  /** Nguồn xác định lastExplicitLoginAt */

  lastLoginSource: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: "REAL" | "SIMULATED_TEST" | "UNCLASSIFIED_LEGACY";

}

```

#### Quota

```typescript

interface Quota {

  /** Period đã tồn tại; null khi chỉ project kỳ mới */

  periodId: string | null;

  /** free/personal/family/micro_pos */

  plan: string;

  /** voice-30d-v2 cho fixed30-day */

  policyVersion: string;

  /** Bắt đầu kỳ/coverage UTC, bao gồm */

  startsAt: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** Tổng row theo metric/resource đang mô tả */

  total: number;

  /** Committed usage; không tính lại confirm/cancel/replay */

  used: number;

  /** Reservation có lease chưa hết tại snapshot */

  reserved: number;

  /** max(0,total-used-reserved) */

  remaining: number;

  /** True khi kỳ chưa có row; GET không INSERT hoặc reset quota */

  projectionOnly: boolean;

  /** False khi thiếu row entitlement; projection free được gắn anomaly, không chứng minh dữ liệu hoàn chỉnh */

  entitlementKnown: boolean;

}

```

#### Workspace

```typescript

interface Workspace {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Tên resource hiện có */

  name: string;

  /** household hoặc store */

  type: "household" | "store";

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Thời điểm cập nhật persisted UTC, không suy là lần đổi status */

  updatedAt: string;

  /** Thời điểm archive UTC hoặc null */

  archivedAt: string | null;

  /** free/personal/family/micro_pos */

  plan: string;

  /** free/legacy_manual/billing; không coi manual là giao dịch */

  source: string;

  /** False khi thiếu row entitlement; projection free được gắn anomaly, không chứng minh dữ liệu hoàn chỉnh */

  entitlementKnown: boolean;

  /** Free không có hạn truy cập trả phí; quota vẫn hữu hạn và có kỳ */

  freeLifetimeAccess: boolean;

  /** Giới hạn sản phẩm; null nghĩa không giới hạn của gói hiện tại */

  productLimit: number | null;

  /** Sản phẩm chưa archived, gồm còn và đã hết; không phải tổng lot */

  productCount: number;

  /** Grant thực tế hiện tại hoặc của kỳ; null khi không có */

  grantId: string | null;

  /** Kết thúc coverage trả phí đang hiệu lực; null nếu không có coverage */

  paidExpiresAt: string | null;

  /** Quota dùng chung workspace, không cộng hoặc nhân theo thành viên */

  quota: Quota;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: "REAL" | "SIMULATED_TEST" | "UNCLASSIFIED_LEGACY";

  /** owner/member khi list workspaces lọc userId; null trên global/detail không có user context */

  membershipRole: "owner" | "member" | null;

}

```

#### Member

```typescript

interface Member {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** Customer membership */

  userId: string;

  /** SYSTEM_ADMIN; không có client role assignment */

  role: "owner" | "member";

  /** Thời điểm tạo resource UTC */

  createdAt: string;

}

```

#### Payment

```typescript

interface Payment {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** Actor bất biến đã tạo order; không đổi theo owner hiện tại */

  payerId: string;

  /** Order code decimal string để tránh mất độ chính xác JS */

  orderCode: string;

  /** free/personal/family/micro_pos */

  plan: string;

  /** Phiên bản giá đã mua, không giá catalog mới */

  priceId: string;

  /** Giá snapshot hoặc giá trị metric ghi rõ trong resource */

  money: Money;

  /** Số tiền order được backend xác minh; không đồng nghĩa completed sales */

  amountPaid: Money;

  /** Trạng thái persisted; dùng enum của resource */

  status: string;

  /** UNPAID/PARTIAL/PAID/REVIEW */

  financialState: string;

  /** NONE/GRANTED/REVIEW */

  fulfillment: string;

  /** Mã exception thực tế hoặc null */

  reviewReason: string | null;

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Timestamp trả tiền/verified receipt UTC của resource; null nếu chưa có */

  paidAt: string | null;

  /** Thời điểm hủy persisted UTC hoặc null */

  cancelledAt: string | null;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** Số lần worker thực tế ghi nhận; không phải request mới do admin tạo */

  attempts: number;

  /** Lịch worker persisted, chỉ đọc */

  nextCheckAt: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: string;

  /** PAID + GRANTED + grant theo order_id; mỗi order chỉ tính một lần */

  completedSale: boolean;

}

```

#### Transaction

```typescript

interface Transaction {

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  orderId: string;

  /** Định danh transaction đã xác minh; dedup cùng channel+reference trong DB, không checkout instruction */

  reference: string;

  /** Giá snapshot hoặc giá trị metric ghi rõ trong resource */

  money: Money;

  /** Timestamp trả tiền/verified receipt UTC của resource; null nếu chưa có */

  paidAt: string;

}

```

#### Entitlement

```typescript

interface Entitlement {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  orderId: string;

  /** free/personal/family/micro_pos */

  plan: string;

  /** Giới hạn sản phẩm; null nghĩa không giới hạn của gói hiện tại */

  productLimit: number | null;

  /** Bắt đầu kỳ/coverage UTC, bao gồm */

  startsAt: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** Hạn gốc của grant; expiresAt có thể bị rút khi supersede */

  originalExpiresAt: string;

  /** Thời điểm thay thế grant; null=chưa supersede */

  supersededAt: string | null;

  /** ID grant thay thế, null nếu chưa có */

  supersededBy: string | null;

  /** Thời điểm tạo resource UTC */

  createdAt: string;

}

```

#### Period

```typescript

interface Period {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** free/personal/family/micro_pos */

  plan: string;

  /** voice-30d-v2 cho fixed30-day */

  policyVersion: string;

  /** Bắt đầu kỳ/coverage UTC, bao gồm */

  startsAt: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string;

  /** Grant thực tế hiện tại hoặc của kỳ; null khi không có */

  grantId: string | null;

  /** Tổng row theo metric/resource đang mô tả */

  total: number;

  /** Committed usage; không tính lại confirm/cancel/replay */

  used: number;

}

```

#### UsageRequest

```typescript

interface UsageRequest {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** Principal/customer thực hiện tùy resource; UUID, không credential */

  actorId: string;

  /** Period đã tồn tại; null khi chỉ project kỳ mới */

  periodId: string;

  /** RESERVED/RELEASED/COMMITTED của request */

  state: "RESERVED" | "RELEASED" | "COMMITTED";

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Timestamp kết quả request được commit/release nếu có */

  completedAt: string | null;

  /** Hạn lease persisted, không suy là subscription */

  leaseUntil: string;

  /** True chỉ khi request COMMITTED */

  charged: boolean;

}

```

#### Turn

```typescript

interface Turn {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** Principal/customer thực hiện tùy resource; UUID, không credential */

  actorId: string;

  /** Loại event/assistant turn thực tế */

  kind: string;

  /** Trạng thái persisted; dùng enum của resource */

  status: string;

  /** Độ trễ assistant đã đo hoặc null */

  processingTimeMs: number | null;

  /** Mã lỗi đã lưu hoặc null; không stack/provider payload */

  errorCode: string | null;

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Hạn kỳ/grant/session/order UTC, loại trừ; đọc đúng resource */

  expiresAt: string | null;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  committedAt: string | null;

}

```

#### Activity

```typescript

interface Activity {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Customer nhận notification/activity */

  recipientId: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string | null;

  /** Loại event/assistant turn thực tế */

  kind: string;

  /** Resource gốc của event; không URL thanh toán */

  targetType: string;

  /** Định danh gốc (string/UUID) hoặc null */

  targetId: string | null;

  /** Thời điểm sự kiện/audit UTC */

  occurredAt: string;

  /** Outbox đã delivery hoặc null */

  deliveredAt: string | null;

  /** Số lần worker thực tế ghi nhận; không phải request mới do admin tạo */

  attempts: number;

}

```

#### Notification

```typescript

interface Notification {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Customer nhận notification/activity */

  recipientId: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string | null;

  /** Loại event/assistant turn thực tế */

  kind: string;

  /** Notification chỉ dành owner theo customer policy; admin chỉ đọc metadata */

  financial: boolean;

  /** Resource gốc của event; không URL thanh toán */

  targetType: string;

  /** Định danh gốc (string/UUID) hoặc null */

  targetId: string | null;

  /** Thời điểm sự kiện/audit UTC */

  occurredAt: string;

  /** Thời điểm inbox nhận UTC */

  receivedAt: string;

  /** Customer đã đọc; admin không thay giá trị */

  readAt: string | null;

}

```

#### Audit

```typescript

interface Audit {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Principal/customer thực hiện tùy resource; UUID, không credential */

  actorId: string | null;

  /** UUID correlation server tạo; không token */

  requestId: string;

  /** Endpoint template hoặc auth/operator operation; không raw URL/query */

  action: string;

  /** Định danh gốc (string/UUID) hoặc null */

  targetId: string | null;

  /** SUCCESS/DENIED/ERROR của audit */

  outcome: "SUCCESS" | "DENIED" | "ERROR";

  /** Số item trả ra hoặc null, không giả totalCount */

  rowCount: number | null;

  /** Thời điểm sự kiện/audit UTC */

  occurredAt: string;

  /** HMAC phạm vi lọc; không chứa query/email/phone thô */

  scopeHash: string | null;

}

```

#### Inventory

```typescript

interface Inventory {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** Tên resource hiện có */

  name: string;

  /** Category sản phẩm hoặc null */

  category: string | null;

  /** Đơn vị hiện có hoặc null */

  unit: string | null;

  /** Trạng thái persisted; dùng enum của resource */

  status: string;

  /** Thời điểm archive UTC hoặc null */

  archivedAt: string | null;

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Thời điểm cập nhật persisted UTC, không suy là lần đổi status */

  updatedAt: string;

  /** Decimal-string tồn kho/số lượng; null khi chưa khai báo shopping */

  quantity: string;

  /** YYYY-MM-DD của lot còn quantity>0 gần nhất; null nếu không có */

  nearestExpiry: string | null;

}

```

#### Shopping

```typescript

interface Shopping {

  /** UUID của resource, không phải email hay session credential */

  id: string;

  /** Workspace hưởng dữ liệu/quyền lợi; không đồng nhất với người trả tiền */

  workspaceId: string;

  /** Tên resource hiện có */

  name: string;

  /** Decimal-string tồn kho/số lượng; null khi chưa khai báo shopping */

  quantity: string | null;

  /** Đơn vị hiện có hoặc null */

  unit: string | null;

  /** Trạng thái persisted; dùng enum của resource */

  status: string;

  /** free/legacy_manual/billing; không coi manual là giao dịch */

  source: string;

  /** Product liên kết hoặc null */

  linkedProductId: string | null;

  /** Customer actor tạo shopping item */

  createdBy: string;

  /** Thời điểm tạo resource UTC */

  createdAt: string;

  /** Thời điểm cập nhật persisted UTC, không suy là lần đổi status */

  updatedAt: string;

}

```

#### Spending

```typescript

interface Spending {

  /** Actor bất biến đã tạo order; không đổi theo owner hiện tại */

  payerId: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: string;

  /** Bắt đầu half-open window UTC hoặc null (lifetime spending) */

  from: string | null;

  /** Cuối half-open window UTC hoặc null (lifetime spending) */

  to: string | null;

  /** Số order hoàn tất trong phạm vi tiền */

  completedPurchases: number;

  /** Cộng giá snapshot các purchase hoàn tất thuộc payer/window/provenance */

  completedSpending: Money;

  /** Luôn null, không giả 0 */

  refunds: null;

  /** Luôn null, không giả doanh thu ròng */

  net: null;

  /** UNAVAILABLE; chưa có nguồn refund/reversal xác minh */

  refundAvailability: string;

}

```

#### Overview

```typescript

interface Overview {

  /** Timestamp response được sinh UTC */

  generatedAt: string;

  /** Bắt đầu half-open window UTC hoặc null (lifetime spending) */

  from: string;

  /** Cuối half-open window UTC hoặc null (lifetime spending) */

  to: string;

  /** Asia/Ho_Chi_Minh hoặc UTC cho reporting buckets */

  timezone: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: string;

  /** admin-v1 cho công thức metric */

  definitionsVersion: string;

  /** UNAVAILABLE; chưa có nguồn refund/reversal xác minh */

  refundAvailability: string;

  /** Luôn null, không giả 0 */

  refunds: null;

  /** Luôn null, không giả doanh thu ròng */

  net: null;

  /** Đếm User theo provenance chọn; allRecords và provenanceCounts cho biết toàn bộ User, không principal admin */

  customers: {
    /** Tổng row theo metric/resource đang mô tả */
    total: number;
    /** ACTIVE account hoặc workspace chưa archived, không online-now */
    active: number;
    /** User DISABLED */
    disabled: number;
    /** User DELETED status-only, không erasure claim */
    deleted: number;
    /** Customer registrations created_at trong [from,to) */
    newInWindow: number;
    /** Tổng row mọi provenance; gồm REAL, SIMULATED_TEST và UNCLASSIFIED_LEGACY */
    allRecords: number;
    /** Giá trị vocabulary theo resource, không có quyền ghi. */
    scopeProvenance: string;
    /** Số orders lifetime theo từng provenance; không cộng vào tiền REAL */
    provenanceCounts: Record<string, number>;
  };

  /** Đếm workspace một lần theo provenance chọn; allRecords/provenanceCounts hiển thị toàn bộ phạm vi; current totals không theo window */

  workspaces: {
    /** Tổng row theo metric/resource đang mô tả */
    total: number;
    /** ACTIVE account hoặc workspace chưa archived, không online-now */
    active: number;
    /** Workspace archived count */
    archived: number;
    /** Workspace household count */
    household: number;
    /** Workspace store count */
    store: number;
    /** Tổng row mọi provenance; gồm REAL, SIMULATED_TEST và UNCLASSIFIED_LEGACY */
    allRecords: number;
    /** Giá trị vocabulary theo resource, không có quyền ghi. */
    scopeProvenance: string;
    /** Số orders lifetime theo từng provenance; không cộng vào tiền REAL */
    provenanceCounts: Record<string, number>;
  };

  /** Distinct ACTIVE payer gốc của current active completed billing grant theo provenance chọn; owner đổi không đổi payer */

  currentlyPayingCustomers: number;

  /** Tổng snapshot mỗi completed order trong [from,to), paid_at, provenance chọn */

  completedSales: Money;

  /** Số order hoàn tất trong phạm vi tiền */

  completedPurchases: number;

  /** Tổng transaction đã dedup trong [from,to), transaction.paid_at */

  verifiedReceipts: Money;

  /** Exception hiện tại/lifetime theo provenance; không lọc window tiền */

  attention: {
    /** Số order attention */
    orders: number;
    /** Tổng amountPaid của order attention; không completed sales */
    receivedAmount: Money;
  };

  /** Số orders lifetime theo từng provenance; không cộng vào tiền REAL */

  provenanceCounts: Record<string, number>;

  /** Requests COMMITTED theo completed_at trong window */

  committedUsageInWindow: number;

  /** Workspace active có remaining=0 tại snapshot */

  exhaustedWorkspaces: number;

  /** Active paid coverage hết trong7 ngày, không Free */

  upcomingPaidWorkspaces: number;

  /** Historical unsuperseded grants đã hết coverage; không nói workspace Free expired */

  expiredUnsupersededGrants: number;

  /** Nguồn explicit login/outbox; không có online presence */

  activityAvailability: string;

  /** Requests COMMITTED nhóm theo plan của period, không plan hiện tại; trong window */

  usageByPlan: Record<string, number>;

  /** Distinct ACTIVE members hưởng current active completed billing grant theo provenance chọn; đây không phải số người trả tiền */

  currentlyCoveredCustomers: number;

}

```

#### TrendItem

```typescript

interface TrendItem {

  /** YYYY-MM-DDTHH:mm:ss là calendar local trong timezone của response, không phải UTC instant */

  bucketLocalStart: string;

  /** Tổng snapshot mỗi completed order trong [from,to), paid_at, provenance chọn */

  completedSales: Money;

  /** Đăng ký trong bucket và window */

  signups: number;

  /** Usage COMMITTED trong bucket và window */

  committedUsage: number;

}

```

#### Trends

```typescript

interface Trends {

  /** Timestamp response được sinh UTC */

  generatedAt: string;

  /** Bắt đầu half-open window UTC hoặc null (lifetime spending) */

  from: string;

  /** Cuối half-open window UTC hoặc null (lifetime spending) */

  to: string;

  /** Asia/Ho_Chi_Minh hoặc UTC cho reporting buckets */

  timezone: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: string;

  /** admin-v1 cho công thức metric */

  definitionsVersion: string;

  /** UNAVAILABLE; chưa có nguồn refund/reversal xác minh */

  refundAvailability: string;

  /** Luôn null, không giả 0 */

  refunds: null;

  /** Luôn null, không giả doanh thu ròng */

  net: null;

  /** day/week/month theo reporting timezone, không đổi fixed30-day billing */

  bucket: "day" | "week" | "month";

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<TrendItem>;

  /** null; v1 chưa hỗ trợ comparison window */

  comparison: null;

  /** not_requested; không fake growth/Infinity */

  comparisonAvailability: string;

}

```

#### PlanDistributionItem

```typescript

interface PlanDistributionItem {

  /** household/store */

  segment: string;

  /** free/personal/family/micro_pos */

  plan: string;

  /** Đếm workspace một lần theo provenance chọn; allRecords/provenanceCounts hiển thị toàn bộ phạm vi; current totals không theo window */

  workspaces: number;

}

```

#### PlanDistribution

```typescript

interface PlanDistribution {

  /** Timestamp response được sinh UTC */

  generatedAt: string;

  /** Bắt đầu half-open window UTC hoặc null (lifetime spending) */

  from: string;

  /** Cuối half-open window UTC hoặc null (lifetime spending) */

  to: string;

  /** Asia/Ho_Chi_Minh hoặc UTC cho reporting buckets */

  timezone: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: string;

  /** admin-v1 cho công thức metric */

  definitionsVersion: string;

  /** UNAVAILABLE; chưa có nguồn refund/reversal xác minh */

  refundAvailability: string;

  /** Luôn null, không giả 0 */

  refunds: null;

  /** Luôn null, không giả doanh thu ròng */

  net: null;

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<PlanDistributionItem>;

  /** Tên phạm vi metric rõ ràng */

  scope: string;

}

```

#### TopPayingItem

```typescript

interface TopPayingItem {

  /** Actor bất biến đã tạo order; không đổi theo owner hiện tại */

  payerId: string;

  /** Order completed thuộc payer trong window */

  purchases: number;

  /** Giá snapshot hoặc giá trị metric ghi rõ trong resource */

  money: Money;

}

```

#### TopPayingUsers

```typescript

interface TopPayingUsers {

  /** Timestamp response được sinh UTC */

  generatedAt: string;

  /** Bắt đầu half-open window UTC hoặc null (lifetime spending) */

  from: string;

  /** Cuối half-open window UTC hoặc null (lifetime spending) */

  to: string;

  /** Asia/Ho_Chi_Minh hoặc UTC cho reporting buckets */

  timezone: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: string;

  /** admin-v1 cho công thức metric */

  definitionsVersion: string;

  /** UNAVAILABLE; chưa có nguồn refund/reversal xác minh */

  refundAvailability: string;

  /** Luôn null, không giả 0 */

  refunds: null;

  /** Luôn null, không giả doanh thu ròng */

  net: null;

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<TopPayingItem>;

  /** Cỡ trang/top, default25/max100 */

  limit: number;

  /** Tên phạm vi metric rõ ràng */

  scope: string;

}

```

#### Operations

```typescript

interface Operations {

  /** Timestamp response được sinh UTC */

  generatedAt: string;

  /** Bắt đầu half-open window UTC hoặc null (lifetime spending) */

  from: string;

  /** Cuối half-open window UTC hoặc null (lifetime spending) */

  to: string;

  /** Asia/Ho_Chi_Minh hoặc UTC cho reporting buckets */

  timezone: string;

  /** REAL, SIMULATED_TEST hoặc UNCLASSIFIED_LEGACY; mặc định tiền chỉ REAL */

  provenance: string;

  /** admin-v1 cho công thức metric */

  definitionsVersion: string;

  /** UNAVAILABLE; chưa có nguồn refund/reversal xác minh */

  refundAvailability: string;

  /** Luôn null, không giả 0 */

  refunds: null;

  /** Luôn null, không giả doanh thu ròng */

  net: null;

  /** Outbox chưa delivered, global current */

  undeliveredNotifications: number;

  /** Outbox chưa delivered và attempts>=8 */

  exhaustedDeliveryAttempts: number;

  /** RESERVED lease đã hết */

  staleReservations: number;

  /** Workspace thiếu row entitlement */

  missingEntitlements: number;

  /** Period.used khác số request COMMITTED; chỉ báo, không sửa */

  quotaAnomalies: number;

  /** null; chưa có instrumentation online */

  onlinePresence: null;

  /** null; admin không gọi provider */

  providerHealth: null;

  /** database_snapshot_only */

  availability: string;

}

```

#### Vocabulary

```typescript

interface Vocabulary {

  /** admin-v1 */

  version: string;

  /** SYSTEM_ADMIN; không có client role assignment */

  role: string;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  plans: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  segments: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  accountStatuses: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  orderStatuses: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  financialStates: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  fulfillments: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  provenances: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  timezones: Array<string>;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  pageDefault: number;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  pageMax: number;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  readOnly: boolean;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  refundsAvailable: boolean;

  /** Vocabulary/capability hiện có trả từ meta; không client policy override. */

  mfaAvailable: boolean;

}

```

#### CustomerPage

```typescript

interface CustomerPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Customer>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### WorkspacePage

```typescript

interface WorkspacePage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Workspace>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### MemberPage

```typescript

interface MemberPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Member>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### PaymentPage

```typescript

interface PaymentPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Payment>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### TransactionPage

```typescript

interface TransactionPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Transaction>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### EntitlementPage

```typescript

interface EntitlementPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Entitlement>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### PeriodPage

```typescript

interface PeriodPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Period>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### UsageRequestPage

```typescript

interface UsageRequestPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<UsageRequest>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### TurnPage

```typescript

interface TurnPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Turn>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### ActivityPage

```typescript

interface ActivityPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Activity>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### NotificationPage

```typescript

interface NotificationPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Notification>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### AuditPage

```typescript

interface AuditPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Audit>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### InventoryPage

```typescript

interface InventoryPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Inventory>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

#### ShoppingPage

```typescript

interface ShoppingPage {

  /** Chỉ các row thực tế thuộc phạm vi lọc; [] nếu rỗng */

  items: Array<Shopping>;

  /** Metadata trang; không có totalCount giả */

  page: Page;

}

```

### 6.3 Inventory và per-endpoint contract

Actual: 36 JSON endpoints,2 controllers; thêm một OPTIONS /v1/admin/* kỹ thuật204 (không resource JSON).

| ID | Method/path | Response data |

|---|---|---|

| adminCsrf | GET /v1/admin/auth/csrf | Csrf |

| adminLogin | POST /v1/admin/auth/login | Login |

| adminMe | GET /v1/admin/auth/me | Identity |

| adminRefresh | POST /v1/admin/auth/refresh | Refresh |

| adminLogout | POST /v1/admin/auth/logout | Revoked |

| adminLogoutAll | POST /v1/admin/auth/logout-all | Revoked |

| adminSessions | GET /v1/admin/auth/sessions | Sessions |

| adminRevokeSession | DELETE /v1/admin/auth/sessions/{sessionId} | Revoked |

| adminMeta | GET /v1/admin/meta | Vocabulary |

| adminOverview | GET /v1/admin/dashboard/overview | Overview |

| adminTrends | GET /v1/admin/dashboard/trends | Trends |

| adminPlanDistribution | GET /v1/admin/dashboard/plan-distribution | PlanDistribution |

| adminTopPayingUsers | GET /v1/admin/dashboard/top-paying-users | TopPayingUsers |

| adminUsers | GET /v1/admin/users | CustomerPage |

| adminUser | GET /v1/admin/users/{userId} | Customer |

| adminUserWorkspaces | GET /v1/admin/users/{userId}/workspaces | WorkspacePage |

| adminUserSpending | GET /v1/admin/users/{userId}/spending | Spending |

| adminUserActivity | GET /v1/admin/users/{userId}/activity | ActivityPage |

| adminWorkspaces | GET /v1/admin/workspaces | WorkspacePage |

| adminWorkspace | GET /v1/admin/workspaces/{workspaceId} | Workspace |

| adminWorkspaceMembers | GET /v1/admin/workspaces/{workspaceId}/members | MemberPage |

| adminWorkspaceInventory | GET /v1/admin/workspaces/{workspaceId}/inventory | InventoryPage |

| adminWorkspaceShopping | GET /v1/admin/workspaces/{workspaceId}/shopping | ShoppingPage |

| adminPayments | GET /v1/admin/payments | PaymentPage |

| adminPayment | GET /v1/admin/payments/{paymentId} | Payment |

| adminPaymentTransactions | GET /v1/admin/payments/{paymentId}/transactions | TransactionPage |

| adminEntitlements | GET /v1/admin/entitlements | EntitlementPage |

| adminCurrentUsage | GET /v1/admin/usage/current | Workspace |

| adminUsagePeriods | GET /v1/admin/usage/periods | PeriodPage |

| adminUsageRequests | GET /v1/admin/usage/requests | UsageRequestPage |

| adminUsageTurns | GET /v1/admin/usage/turns | TurnPage |

| adminNotifications | GET /v1/admin/notifications | NotificationPage |

| adminNotification | GET /v1/admin/notifications/{notificationId} | Notification |

| adminOperations | GET /v1/admin/operations/status | Operations |

| adminAuditLogs | GET /v1/admin/audit-logs | AuditPage |

| adminAuditLog | GET /v1/admin/audit-logs/{entryId} | Audit |

#### ADM-API-01 — adminCsrf

`GET /v1/admin/auth/csrf`. Mục đích: Csrf, trang tương ứng theo mapping6.4. Auth: pre-session (CSRF/login). CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/auth/csrf
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "csrfToken": "ILLUSTRATIVE",
    "expiresIn": 300
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-02 — adminLogin

`POST /v1/admin/auth/login`. Mục đích: Login, trang tương ứng theo mapping6.4. Auth: pre-session (CSRF/login). Origin + CSRF bắt buộc.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| header.Origin | string | exact approved HTTPS Origin |

| header.X-HomeMind-Admin-CSRF | string | CSRF nonce matching cookie |

| body.email | string | required; trim lowercase; valid email<=254; namespace admin |

| body.password | string write-only | required;16..128; no trim; operator bootstrap>=20 strong; never log |

Request ILLUSTRATIVE:

```http
POST /v1/admin/auth/login
Origin: https://homemind.vn
X-HomeMind-Admin-CSRF: <nonce-in-memory>
Content-Type: application/json

{"email":"illustrative@example.invalid","password":"<protected-strong-input>"}
```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "email": "illustrative@example.invalid",
    "role": "SYSTEM_ADMIN",
    "sessionId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "expiresAt": "2026-10-07T00:00:00.000Z",
    "csrfToken": "ILLUSTRATIVE"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-03 — adminMe

`GET /v1/admin/auth/me`. Mục đích: Identity, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/auth/me
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "email": "illustrative@example.invalid",
    "role": "SYSTEM_ADMIN",
    "sessionId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "expiresAt": "2026-10-07T00:00:00.000Z",
    "capabilities": [],
    "idleSeconds": 900,
    "absoluteSeconds": 28800
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-04 — adminRefresh

`POST /v1/admin/auth/refresh`. Mục đích: Refresh, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. Origin + CSRF bắt buộc.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| header.Origin | string | exact approved HTTPS Origin |

| header.X-HomeMind-Admin-CSRF | string | CSRF nonce matching cookie |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
POST /v1/admin/auth/refresh
Origin: https://homemind.vn
X-HomeMind-Admin-CSRF: <nonce-in-memory>

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "sessionId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "expiresAt": "2026-10-07T00:00:00.000Z",
    "csrfToken": "ILLUSTRATIVE"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-05 — adminLogout

`POST /v1/admin/auth/logout`. Mục đích: Revoked, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. Origin + CSRF bắt buộc.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| header.Origin | string | exact approved HTTPS Origin |

| header.X-HomeMind-Admin-CSRF | string | CSRF nonce matching cookie |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
POST /v1/admin/auth/logout
Origin: https://homemind.vn
X-HomeMind-Admin-CSRF: <nonce-in-memory>

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "revoked": false
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-06 — adminLogoutAll

`POST /v1/admin/auth/logout-all`. Mục đích: Revoked, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. Origin + CSRF bắt buộc.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| header.Origin | string | exact approved HTTPS Origin |

| header.X-HomeMind-Admin-CSRF | string | CSRF nonce matching cookie |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
POST /v1/admin/auth/logout-all
Origin: https://homemind.vn
X-HomeMind-Admin-CSRF: <nonce-in-memory>

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "revoked": false
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-07 — adminSessions

`GET /v1/admin/auth/sessions`. Mục đích: Sessions, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/auth/sessions
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": [],
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-08 — adminRevokeSession

`DELETE /v1/admin/auth/sessions/{sessionId}`. Mục đích: Revoked, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. Origin + CSRF bắt buộc.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.sessionId | string | UUIDv4, required, không null |

| header.Origin | string | exact approved HTTPS Origin |

| header.X-HomeMind-Admin-CSRF | string | CSRF nonce matching cookie |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
DELETE /v1/admin/auth/sessions/9ac3a4d1-0123-4567-8abc-123456789abc
Origin: https://homemind.vn
X-HomeMind-Admin-CSRF: <nonce-in-memory>

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "revoked": false
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-09 — adminMeta

`GET /v1/admin/meta`. Mục đích: Vocabulary, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/meta
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "version": "admin-v1",
    "role": "ILLUSTRATIVE",
    "plans": [],
    "segments": [],
    "accountStatuses": [],
    "orderStatuses": [],
    "financialStates": [],
    "fulfillments": [],
    "provenances": [],
    "timezones": [],
    "pageDefault": 25,
    "pageMax": 100,
    "readOnly": true,
    "refundsAvailable": false,
    "mfaAvailable": false
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-10 — adminOverview

`GET /v1/admin/dashboard/overview`. Mục đích: Overview, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

| query.timezone | string | optional Asia/Ho_Chi_Minh(default)/UTC |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/dashboard/overview
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "generatedAt": "2026-10-07T00:00:00.000Z",
    "from": "2026-10-07T00:00:00.000Z",
    "to": "2026-10-07T00:00:00.000Z",
    "timezone": "Asia/Ho_Chi_Minh",
    "provenance": "REAL",
    "definitionsVersion": "admin-v1",
    "refundAvailability": "UNAVAILABLE",
    "refunds": null,
    "net": null,
    "customers": {
      "total": 15,
      "active": 0,
      "disabled": 0,
      "deleted": 0,
      "newInWindow": 0,
      "allRecords": 0,
      "scopeProvenance": "ILLUSTRATIVE",
      "provenanceCounts": {}
    },
    "workspaces": {
      "total": 15,
      "active": 0,
      "archived": 0,
      "household": 0,
      "store": 0,
      "allRecords": 0,
      "scopeProvenance": "ILLUSTRATIVE",
      "provenanceCounts": {}
    },
    "currentlyPayingCustomers": 0,
    "completedSales": {
      "currency": "VND",
      "amount": "0"
    },
    "completedPurchases": 0,
    "verifiedReceipts": {
      "currency": "VND",
      "amount": "0"
    },
    "attention": {
      "orders": 0,
      "receivedAmount": {
        "currency": "VND",
        "amount": "0"
      }
    },
    "provenanceCounts": {},
    "committedUsageInWindow": 0,
    "exhaustedWorkspaces": 0,
    "upcomingPaidWorkspaces": 0,
    "expiredUnsupersededGrants": 0,
    "activityAvailability": "ILLUSTRATIVE",
    "usageByPlan": {},
    "currentlyCoveredCustomers": 0
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-11 — adminTrends

`GET /v1/admin/dashboard/trends`. Mục đích: Trends, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

| query.timezone | string | optional Asia/Ho_Chi_Minh(default)/UTC |

| query.bucket | string | optional day(default)/week/month; max367 day buckets |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/dashboard/trends
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "generatedAt": "2026-10-07T00:00:00.000Z",
    "from": "2026-10-07T00:00:00.000Z",
    "to": "2026-10-07T00:00:00.000Z",
    "timezone": "Asia/Ho_Chi_Minh",
    "provenance": "REAL",
    "definitionsVersion": "admin-v1",
    "refundAvailability": "UNAVAILABLE",
    "refunds": null,
    "net": null,
    "bucket": "day",
    "items": [],
    "comparison": null,
    "comparisonAvailability": "not_requested"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-12 — adminPlanDistribution

`GET /v1/admin/dashboard/plan-distribution`. Mục đích: PlanDistribution, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/dashboard/plan-distribution
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "generatedAt": "2026-10-07T00:00:00.000Z",
    "from": "2026-10-07T00:00:00.000Z",
    "to": "2026-10-07T00:00:00.000Z",
    "timezone": "Asia/Ho_Chi_Minh",
    "provenance": "REAL",
    "definitionsVersion": "admin-v1",
    "refundAvailability": "UNAVAILABLE",
    "refunds": null,
    "net": null,
    "items": [],
    "scope": "current_active_workspaces; one row per workspace"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-13 — adminTopPayingUsers

`GET /v1/admin/dashboard/top-paying-users`. Mục đích: TopPayingUsers, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

| query.timezone | string | optional Asia/Ho_Chi_Minh(default)/UTC |

| query.limit | string | optional; default25; integer1..100 |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/dashboard/top-paying-users
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "generatedAt": "2026-10-07T00:00:00.000Z",
    "from": "2026-10-07T00:00:00.000Z",
    "to": "2026-10-07T00:00:00.000Z",
    "timezone": "Asia/Ho_Chi_Minh",
    "provenance": "REAL",
    "definitionsVersion": "admin-v1",
    "refundAvailability": "UNAVAILABLE",
    "refunds": null,
    "net": null,
    "items": [],
    "limit": 25,
    "scope": "current_active_workspaces; one row per workspace"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-14 — adminUsers

`GET /v1/admin/users`. Mục đích: CustomerPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.status | string | optional; exact enum resource trong meta, inventory in_stock/out, shopping needed/bought/skipped |

| query.q | string | optional; trim;0..120; empty=no search; name/email/phones/UUID |

| query.segment | string | optional household/store; user filter ANY membership |

| query.plan | string | optional free/personal/family/micro_pos; user filter ANY membership |

| query.paying | string | optional true/false; has historical REAL completed purchase, không online/current plan |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/users
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-15 — adminUser

`GET /v1/admin/users/{userId}`. Mục đích: Customer, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.userId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/users/9ac3a4d1-0123-4567-8abc-123456789abc
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "email": null,
    "loginPhone": null,
    "contactPhone": null,
    "displayName": null,
    "address": null,
    "language": null,
    "status": "ACTIVE",
    "createdAt": "2026-10-07T00:00:00.000Z",
    "updatedAt": "2026-10-07T00:00:00.000Z",
    "deletedAt": null,
    "termsAcceptedAt": null,
    "privacyAcceptedAt": null,
    "lastExplicitLoginAt": null,
    "lastLoginSource": "notification_outbox.account.login",
    "provenance": "REAL"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-16 — adminUserWorkspaces

`GET /v1/admin/users/{userId}/workspaces`. Mục đích: WorkspacePage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.segment | string | optional household/store; user filter ANY membership |

| query.plan | string | optional free/personal/family/micro_pos; user filter ANY membership |

| query.archived | string | optional true/false; null archivedAt meaning active |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

| path.userId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/users/9ac3a4d1-0123-4567-8abc-123456789abc/workspaces
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-17 — adminUserSpending

`GET /v1/admin/users/{userId}/spending`. Mục đích: Spending, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.userId | string | UUIDv4, required, không null |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/users/9ac3a4d1-0123-4567-8abc-123456789abc/spending
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "payerId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "provenance": "REAL",
    "from": null,
    "to": null,
    "completedPurchases": 0,
    "completedSpending": {
      "currency": "VND",
      "amount": "0"
    },
    "refunds": null,
    "net": null,
    "refundAvailability": "UNAVAILABLE"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-18 — adminUserActivity

`GET /v1/admin/users/{userId}/activity`. Mục đích: ActivityPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.kind | string | optional canonical event identifier<=80 lowercase dot/underscore; turns canonical kind |

| path.userId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/users/9ac3a4d1-0123-4567-8abc-123456789abc/activity
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-19 — adminWorkspaces

`GET /v1/admin/workspaces`. Mục đích: WorkspacePage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.segment | string | optional household/store; user filter ANY membership |

| query.plan | string | optional free/personal/family/micro_pos; user filter ANY membership |

| query.archived | string | optional true/false; null archivedAt meaning active |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/workspaces
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-20 — adminWorkspace

`GET /v1/admin/workspaces/{workspaceId}`. Mục đích: Workspace, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.workspaceId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/workspaces/9ac3a4d1-0123-4567-8abc-123456789abc
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "name": "ILLUSTRATIVE",
    "type": "household",
    "createdAt": "2026-10-07T00:00:00.000Z",
    "updatedAt": "2026-10-07T00:00:00.000Z",
    "archivedAt": null,
    "plan": "free",
    "source": "free",
    "entitlementKnown": true,
    "freeLifetimeAccess": true,
    "productLimit": null,
    "productCount": 0,
    "grantId": null,
    "paidExpiresAt": null,
    "quota": {
      "periodId": null,
      "plan": "free",
      "policyVersion": "voice-30d-v2",
      "startsAt": "2026-10-07T00:00:00.000Z",
      "expiresAt": "2026-10-07T00:00:00.000Z",
      "total": 15,
      "used": 0,
      "reserved": 0,
      "remaining": 15,
      "projectionOnly": true,
      "entitlementKnown": true
    },
    "provenance": "REAL",
    "membershipRole": null
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-21 — adminWorkspaceMembers

`GET /v1/admin/workspaces/{workspaceId}/members`. Mục đích: MemberPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| path.workspaceId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/workspaces/9ac3a4d1-0123-4567-8abc-123456789abc/members
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-22 — adminWorkspaceInventory

`GET /v1/admin/workspaces/{workspaceId}/inventory`. Mục đích: InventoryPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.status | string | optional; exact enum resource trong meta, inventory in_stock/out, shopping needed/bought/skipped |

| path.workspaceId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/workspaces/9ac3a4d1-0123-4567-8abc-123456789abc/inventory
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-23 — adminWorkspaceShopping

`GET /v1/admin/workspaces/{workspaceId}/shopping`. Mục đích: ShoppingPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.status | string | optional; exact enum resource trong meta, inventory in_stock/out, shopping needed/bought/skipped |

| path.workspaceId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/workspaces/9ac3a4d1-0123-4567-8abc-123456789abc/shopping
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-24 — adminPayments

`GET /v1/admin/payments`. Mục đích: PaymentPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.status | string | optional; exact enum resource trong meta, inventory in_stock/out, shopping needed/bought/skipped |

| query.financialState | string | optional UNPAID/PARTIAL/PAID/REVIEW |

| query.fulfillment | string | optional NONE/GRANTED/REVIEW |

| query.provenance | string | optional REAL(default only money summaries)/SIMULATED_TEST/UNCLASSIFIED_LEGACY; payment list no default exclusion |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/payments
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-25 — adminPayment

`GET /v1/admin/payments/{paymentId}`. Mục đích: Payment, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.paymentId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/payments/9ac3a4d1-0123-4567-8abc-123456789abc
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "workspaceId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "payerId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "orderCode": "ILLUSTRATIVE",
    "plan": "free",
    "priceId": "ILLUSTRATIVE",
    "money": {
      "currency": "VND",
      "amount": "0"
    },
    "amountPaid": {
      "currency": "VND",
      "amount": "0"
    },
    "status": "ILLUSTRATIVE",
    "financialState": "ILLUSTRATIVE",
    "fulfillment": "ILLUSTRATIVE",
    "reviewReason": null,
    "createdAt": "2026-10-07T00:00:00.000Z",
    "paidAt": null,
    "cancelledAt": null,
    "expiresAt": "2026-10-07T00:00:00.000Z",
    "attempts": 0,
    "nextCheckAt": "2026-10-07T00:00:00.000Z",
    "provenance": "REAL",
    "completedSale": false
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-26 — adminPaymentTransactions

`GET /v1/admin/payments/{paymentId}/transactions`. Mục đích: TransactionPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.paymentId | string | UUIDv4, required, không null |

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/payments/9ac3a4d1-0123-4567-8abc-123456789abc/transactions
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-27 — adminEntitlements

`GET /v1/admin/entitlements`. Mục đích: EntitlementPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.plan | string | optional free/personal/family/micro_pos; user filter ANY membership |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/entitlements
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-28 — adminCurrentUsage

`GET /v1/admin/usage/current`. Mục đích: Workspace, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/usage/current?workspaceId=9ac3a4d1-0123-4567-8abc-123456789abc
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "name": "ILLUSTRATIVE",
    "type": "household",
    "createdAt": "2026-10-07T00:00:00.000Z",
    "updatedAt": "2026-10-07T00:00:00.000Z",
    "archivedAt": null,
    "plan": "free",
    "source": "free",
    "entitlementKnown": true,
    "freeLifetimeAccess": true,
    "productLimit": null,
    "productCount": 0,
    "grantId": null,
    "paidExpiresAt": null,
    "quota": {
      "periodId": null,
      "plan": "free",
      "policyVersion": "voice-30d-v2",
      "startsAt": "2026-10-07T00:00:00.000Z",
      "expiresAt": "2026-10-07T00:00:00.000Z",
      "total": 15,
      "used": 0,
      "reserved": 0,
      "remaining": 15,
      "projectionOnly": true,
      "entitlementKnown": true
    },
    "provenance": "REAL",
    "membershipRole": null
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-29 — adminUsagePeriods

`GET /v1/admin/usage/periods`. Mục đích: PeriodPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.plan | string | optional free/personal/family/micro_pos; user filter ANY membership |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/usage/periods
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-30 — adminUsageRequests

`GET /v1/admin/usage/requests`. Mục đích: UsageRequestPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.state | string | optional RESERVED/RELEASED/COMMITTED |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/usage/requests
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-31 — adminUsageTurns

`GET /v1/admin/usage/turns`. Mục đích: TurnPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.status | string | optional completed/pending_confirmation/committed/cancelled/failed |

| query.kind | string | optional canonical event identifier<=80 lowercase dot/underscore; turns canonical kind |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/usage/turns
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-32 — adminNotifications

`GET /v1/admin/notifications`. Mục đích: NotificationPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.workspaceId | string | UUIDv4; required only usage/current; otherwise optional filter |

| query.userId | string | optional UUIDv4; payer for payments, actor for requests/turns, recipient for notifications/activity, membership for workspace/grants/periods |

| query.kind | string | optional canonical event identifier<=80 lowercase dot/underscore; turns canonical kind |

| query.read | string | optional true/false; readAt not null/null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/notifications
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-33 — adminNotification

`GET /v1/admin/notifications/{notificationId}`. Mục đích: Notification, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.notificationId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/notifications/9ac3a4d1-0123-4567-8abc-123456789abc
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "recipientId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "workspaceId": null,
    "kind": "ILLUSTRATIVE",
    "financial": false,
    "targetType": "ILLUSTRATIVE",
    "targetId": null,
    "occurredAt": "2026-10-07T00:00:00.000Z",
    "receivedAt": "2026-10-07T00:00:00.000Z",
    "readAt": null
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-34 — adminOperations

`GET /v1/admin/operations/status`. Mục đích: Operations, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/operations/status
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "generatedAt": "2026-10-07T00:00:00.000Z",
    "from": "2026-10-07T00:00:00.000Z",
    "to": "2026-10-07T00:00:00.000Z",
    "timezone": "Asia/Ho_Chi_Minh",
    "provenance": "REAL",
    "definitionsVersion": "admin-v1",
    "refundAvailability": "UNAVAILABLE",
    "refunds": null,
    "net": null,
    "undeliveredNotifications": 0,
    "exhaustedDeliveryAttempts": 0,
    "staleReservations": 0,
    "missingEntitlements": 0,
    "quotaAnomalies": 0,
    "onlinePresence": null,
    "providerHealth": null,
    "availability": "database_snapshot_only"
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-35 — adminAuditLogs

`GET /v1/admin/audit-logs`. Mục đích: AuditPage, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| query.limit | string | optional; default25; integer1..100 |

| query.cursor | string | optional; opaque<=2048; same admin/resource/filter/sort;15 phút |

| query.sort | string | optional; newest(default)/oldest |

| query.from | string | optional paired to; valid UTC; window<=366days |

| query.to | string | optional paired from; exclusive UTC; from<to |

| query.adminId | string | optional UUIDv4 actor audit |

| query.outcome | string | optional SUCCESS/DENIED/ERROR |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/audit-logs
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "items": [],
    "page": {
      "limit": 25,
      "hasMore": false,
      "nextCursor": null
    }
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

#### ADM-API-36 — adminAuditLog

`GET /v1/admin/audit-logs/{entryId}`. Mục đích: Audit, trang tương ứng theo mapping6.4. Auth: SYSTEM_ADMIN, persisted ACTIVE + live own session. CSRF không bắt buộc cho GET; Origin nếu có phải allowlist.

| Input | Type | Required/null/default/format/limits |

|---|---|---|

| path.entryId | string | UUIDv4, required, không null |

Body: **không có body**; unknown properties bị400.

Request ILLUSTRATIVE:

```http
GET /v1/admin/audit-logs/9ac3a4d1-0123-4567-8abc-123456789abc
Origin: https://homemind.vn

```

Success200; tất cả trường/nested object được định nghĩa đầy đủ tại6.2:

```json

{
  "data": {
    "id": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "actorId": null,
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "action": "ILLUSTRATIVE",
    "targetId": null,
    "outcome": "SUCCESS",
    "rowCount": null,
    "occurredAt": "2026-10-07T00:00:00.000Z",
    "scopeHash": null
  },
  "meta": {
    "requestId": "9ac3a4d1-0123-4567-8abc-123456789abc",
    "asOf": "2026-10-07T00:00:00.000Z",
    "version": "admin-v1",
    "freshness": "transaction_snapshot"
  }
}

```

Empty: list items=[]/hasMore=false/nextCursor=null; aggregate0 chỉ khi DB xác nhận không có rows; detail UUID hợp lệ không tồn tại404; singleton auth invalid401. Không tạo data cho empty state.

Representative failure: `{"error":{"code":"INVALID_REQUEST","message":"Invalid request.","requestId":"9ac3a4d1-0123-4567-8abc-123456789abc","fields":[{"field":"request","code":"INVALID_VALUE"}]}}`400. Guest/customer401; origin/CSRF403; rate429; DB/audit/capacity/timeout503. Không retry mutation tự động.

Nguồn/filter: schema6.2 và công thức§2; raw user data chỉ trên Customer; payment dùng snapshot/transaction/grant; metadata usage không transcript. Customer-related sublists dùng UUID path như filter bắt buộc, filter query trái path bị400. All filtered rows có thể duyệt cursor, không chỉ25rows đầu. No business side effects; own session và security audit là ngoại lệ đã khai báo.

### 6.4 Công thức metric và recipe trang

| Trang | Calls | State/display/retry |

|---|---|---|

| Login | auth/csrf → login → me | Cookie HttpOnly/credentials include; CSRF memory;401 về login; không localStorage token |

| Overview | dashboard/overview + plan-distribution + trends + top-paying-users | Parallel tối đa4; overview monetary window paid_at, receipts transaction paid_at; plan/current counts asOf; no fake chart. Null refunds/net là chưa có capability |

| Users | users?q=&status=&segment=&plan=&paying= | Default tất cả status, không dedup bằng tên; navigate nextCursor, filter đổi thì reset |

| User detail | users/{id}, /workspaces, /spending, /activity; payments?userId=; usage/requests?userId= | Phân biệt loginPhone/contactPhone; legal null=legacy unknown; memberships nhiều workspace, role per item; spending theo payer, không owner mới |

| Workspace | workspaces/{id}, /members, /inventory, /shopping; entitlements?workspaceId=; usage/current?workspaceId=; usage/periods?workspaceId= | Current quota shared, không tổng theo member; Free lifetime access riêng finite quota; past superseded grants không active |

| Payments | payments?status=&financialState=&fulfillment=&provenance= | PENDING chưa thu tiền; UNDERPAID/PARTIAL có receipt nhưng chưa completed; REVIEW cần attention; PAID chỉ doanh số khi completedSale true; CANCELLED/UNPAID0 không revenue |

| Payment detail | payments/{id}, /transactions; entitlements?workspaceId= | Không QR/checkout/bank/copy/payment CTA; chỉ monitoring; refund/net unavailable |

| Usage | current, periods, requests, turns | COMMITTED charges exactly1 logical response; RESERVED live riêng; failure/replay/confirm/cancel không thêm lượt; metadata errors không raw prompt |

| Operations | operations/status | Database snapshot only, no provider probe; exhausted delivery/stale lease/anomaly chỉ xem, không sửa |

| Audit | audit-logs?adminId=&outcome=, audit-logs/{id} | Metadata không raw query/PII; đọc audit sinh1audit, không recursion; append-only qua HTTP, operator retention90days approved |

Customer total/status/workspace distribution là current/lifetime; newInWindow là created_at. ACTIVE account không đồng nghĩa recently-active/online; onlinePresence unavailable. currentlyPayingCustomers đếm distinct ACTIVE payer của current active grant; currentlyCoveredCustomers đếm distinct ACTIVE memberships hưởng current active grant. Cả hai áp dụng provenance đã chọn, không nhân mỗi workspace/member. Attention orders/receivedAmount là lifetime current exception; provenanceCounts lifetime. UsageByPlan dùng period plan và completed_at window. Upcoming coverage7days current, expired grants historical; không expire Free. Trends chia bucket calendar timezone, cắt cả2 đầu theo window; calendar month không đổi2592000sec quota.

Minh họa arithmetic độc lập: hai order Personal paid+granted giá29000 →58000, dù cùng giá;10 webhook lặp cùng channel/reference vẫn1receipt; partial10000 + review35000 →attention received45000, không cộng completed sales. Synthetic29000 và unclassified29000 tách khỏiREAL58000. Member thêm không thay workspace quota hoặc payer spending. Owner đổi không đổi actor_id lịch sử. Catalog đổi giá không đổi snapshot.

Null được phân biệt với0: profile/legal/login timestamp chưa biết, expiry Free null, unavailable refund/net/provider/online null. Legitimate current projected period chưa có row dùng projectionOnly=true vàused0 theo charging contract; entitlementKnown=false phải hiện cảnh báo missing data. Không silent repair.

Compatibility: admin-v1 additive fields cần frontend tolerant; breaking schema/auth/filter change tăng version và cập nhật cả Markdown/OpenAPI/tests. Money amount giữ string. Không export/all, không impersonation hoặc privilege assignment.

### 6.5 CORS/preflight và local integration

Production allowed Origin đúng https://homemind.vn. api.homemind.vn và homemind.vn là same-site nhưng khác origin: cần CORS credentials và CSRF. Không tin mọi subdomain. Local development origin phải được operator thêm rõ ADMIN_WEB_ORIGINS trong local env; chỉ local mode được http://localhost:<port>/http://127.0.0.1:<port>; production HTTPS only. No wildcard/trailing slash/path/userinfo. CookieSecure yêu cầu HTTPS browser local; HTTP local test harness giữ Cookie/header thủ công chỉ là HTTP contract evidence.

OPTIONS /v1/admin/* không auth,204 chỉ approved Origin và Access-Control-Request-Method GET/POST/DELETE; allowed headers Content-Type/X-HomeMind-Admin-CSRF; credentials=true; max-age300; Vary:Origin. Invalid origin403; unsupported method/header400. Không có arbitrary SQL provider command hoặc public Swagger admin Try-it-out. Production customer docs disabled theo policy hiện tại; admin contract dùng artifact offline.

Auth prerequisites: disabled/unconfigured/bootstrap absent không usable; không gọi API admin COMPLETE khi chỉ healthy customer API. MFA chưa có; capability meta mfaAvailable=false, khuyến nghị reviewed MFA phase riêng. Tham khảo kỹ thuật: [PostgreSQL18 RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html); các link không thay implementation evidence.

### 6.6 Operator/bootstrap/retention runbook

Long-lived ADMIN_DATABASE_URL dùng role homemind_admin_api và password riêng, cùng database/host/port với DATABASE_URL; ADMIN_WEB_ORIGINS exact allowlist. Pool4, queue3s, statement3s, read snapshot6s, request concurrency8, privileged reads120/min/admin. Thiếu cả2 field →admin disabled không ảnh hưởng customer; có một field/malformed →config fail closed. Không dùng superuser/migrator làm runtime DSN.

Root chuẩn bị dedicated role bằng helper admin_role.py sau verified committed release; metadata password root-only /etc/homemind/db-admin-reader-password, không app container ephemeral/public root. Helper stage chỉ2ADMIN fields, không activation, không provider/auth/db/customer secret rotation. Trusted pipeline mới activateenvrevision, rollback phục hồi prior env; interrupted journal block theo cơ chế hiện có. Role/metadata tồn tại được preserve, không rotate tự động.

Sau migration19, operator psql trusted DB áp dụng prisma/admin-grants.sql đóng gói trong migrator image. Không GRANT ALL/BYPASSRLS/ownership hoặc membership customer→admin. Bootstrap: trusted migrator image `node scripts/admin-operator.cjs`, stdin JSON `{email:"<chosen-email>",password:"<protected-new-random-secret>",operation:"bootstrap"}` qua file0600 ngoài Git/pipe trong memory. Không password trên command args/history. Script chỉ chấp nhận current_user=homemind_migrator; singleton key initial + advisory lock; duplicate same email ALREADY_PROVISIONED không reset/reactivate; different email fail collision. Customer trùng textual email vẫn namespace riêng, không cấp quyền.

Credential recovery operator dùng cùng command/stdin operation rotate, email phải đúng principal đã provision. Rotation giữ disabled status, đổi Argon2id theo primitives hiện có, thu hồi sessions và append audit; không public reset/master password. Owner lấy credential ở file riêng đã bàn giao, không chat/report/Git/GitHub artifacts; không để bootstrap secret trong API env.

Owner xác nhận retention vận hành ngày07/10/2026: audit90days/max100000rows. Trigger capacity atomic fail closed nếu đầy; không block customer traffic. Operator `node scripts/admin-audit-maintain.cjs` stdin chính xác `{operation:"prune-audit",retentionDays:90,maxRows:5000}` xóa chỉ older90days tối đa5000/batch, dọn expired admin sessions older absolute-expiry+1day. Không API sửa/xóaaudit. Root daily service/timer chạy approved batches; alert when maintenance fails/capacity exhausted. Đây không claim tamper-proof hoặc statutory financial retention. Privacy/Terms purpose/retention disclosure cần owner review phase riêng; không sửa public policy trong task này.

<!-- ADMIN_CONTRACT_END -->

## 4. Baseline, kế hoạch và test matrix

Repository D:\HomeMind\HomeMind-GitHub; branch dev; HEAD0791a3bc4f3a0f9a8bd76a5e0d23d097c5844a0d. Pre-existing: owner xóa hai prompt PPV; sửa hai report legal/UI; thêm prompt admin và hai audit Play/legal. Không stage các thay đổi đó. PostgreSQL18, Nest10, Prisma6.19, Argon2 hiện có. Không thay dependencies hoặc customer closure/billing/quota.

| Nhóm | Kiểm tra bắt buộc | Trạng thái |
|---|---|---|
| Bootstrap | singleton/concurrent/idempotent/no reset/no public route | LOCAL PASS |
| Auth | real hash, CSRF, cookie, idle/absolute, refresh replay, revoke/disabled, throttle | LOCAL PASS |
| DB boundary | column privileges, no writes/escalation, RLS customer trước/sau, read-only no side effects | LOCAL PASS |
| Financial | cùng giá 2 order, receipts dedup, partial/review, synthetic/legacy, payer/workspace, exact sum | LOCAL PASS |
| Usage | free/paid/expired/superseded/rollover/reservations/shared | LOCAL PASS |
| HTTP contracts | mỗi route happy/empty/negative/validation/pagination/sensitive sentinel | LOCAL PASS |
| Migration | upgrade giữ dữ liệu và migration cũ bất biến | LOCAL PASS |
| Performance | >=2.000 users; >=20.000 orders/events; p50/p95; EXPLAIN | LOCAL PASS |
| Release | Các PASS lịch sử giữ nguyên; candidate sửa fixture cần DEV/PR/MAIN/deploy/production-smoke mới trước reset | CI_REPAIR_LOCAL_PASS_RELEASE_PENDING |

Budget đo trước chạy: page25/max100, search120 ký tự, top25/max100, window tối đa366 ngày, chart tối đa367 bucket/day; SQL timeout3s, pool4, concurrency8; local p95 directory/payment<1s, overview<3s, lỗi0. Không tuyên bố quy mô triệu users.

## 5. Tiến độ (append, không xóa FAIL lịch sử)

### ADM-001 — 06/10/2026, discovery hoàn tất, implementation chưa chạy

Đã đọc toàn bộ prompt và trace SQL migrations theo thứ tự; phát hiện reads customer billing/quota có mutation. Đã xác nhận origin và email bootstrap với owner. Mật khẩu admin sẽ ngẫu nhiên, bàn giao file riêng ngoài Git; không reuse SSH/customer. Docker Desktop được bật cho fixture riêng. NEXT: additive migration, role/operator tooling, auth/read APIs và focused tests.

### ADM-002 — 07/10/2026 00:04 ICT, DISCOVERY-01 reconciled

HEAD0791a3b; candidate0f176c93706e5655a3a10b9d2a785c2b39a09c7738261c2708eb3dc5d7aac392; fixturehomemind-admin-1767ea0c135b-db; private statehomemind-admin-40acgchm. Typecheck/build PASS sau lỗi decorator compile được sửa trong implementation. Additive migration19 áp dụng PASS trên PostgreSQL18. Output allowlist contracts3/3 PASS; admin HTTP9 case BLOCKED_BY_ADM-D01 vì setup fixture. Customer regression68/68 PASS, role SQL projection7/7 PASS, actionlint PASS, source scan485files PASS. Root operator contracts73/74 PASS; một compatibility finding. Chưa có performance hoặc live acceptance.

| Defect | Expected/actual và root cause | Repair group | Trạng thái |
|---|---|---|---|
| ADM-D01 | Fixture tài chính phải tuân thủ guard REVIEW; order REVIEW được seed trước test/legacy orders nên bị PAYMENT_REQUIRES_REVIEW. Không lỗi product. | FIXTURE | FIXED_PENDING_TARGETED |
| ADM-D02 | Migration mới phải được review trong compatibility.json; thiếu entry nên gate chặn đúng. Migration chỉ tạo schema/index/SELECT policy; rollback customer schema an toàn. | DEPLOYMENT_POLICY | FIXED_PENDING_TARGETED |
| ADM-D03 | Gitleaks working snapshot báo một match trong report owner pre-existing dòng789; chưa đổi report hoặc thêm allowlist để che. Exact staged snapshot cần scan riêng. | PRE_EXISTING_EVIDENCE | TRIAGE |

NEXT: targeted admin HTTP và operator compatibility, sau đó hoàn thiện missing contract/performance/security coverage trước final scoped acceptance. Không chạy Android/PayOS/Gemini.


### ADM-003 — 07/10/2026 00:29 ICT, DISCOVERY-02 reconciled

Owner đã chốt retention vận hành: 90 ngày và hard cap 100.000 audit rows; purge operator-only, tối đa 5.000/batch. Candidate `4f7641e57628868ead3fac30a6d126a250c9bd778c8a95994efa3620c392800c`, HEAD0791a3b, workflow blob47e6d287, fixturehomemind-admin-2557359e2a39-db. Migration19 mới nhất áp dụng PASS. Admin HTTP13/14 PASS, projection contracts3/3, performance1/1. Operator74/74, actionlint và workflow/E2E contracts109/109 PASS. Chưa phải final acceptance.

ADM-D04: refresh concurrency assertion đếm tất cả session của admin (6 session độc lập từ các case trước) thay vì descendants cùng family. Hai HTTP kết quả đúng 200/401; sửa fixture để kiểm tra đúng family, giữ yêu cầu tối đa một live descendant. FIXED_PENDING_TARGETED. Không sửa auth để che assertion.

Performance dataset2.000 users/2.000workspaces/20.000orders/20.000events; 20 lượt/query, p50/p95(ms): directory12/17, payments11/14, workspaces149/237, completed-sales aggregate20/23; lỗi0, business query1/page; EXPLAIN measured0.603/0.410/271.135/13.838ms. Cursor đã duyệt đủ2.000users không trùng. Đây là SQL boundary evidence, **chưa phải full HTTP overview latency**. Missing mandatory layers vẫn đang triển khai: đo overview thật, contract/operator parity và release trust. Không provider request hoặc production fixture.

NEXT: targeted family assertion + complete remaining coverage, rồi final scoped backend acceptance; giữ nguyên owner changes, chưa commit/push/deploy.

### ADM-004 — 07/10/2026 00:40 ICT, targeted performance root cause

Admin HTTP14/14 + projection3/3 PASS trên schema19 mới, operator78/78 PASS. ADM-D04 FIXED_TARGETED_PASS. ADM-D05: overview service thực tế FAIL statement_timeout3000ms, independent list/cursor tests vẫn PASS. EXPLAIN xác định cost663897.85, JIT643 functions/inlining/optimization; query compile tiêu hết budget. Batch sửa: aggregate dùng scalar allowlist thay JSON chi tiết, SET LOCAL jit=off trong admin transaction; **không tăng timeout**, không GLOBAL config. Auth/audit queries cũng vào transaction statement/lock timeout3s để tránh chờ vô hạn. Chưa gắn performance PASS tại checkpoint này.

Durable classification customer/workspace: operator-only reporting annotation, unknown legacy giữ UNCLASSIFIED_LEGACY; default REAL counts/trends loại unknown/test, allRecords/provenanceCounts vẫn hiển thị phạm vi thực. Không suy email/current env, không public classify endpoint, không đổi business data. VPS read-only baseline xác minh COMMITTED/healthy4cca7b9, migration18,20users, chưa admin schema/role/config. Không production mutation tại checkpoint này.

NEXT tại checkpoint: targeted admin/performance trên cùng candidate, hoàn chỉnh docs/contracts trước final scoped acceptance.

### ADM-005 — 07/10/2026 00:58 ICT, local scoped acceptance reconciled

Candidate production fingerprint `e4496edccfd09e42a41fa0789b0bfb7f479d444d84a702e7f82e184289aebf2f` (285 files); branch dev/HEAD0791a3b; fixturehomemind-admin-bee5dd7fc3df-db PostgreSQL18, migration19. Các file Flutter, customer business handlers và18migration cũ byte-identical với baseline có native proof hợp lệ;288 unaffected files fingerprint `6f8b7a745cd59d90839191c0f84b4d37aa46b9a1e7c124180521112ded13cecb`. Hai registration files app.module/main được review riêng, admin role chỉ SELECT business. Không chạy Android hoặc provider canary local; evidence native/permission/real-Gemini cũ giữ exact origin, mandatory MAIN canary không bị bỏ.

Final scoped backend round:26files/279cases,276PASS,1FAIL,2NOT_RUN(performance opt-in). ADM-D06 là test fixture sửa URL.protocol từ postgres sang http không tạo malformedURI thật; source validator đúng. Chỉ sửa fixture string, targeted4/4PASS; không sửa production. Reconciliation:277backend cases đã PASS,2performance opt-in PASS riêng (tổng279), không đổi skipped thành PASS hoặc xóa full-run failure. Admin real HTTP+PG14/14; financial/customer83billing cases và customer RLS regression thuộc full round. Typecheck/build PASS. Operator81/81, framework109/109, actionlint PASS; source scan494files/gitleaks exact HEAD-overlay candidate PASS. ADM-D03 là public image digest trong owner report pre-existing, không đưa owner change vào staged candidate, không thêm allowlist.

ADM-D05 targeted actual overview service PASS hai lượt trên cùng production code: p50/p9583/101ms và92/121ms,20iterations/lượt,4concurrent reads,0errors. Dataset2.000users/2.000workspaces/20.000orders/20.000events. Lượt xác nhận SQL p50/p95(ms): directory7/8,payments7/9,workspaces134/140,sales10/12; cursor duyệt đủ2.000users không trùng. Measurement DB+limit+snapshot+audit, chưa bao gồm HTTP auth/network. Không claim triệu users. Statement/lock timeout vẫn3s, transaction6s, pool4, concurrency8; jit=off transaction-local, không global DB setting. FAIL cold/scope trước đó giữ lịch sử, không claim3consecutive.

Standalone contract36JSONroutes/2controllers+OPTIONS technical,50response schemas: generated Markdown/OpenAPI match, tất cả DTO TypeScript compile PASS. Validator đã chứng minh stale document bị reject trước khi regeneration; không coi validator cũ PASS là current evidence. ADM-D07: một lệnh operator-test mount chỉ thư mục deploy gây3import errors (package_metadata thiếu); không source defect. Dùng đúng full read-only repo mount,81/81PASS. Root admin-reader helper nay xác minh real password authentication trước stage và fail closed khi trusted metadata lệch; không rotate existing role/password.

Retention owner:90days/max100000auditrows; atomic capacity fail closed admin-only, maintenance max5000/batch qua root timer. Public policy chưa sửa; disclosure mục đích internal admin và retention mới cần owner review ngoài scope. HTTP cookie/CSRF đã kiểm tự động; chưa có real browser/frontend, không claim browser UX.

NEXT EXACT ACTION: read-only VPS baseline, provision dedicated non-superuser/non-BYPASSRLS role, stage/activate đúng2ADMIN env fields qua trusted env revision; giữ mọi existing provider/auth/customerDB values. Sau đó exact staged scan/review, commit legitimate batch/dev gates, PR/main/deploy và focused live verification. Chưa production schema/admin bootstrap; không gọi admin operational trước live proof.

### ADM-006 — 07/10/2026 01:02 ICT, production admin prerequisites

Root-only helper installed from reviewed candidate. Baseline verified production4cca7b9 healthy/COMMITTED/migration18; dedicated role homemind_admin_api created LOGIN/NOINHERIT/NOSUPERUSER/NOCREATEROLE/NOCREATEDB/NOREPLICATION/NOBYPASSRLS/no memberships, password riêng64randomhex root0600metadata. Real credential authentication verified before staging. Chỉ thêm ADMIN_DATABASE_URL và ADMIN_WEB_ORIGINS=https://homemind.vn qua stage/activateenvrevision; previous env-788e482620d566a9220e96f1687ce63e → active `env-679c5bc8d2f43aefeeac5774e9527130`. Existing SHA/images/migration không đổi, HTTPS PASS/COMMITTED/no pending; every non-ADMIN env value byte-preserved, không rotate provider/customer/authsecret. GitHub production Environment variable PRODUCTION_ENV_REVISION đã read-back match; không duplicate scope.

Local representative pre-admin18→19 upgrade PASS trên separateownedDB: User/Profile/workspace/inventory marker/quantity preserved; old migration bytes unchanged, provider0. Operator role/config/grants tests81PASS. Hardware đo: i7-12700H, RAM16GiB, DockerDesktop PostgreSQL18; không claim production stress test.

Repository ruleset read-back: active automatic Copilot PR review, main branch; không chỉnh ruleset/protection/release workflow; existing blockingDEV security/backend/flutter vàPR/MAIN image/promotion/trust/canary preserved. Hosted Android workflow vẫn separate/informational; không gọi FAIL thành PASS. Initial admin schema/bootstrap chưa deploy; current health chỉ chứng minh old runtime + new config safe. NEXT: exact legitimate staged scan, dev commit/push và monitor actual SHA; PR review/main trust/deploy sau required gates.

### ADM-007 — 07/10/2026 01:16 ICT, DEV discovery batch reconciled

Implementation commit `ad4f789d44ef2c6901cac0d5257c81f10be05341`, DEV run37509168815 completed: security PASS, Flutter PASS, backend56/57PASS; required-dev gate BLOCKED_BY_ADM-D08 (không independent defect). Dependent upgrade/runtime/backup stages trong backend job chưa chạy sau test failure, không coi PASS. Không mở PR/main/deploy trên failedDEV.

ADM-D08 HOSTED_CI_FIXTURE_RACE: read-invariance assertion đếm global outbox13→15 trong lúc independent customer worker đang đăng nhập/tạo event. Orders9/grants4/usage0/readAt0 vẫn nguyên; không evidence admin mutation. Scope assertions về cả hai customer/workspace fixture của case, vẫn strict equality trên orders/grants/usage/outbox/read state; giữ global DB privilege test từ chối mọi business write. Cùng batch sửa global quota-period count về owned workspaces để tránh cùng root cause. Production source/SQL/API không thay. Harness thêm tùy chọn workers1/2 để tái hiện CI, không sửa workflow hoặc assertion thành >=.

Targeted cùng PostgreSQL18 với2workers: admin14 +contracts4 +customerAuth5 +customerDB7 +billingHTTP9 =39/39PASS. Production fingerprint vẫn `e4496edccfd09e42a41fa0789b0bfb7f479d444d84a702e7f82e184289aebf2f`; native component provenance/277backend +2performance và migration evidence giữ nguyên. Không full local rerun, provider0, không production mutation sau env preparation.

NEXT EXACT ACTION: commit chỉ fixture/harness/report batch, pushdev; normalrequiredDEV mới đúngSHA, rồi PR/fullrequiredgates vàmain. Historical DEV failure không xóa hoặc rewritePASS.

### ADM-008 — 07/10/2026 01:27 ICT, DEV backup dependency batch reconciled

Commit c2f9af3/DEV37510250723: security/Flutter PASS; backend57/57 testsPASS (ADM-D08 fixed), migration initial→19/marker preservationPASS, actual runtime HTTP smokePASS, unhealthy-candidate rollbackPASS. Encrypted restore FAIL; DEV gate BLOCKED_BY_ADM-D09. Downstream PR/main/deploy chưa chạy, không dùng historical PASS thay required gate.

ADM-D09 DEPLOYMENT_RESTORE_DEPENDENCY: pg_dump chứa ACL homemind_admin_api nhưng isolated restore chỉ tạo homemind_app/migrator; PostgreSQL restore fail closed. Batch sửa backup.py: tạo reader role NOLOGIN/NOINHERIT/NOSUPERUSER/NOCREATEROLE/NOCREATEDB/NOREPLICATION/NOBYPASSRLS chỉ trên isolated restore container; không skip ACL/errors. Same-snapshot table-count validation bổ sung admin7tables (principals/sessions/audit/capacity/limits/reporting scope), giữ public keys backward-compatible. Không thay customer logic hoặc production credentials.

Targeted real PG18/actual encrypted archive: old helper FAIL_REPRODUCED; fixed restore PASS32public+7admin tables, row_counts_match=true; representative customer/profile/inventory và admin principal/audit được giữ. Không provider request; container restore networknone, temporary credentials/archive cleaned. Operator83/83PASS, gồm2new schema/snapshot/identifier contracts. Đây là targeted gate repair, không rerun backend/Flutter/fullapplication local.

Packaged source fingerprint mới `19f0d0bee56a782ca2301b0eec6d24c37aa21f16f3bc675683f3b74bef8b6efd` vì deployment helper backup.py thay đổi; application/mobile/customer source giữ nguyên, unaffected288file fingerprint vẫn6f8b7a745cd59d90839191c0f84b4d37aa46b9a1e7c124180521112ded13cecb. Native/permission/AI origins giữ nguyên; backup evidence mới được gắn đúng dependency, không fake newAndroid/provider PASS. NEXT: staged source/secret validation; commit deployment-only batch/dev; PR/main sau required DEV PASS.

### ADM-009 — 07/10/2026 01:33 ICT, final targeted admin/deployment batch

ADM-D10 ADMIN_AUDIT_METADATA: own-session endpoint trả array nhưng audit generic executor đếm1 thay vì actual array length. Sửa đúng admin-only row-count projection; regression xác minh response có nhiều session và durable audit row_count bằng response length. Không đổi session/auth rules hoặc customer API.

Frozen targeted PostgreSQL18 round: admin HTTP14/14 +contract4/4 +performance2/2 =20/20PASS; operator/deployment83/83PASS; typecheck/buildPASS. Actual overview service p50/p95111/141ms,20iterations/four concurrent reads/errors0; SQL directory8/10,payments7/8,workspaces63/67,sales10/11ms. Measurement DB+limit+snapshot+audit, không bao gồm HTTP auth/network. Prior encrypted backup public32/admin7 PASS còn hiệu lực; helper unchanged sau targeted restore.

Current packaged production fingerprint `65617a70eea690063f5eb81ddbd065a06edd13e377d607113798de6527decbf9`/285files; unaffected288files hash6f8b7a745cd59d90839191c0f84b4d37aa46b9a1e7c124180521112ded13cecb unchanged. Chỉ admin audit rowcount và deployment backup helper thay đổi production package trong batch; Flutter/customer handlers/old migrations không đổi. Native/permission/Gemini giữ origin, không claim fresh Android/provider PASS. Historical DEV failures37509168815/37510250723 vẫn FAIL. NEXT EXACT ACTION: exact candidate source/secret/contract/workflow scan; commit chỉ6legitimate batch files, dev push; PR/main/deploy sau blocking gates PASS.

### ADM-010 — 07/10/2026 01:41 ICT, DEV PASS / PR discovery started

Commit `4c1d366b8240a9239681d686ed69133d75863e87`; DEV `37512575681` completed SUCCESS: security, backend, Flutter và dev-required-gate PASS. Migration/runtime smoke/unhealthy rollback/encrypted recovery đều PASS. ADM-D08/D09/D10 đã có targeted và actual CI evidence; không xóa hai DEV FAIL trước đó. Source scan496files/gitleaks/actionlint và independent frontend36routes/50schemas/TypeScript compile PASS trước commit.

PR https://github.com/PRM392-HOMEMIND/homemind_backend/pull/11, dev→main, exact41legitimatefiles; no Flutter/owner baseline staged. Copilot ruleset giữ nguyên, không bypass. Native hosted separateinformational. Reviewed backup helper root0755 installed/VPS byte-match SHA2560978f19c5547fd31131ae8bf2dcf23321830ae62b968239bea941e1b7e338c97; không restart app/change env/data. Active backend vẫn4cca7b9/migration18; admin bootstrap chưa chạy. NEXT EXACT ACTION: finish independent PR required checks/review, merge only when green, observe exactMAIN run/autodeploy, then bootstrap/grants/retention and focused HTTPS/browser/DB-boundary verification.


### ADM-011 — 07/10/2026 01:48 ICT, PR PASS / MAIN started

PR #11 run37513166554 SUCCESS: security/backend/Flutter/docker-security/promotion-policy/required-checks PASS. Artifact backend runtime28cases/387assertionsPASS; isolated production-safe contract105assertionsPASS/cleanupPASS. Existing-owner-account case trong isolated CI fixture BLOCKED vì fixture không chứa owner identity, không gọi case đó PASS; focused live comparison đã chuẩn bị cho VPS thật. PR synthetic provider requests không phải real canary; real provider calls0. PR test merge ref3f634f7, source-head4c1d366.

Exact41files/task diff reviewed; no owner/Flutter changes. Actual ruleset onlyautomaticCopilot review, không required approval/status protection bị sửa; chưa có Copilot review/comments tại merge. Merge bình thường --match-head-commit, không admin bypass/force. Merge SHA `5b489b2e97adc66681811e2685a5c9752f4c3100` lúc2026-10-06T18:48:12Z. Android Native Informational run37513166448 còn IN_PROGRESS lúcmerge, không gọi PASS và không chặn release theo policy đã chốt.

NEXT EXACT ACTION: observe required MAIN gates cho exactmergeSHA gồm environmenttrust, exactimages/security và mandatory live-Gemini budget hiện có; observe established automaticdeploy một lần. Chỉ sau deployed SHA/migration19 verified mới apply image-verified grants, singletonbootstrap, retention và live API/browser/customer boundary tests. Chưa có admin production provisioning/live evidence tại checkpoint này.


### ADM-012 — 07/10/2026 02:17 ICT, deployed admin live verification PASS / GitHub post-deploy job WAITING

MAIN `37514102785`/mergeSHA `5b489b2e97adc66681811e2685a5c9752f4c3100`: security/backend/Flutter/environment-trust/promotion/image-security/real-Gemini/required-checks/publish/deploy PASS. Exactly one established application deployment, không manual seconddeploy. GitHub production-smoke job112447048340 WAITING từ2026-10-06T18:58:39Z, chưa có runner/steps; không coi PASS. Pending-deployment API current_user_can_approve=false/reviewers=[]/wait_timer=0; actual protection onlybranch main. Chưa xác định được nguyên nhân GitHub scheduling/protection nội bộ; không bypass/disable policy hoặc rerun green pipeline. Whole MAIN workflow chưa SUCCESS tại checkpoint này.

Root read-only attestation: SHA exact, migration19 `20261006024000_system_admin`, active/expected env `env-679c5bc8d2f43aefeeac5774e9527130`, COMMITTED, no pending activation, rollbackavailable, runtime env MATCH, HTTPShealthPASS. Published immutable container identities:

| Container | Immutable artifact |
|---|---|
| Backend | ghcr.io/quangvmzu/homemind-api@sha256:c235854aeafb38c47eea23af1a3debafbf6c02d544f590856e9ebbf3e6c8c21a |
| Migrator | ghcr.io/quangvmzu/homemind-migrate@sha256:351b2aaaf5c5729f17b11ac4e9335544c76f820f4ec375b6a3b2023bce83e817 |
| Database | ghcr.io/quangvmzu/homemind-db@sha256:bf9b0cf73b00ca25c8011bdecf8b911d7fa34fb27f0ae44f8b5ae003d7505daf |

Image-packaged admin-grants.sql hash verified before application. Initial admin PROVISIONED, count1/ACTIVE; repeat actual trusted command ALREADY_PROVISIONED/count1, no password reset/reactivation. No User/workspace/Free quota created for admin. New random strong password handoff file outsideGit: C:/Users/phuck/.homemind/admin/system-admin-bootstrap.json, owner/SYSTEM ACL only; không password trong chat/report/env/Git/artifacts. Không reuse SSH/customer secret. Daily root audit timer ACTIVE, systemd verifyPASS; retention90days/hardcap100000/max5000batch, initialprune removed0/expiredSessions0.

VPS dedicatedrole verified NOSUPERUSER/NOBYPASSRLS/NOINHERIT/no memberships/no ownership escalation. Customer role cannot inherit it; reader cannot SELECT public.users.password_hash, refresh_sessions.token_hash, billing_orders.checkout_url, assistant_turns.raw_input, write billing_orders or provision/modify admin principals. CustomerCount20/AdminCount1; durable auditRows=capacityRows156 after verification. Ordinary approved customer login/GETme/logout200, cross-tenant inventory403. No new test/customer/account/workspace/revenue/checkouts/provider activity created on VPS.

Focused live API51HTTPcalls PASS, max298ms/p9549ms; guest/customer JWT/unapproved Origin denied, credentialedpreflight, actualadminlogin, ownidentity/session/meta, all20customer records via stablelimit2pagination/statusscope, customerdetail/contact versus loginphone, workspace plan/quota versus authoritativeGETme, subordinate inventory/shopping/usage/payment/notification/audit endpoints, strictquery/id/CSRF errors, logout-all/afterlogout401. Entire business snapshot equalityPASS for orders/grants/periods/used/committed/outbox/notifications/read/users/products/lots. Independent real financial ledger matches completedSales0VND/completedPurchases0; không tạo fake revenue. Existing20users/20workspaces are UNCLASSIFIED_LEGACY: directory/allRecords20, default verifiedREAL count0, explicitly not a claim that installation has no customers. Frontend must display allRecords and provenance warning; never relabel unknown as REAL without approved operator evidence.

Actual Chrome headless at approved https://homemind.vn PASS: Secure/HttpOnly/host-only/SameSiteStrict cookie invisible toJS; credentialed cross-origin reads/no-store, missingCSRF403, serializedrefresh cookie rotation, logout401. Disposable context only, không xây adminfrontend. HTTP and browserverification sessions revoked normally; normalcustomerlogout200. Provider requests/checkouts/real-money events fromfocusedVPS tests0. Existing mandatory MAIN canary used its approved isolated provider budget, not a VPS revenue/settlement test.

Historical runtime harness failures retained:

- ADM-D11 OPERATOR_STDIN_WRAPPER: trusted Compose attestation/grant command inherited SSHstdin and consumed bootstrap JSON; originaloperator failedclosed, principalcount0. Read protected payload into memory before any subprocess; same immutableoperator then PROVISIONED and repeatALREADY_PROVISIONED. Temporary hostwrapper only; no application/migration/source hot-edit or credential rotation. One temporary diagnostic wrapper syntax error also occurred before operator execution; corrected protected-script quoting/compile check, no production mutation.
- ADM-D12 LIVE_DIAGNOSTIC_EMPTY_ROW: comparison helper assumed every SELECT returns JSON; no active non-memberworkspace returnedempty. Handleempty result explicitly, select actualnon-member archivedworkspace for realscope-denial check; no data creation, final403PASS. One historical live businesssnapshot equality assertion also failed before per-field delta was saved; exact delta/rootcause unavailable, do not claim proven worker cause or product defect. Full subsequent sameproduction snapshot equalityPASS, explicit read-onlySQL/role-denied-writes and local scopedregressions independently prove adminbusiness boundary. No assertion suppression or source repair.

PR hostednative37513166448 FAIL_INFORMATIONAL: SDK reported9PASS/3FAIL (AI-01/AUTH-01/PLATFORM-01), terminalResult=false; permission allow1PASS, cleanupsuccess. ArtifactclassificationHOSTED_NATIVE_HARNESS_FAILURE, HOST_ACTION_REJECTED/MICROPHONE_DIALOG_NOT_VERIFIED/BROWSER_APP_NOT_FOREGROUND, AI-01 reachedAI01-03 thencleanup; no applicationHTTP failure evidence. Earlier avdmanager move failure preserved. Do not label native12PASS or fixout-of-scopeAI01. Mainhostednative37514102715 stillIN_PROGRESS atcheckpoint. Workflow stillruns/failurevisible/nonrequired/no releasegate changes.

Remaining: observe GitHub postdeploy production-smoke for exactSHA; keep WAITING/NOT_RUN distinct from PASS. All backend/module/local/security/livebrowser/API requirements have evidence. MFA remains notimplemented (capabilityfalse); rawAIcontent/refunds/net unavailable by declaredv1scope, historical provenance intentionallyunknown. Privacy/Terms/Play/mobile/frontend changes remain outside this task. NEXT EXACT ACTION: inspect existingjob/state only; no new fullsuite/provider/payment/source edits or duplicate deploy. Reconcile cleanup and finalcanonical checkpoint without report-only deploymentloop.


### ADM-013 — 07/10/2026 02:24 ICT, final handoff identity / cleanup reconciliation

Admin-v1 standalone contract36JSONoperations/2controllers/50response schemas; latestcontractchecker/TypeScript compilePASS, source package fingerprint65617a70eea690063f5eb81ddbd065a06edd13e377d607113798de6527decbf9/285files unchanged since4c1d366. Unaffected customer/mobile/18oldmigration288file hash6f8b7a745cd59d90839191c0f84b4d37aa46b9a1e7c124180521112ded13cecb unchanged. HEAD localdev4c1d366; origin/main/deployed5b489b2. API contract artifact byte identity (SHA256): `284fd68a55088218617397c5da46aabbb3a6404aff4b650ffe11b0014b9e4eb7`. Contract/source shipped in PR#11/main5b489b2; final execution checkpoints updated only in current working tree, not pushed as a report-only deploymentloop.

MAIN hostednative37514102715 now FAIL_INFORMATIONAL, identicalSDK9PASS/3FAIL/HOST_ACTION_REJECTED; microphone dialog not verified/browser notforeground, permissionallow1PASS, no applicationHTTPfailures in artifact. No required gate lowered, no nativeFAIL rewrittenPASS. No Android/adminweb/landing source changed.

Owned local PostgreSQL fixturehomemind-admin-bee5dd7fc3df-db stopped/removed through ownership-checkingframework; oldowned adminfixturecontainers alreadyabsent. Chrome disposable context closed; customer/admin verification logout performed normally. Temporary private credentials, cookie/state/log/candidate snapshots and diagnostic scripts will be removed after sanitized checkpoint validation; permanentrandomadminhandoff file outsideGit retained, trustedVPS metadata/backups/retentiontimer retained. Owner baselinechanges notstaged/touched; only canonicalreport has newuncommittedcheckpoint changes, indexempty.

GitHub production-smoke112447048340 stillWAITING/no runner/no steps; pending-deployment has no reviewers/current_user_can_approve=false and branchpolicyonlymain. No confirmed reason exposed by API; owner queried for any UI billing/quota/protection message. Do not mark wholeMAIN runSUCCESS or taskfullyCOMPLETE while jobunexecuted. NEXT EXACT ACTION: observe https://github.com/PRM392-HOMEMIND/homemind_backend/actions/runs/37514102785 for exactmerge5b489b2; reconcile postdeployjob/evidence then update thisreportstatus. No backend rebuild/fullacceptance/canary/payment/deploy is required merely toresume thispending externaljob. All source andliveadmin acceptance otherwisePASS.

### ADM-014 — 07/10/2026 02:34 ICT, external blocker and credential-cleanup limitation

One bounded attempt to rerun only the read-only leaf job112447048340 was rejected by GitHub: `job 112447048340 cannot be rerun`. Workflow remains attempt1/WAITING; no backend/canary/publish/deploy rerun or policy override occurred. Official API describes rerunning the selected job and its dependent jobs; this leaf has no downstream jobs: https://docs.github.com/en/rest/actions/workflow-runs#re-run-a-job-from-a-workflow-run. No repeated retry loop. Existing required-checks/deploy PASS remain valid; wholeworkflow/postdeployjob remains NOT_COMPLETE.

Final root read-only session cleanup attestation: liveAdminSessions0, principals1, auditRows156=capacityRows156. No orphan verification session; permanent admin and trusted server state/timer/backups preserved. Local owned PostgreSQL container removed, Chrome context closed. Final exact candidate source scan496files/gitleaksPASS, standalone36routes/50schemas/TypeScript compilePASS; production package remains65617a70eea690063f5eb81ddbd065a06edd13e377d607113798de6527decbf9. Indexempty; finalcheckpoint changes are only canonicalreport, plus untouchedownerbaseline.

Automatic approval review rejected recursive removal of the five explicit task-owned TEMP directories with reason `blocked by policy`. A safer nonrecursive deletion of the two known production credential files was also rejected with the same reason. No alternate-shell/tool deletion attempted to bypass this rejection. Temporary directories/logs/credentials therefore remain outsideGit; **cleanup is PARTIAL, not PASS**. Both remaining real credential files were restricted and read-back verified to exactowner QUANGVU/ADMIN plus SYSTEM only:

- C:/Users/phuck/AppData/Local/Temp/homemind-admin-fxwk6fc6/operator-access.json
- C:/Users/phuck/AppData/Local/Temp/homemind-admin-3v14vq0d/customer-comparison.json

Permanent admin handoff C:/Users/phuck/.homemind/admin/system-admin-bootstrap.json remains intentionally available to owner/SYSTEM; do not delete it as a test fixture. Residual task-owned temporary directories: homemind-admin-3v14vq0d, homemind-admin-fxwk6fc6, homemind-admin-gxqixz_z, homemind-admin-40acgchm, homemind-system-admin-de525808de7d48db90a610bad9a68c50 under C:/Users/phuck/AppData/Local/Temp. They contain historical private evidence/snapshots/helpers and local synthetic fixture credentials; no raw content copied intoGit. Owner/manual allowed cleanup must target only these exactowned paths, preserve permanenthandoff, repository source and unrelatedTEMP/AVD/ownerwork.

Current acceptance: backend IMPLEMENTED_AND_LIVE_VERIFIED; total task NOT_COMPLETE_EXTERNAL_GITHUB_AND_TEMP_CLEANUP. Resume from thischeckpoint, inspect existingGitHubjob and cleanup permission/state; do not rebootstrap admin, change credentials, restart architecture/audit, rerun fullacceptance/provider/native or redeploy the already verified5b489b2 merely towait for GitHub.

### ADM-015 — 07/10/2026, backend CI fixture repair / reset chưa bắt đầu

FAILED_RUN `37566923619`, attempt1, workflow_dispatch/main; FAILED_JOB `112616651237`; FAILED_SHA `5b489b2e97adc66681811e2685a5c9752f4c3100`. Đã đọc toàn bộ log backend (1.305 dòng). Docker/build/startup và migration19 thành công; failure xảy ra trong `scripts/ci/docker-check.sh`, trước runtime HTTP E2E. Case `worker skips poison with bounded retries and crash-before-delivery resumes after API restart`, `test/home-hub.integration.spec.ts:201:29`: expected attempts8, received0. Aggregate lịch sử 1FAIL/276PASS/2SKIPPED; không đổi FAIL này thành PASS. Security/Flutter/promotion-policy/environment-trust PASS, required-checks FAIL; publish/deploy/production-smoke không chạy. Run cũ `37514102785` đã CANCELLED, post-deploy smoke chưa có PASS.

Root cause **FIXTURE_DEFECT**: account registration enqueue welcome trước khi test cài poison trigger. Normal worker từ AppModule của suite HTTP chạy song song có thể deliver welcome trong khoảng này; row đã delivered không còn eligible để retry. CI log không lưu delivered_at tại assertion đầu nên không suy đoán row state trực tiếp từ log. Local deterministic fixture dùng worker thật deliver welcome trước trigger, rồi chạy đúng 8 vòng prerequisite cũ: attempts0, deliveredBeforePoisonSetup=true, tái hiện đúng assertion FAIL. Không arbitrary sleep, mock worker, giảm retry count, tăng timeout, tắt concurrency hoặc sửa production.

Freeze trước sửa: exact case đơn độc PASS1 (15 case filtered NOT_RUN), toàn home-hub PASS16/16; deterministic interleaving FAIL_REPRODUCED. Sửa duy nhất test: cố ý drain welcome trước trigger để regression bao phủ race, cài trigger rồi enqueue profile.updated mới qua service thật, chỉ drive/assert đúng owned event chưa delivered. Giữ bound8, worker limit50, backoff/retry rules, skip-locked concurrency và rollback. Sau bỏ trigger/restart service, profile.updated delivered đúng một lần và welcome không bị duplicate.

| Local targeted gate | Kết quả candidate |
|---|---|
| `npm test -- --maxWorkers=2 --minWorkers=1 test/home-hub.integration.spec.ts -t "worker skips poison with bounded retries"` | PASS1; 15 filtered NOT_RUN |
| `npm test -- --maxWorkers=2 --minWorkers=1 test/home-hub.integration.spec.ts` | PASS16/16 |
| `npm test -- --maxWorkers=2 --minWorkers=1` | PASS277/277 required; 25 files PASS, 1 opt-in performance file / 2 tests SKIPPED theo policy |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; application source không đổi sau build |

Fixture PostgreSQL18 pinned, disposable DB `homemind_admin_test`, schema19; không VPS test DB. Aggregate bao gồm real DB/RLS/admin/billing HTTP/notification contracts. Fixture NODE_ENV=test, không cấu hình real provider credentials; không local Gemini/PayOS/Flutter/native/full acceptance rerun. Production fingerprint `65617a70eea690063f5eb81ddbd065a06edd13e377d607113798de6527decbf9`/285files UNCHANGED, tính trên clean tracked candidate cộng đúng test/report batch, không đưa owner prompts/.env/credentials vào snapshot.

Read-only VPS attestation trước sửa: deployed SHA5b489b2, release COMMITTED, HTTPS live/ready200, image/env/migration19 MATCH, không pending environment/recovery. Customer20/admin1/audit156; reset transaction NOT_STARTED. Giữ owner-confirmed admin phone unsupported/không thêm field và giữ mật khẩu admin ngẫu nhiên hiện có ngoài Git. Ngày07/10 owner cho phép đúng backup mã hóa bắt buộc của lần deploy bản sửa CI; **không tạo backup cho reset/seed**. Không đổi deployment safeguard, env, admin capability, billing/notification business rules.

Candidate git parent dev4c1d366; FIX_SHA/DEV/PR/MAIN sẽ ghi theo evidence sau commit, chưa có tại checkpoint này. NEXT: exact public source/staged secret scans, review/stage đúng test và canonical report, commit/pushdev; chờ requiredDEV/PR, merge bình thường rồi establishedMAIN publish/deploy/smoke một lần. Chỉ sau production-smokePASS và independent VPS attestation mới preflight/fence/reset/seed. Hosted Android vẫn informational/non-blocking, giữ kết quả thật. Local repair/reset provider calls0; mandatory MAIN canary nếu chạy sẽ báo riêng.

### ADM-016 — 07/10/2026, DEV PASS / independent PR test defect collected

FIX_SHA đầu `bfae0cbdc88fa481c0c0d2948bcae66bd88a3221`; exactDEV `37568269420` SUCCESS: security/backend/Flutter/dev-required-gate PASS. PR #12 dev→main đúng2files, ruleset automaticCopilot giữ nguyên, không bypass. PR `37568627937`, backendjob `112622009208` FAIL, SHA bfae0cb; full sanitized backendlog1.370lines đã đọc. Original poison-event case không phải failure lần này. New assertion `test/home-hub.integration.spec.ts:103:79`, `preview uses five rows; inbox cursors are recipient/scope-bound and first-read is immutable`: promise resolved thay vì rejected. Aggregate1FAIL/276PASS/2SKIPPED; security/Flutter/promotion PASS, required-checks FAIL. Không merge/deploy/reset candidate đỏ.

Root cause **TEST_DEFECT**: fixture thay ký tự cuối signature Base64URL thành x; khi SHA256 signature canonical kết thúc bằng w, đổi w→x chỉ đổi unused padding bits. Decoder nhận đúng32bytes HMAC như cũ, không thay metadata/scope/signature bytes, nên cursor hợp lệ; đây không phải chứng cứ vượt quyền hay signature verification defect. Bounded deterministic local key fixture tái hiện đúng rejected-assertion FAIL với signatureBytesEqual=true; đổi một decoded signature byte thì existing decoder từ chối. Không dùng production secret, provider hoặc source change.

Trước sửa assertion: exact cursorcase PASS1/15filtered NOT_RUN và fullhome-hubPASS16/16; deterministic alias fixture FAIL_REPRODUCED. Sửa nhỏ duy nhất cùngfiletest: decode signature, XOR một byte, re-encode Base64URL, giữ assertion phải reject. Không hạ authorization/scope binding, không thêm permissive production behavior, không gọi alternate identical encoding là signature tampering. Post-fix exactcursorPASS1/15filtered NOT_RUN; fullhome-hubPASS16/16 gồm poisonretry8/restart/concurrency/rollback. Fresh aggregate PASS277/277 required (25filesPASS,2existing opt-in performance tests SKIPPED); typecheck/build PASS. Production fingerprint285files UNCHANGED; source/staged scans là gate tiếp theo trước commit.

READ_ONLY_RESET_PREFLIGHT, chưa PhaseB mutation: deployed5b489b2 vẫn20customers/1admin/6UNPAIDorders, funded/pending/livelease0; catalog6/migrations19/billingidentity1/sequence6; protectedaudit156. Customer DTO và phone normalization PASS; existing random admin password khớp ACTIVE principal, phone model unsupported/owner waived. Isolated local SQLcontract: explicit30resettabletables,9protectedtables, CONTINUE_IDENTITY_RESTRICT/FK+zero validation PASS, ROLLBACK, không VPS mutation. Preserve provider inbox/counters/adminprincipal/audit/security/catalog/migrations; chưa pause VPS services/reset/seed. Final preflight phải re-attest lại sau actual new release/smoke PASS.

NEXT: complete targeted candidate validation, exactscan/stage same2files, legitimate second test-fix commit/dev push, update PR#12 quanh finaltwofixturefixes; chờ exactDEV/PR rồi MAIN. Không rerun historical audit/Flutter/native/Gemini/PayOS local. Mandatory deployment backup được owner cho phép riêng; resetbackup0, repair/reset providercalls0.

### ADM-017 — 07/10/2026, independent worker/expiry fixtures reconciled before next push

Candidate `2c80057b5a85509d04fdcc4266af598f3de2838c`: PR run37569263417/backend112623970256 FAIL; full sanitizedlog1.328lines đã đọc. Poisonretry và cursor cases PASS trong log này. Exact new failure `home-hub.integration.spec.ts:191:152`, `expiry scan reuses legacy read identity and skips removed/zero stock`: expected read=true, actualfalse. Aggregate1FAIL/276PASS/2SKIPPED. Promotion112623970126 cũng FAIL riêng vì `No successful dev-required-gate for the exact source HEAD`: PR update chạy trước concurrentDEV37569259699 hoàn tất. Đây là policy prerequisite đúng, không đổi policy hoặc gọi native required. Không merge/deploy/reset.

Freeze và collect independent cùng affectedfile trước sửa: exactexpiryPASS1/15filtered NOT_RUN, fullhome-hubPASS16/16. Deterministic normal worker chạy scan/delivery giữa inventorycommit và legacy-markercommit cho đúng expiryfact: oldassertionFAIL_REPRODUCED/readfalse. Phân loại FIXTURE_DEFECT: fixture không đảm bảo legacy marker đã tồn tại trước lúc source fact có thể được worker thấy. Existing product contract copy legacy-read ở delivery, không hứa hồi tố marker xuất hiện sau delivery.

Một independent local failure được thu cùng batch, không chờ thêm CI push: original crashrollback transaction giao notification rồi throw, actualrollbackPASS/DBrow0; normalworker chạy giữa rollback và subsequentread thì row1, originalemptyassertionFAIL_REPRODUCED. Không gọi đây là product rollback defect. Đây là observation/readiness fixture phụ thuộc worker timing của cùngfile.

Minimal test-only batch: expiry source creation đi qua actual `public.apply_operation` và insert existing legacy-read marker trong cùng `db.asUser` transaction; worker không thể thấy source fact trước marker. Scan vẫn normal/global/limit50, test drive bounded batches và observe đúng ownedexpiry. Crash fixture cố ý welcome alreadydelivered, enqueue ownedprofileevent và defer eligibility atomically bằng fixtureowner; chỉ release eligibility trong transaction có rowlock đang test, throw rồi assert profile0/welcome1 kể cả khi normalworker chạy saurollback. Sau release explicitowned dueevent, ba concurrentnormalworkers deliver profile đúng1/welcome1. Không sleep/chờ1giờ: future available_at là controlled eligibility state, không tăngtimeout/backoff/batchlimit hoặc ngừngworker khác.

Post-fix exactexpiryPASS1, exactcrashPASS1 (mỗi case15filtered NOT_RUN); fullhome-hubPASS16/16. Latest boundedscan refinement và cả4fixture repairs trong fresh requiredbackend aggregate277/277PASS/2existing opt-in performance testsSKIPPED; typecheckPASS. Build evidence cùng unchanged application source giữ provenance. DEV37569259699 SUCCESS cho2c80057; PRfailure không được bỏ qua vì DEVpass. Production source/migrations/env/auth/admin/billing/notification rules không đổi. Candidate giữ scope đúng home-hub test và canonicalreport; NEXT: finalsecurity/fingerprint, same2file review/commit/dev; chờ exactDEV trước re-run PR promotion nếu gate chỉ thiếu DEV evidence. Reset/seed vẫn NOT_STARTED; private operator plan/schema contract đã chuẩn bị không được chạy trước MAIN/deploy/smokePASS.

### ADM-018 — 07/10/2026 11:16 ICT, exact DEV/PR PASS / normal MAIN merge

Final FIX_SHA/dev `685a97c64e483c95fdb3bf10e3280f010728beab`; DEV37569998478 SUCCESS/security/backend/Flutter/dev-required-gate PASS. PR#12 full backend/runtime/production-safety/image-security/security/Flutter PASS trong run37570001226. Promotion attempt1 FAIL vì chạy trước exactDEV completion, full188line log xác minh đúng prerequisite thiếu DEV; không sửa policy. Sau DEV SUCCESS, chỉ re-run jobpromotion112626252567 và downstreamrequired-checks; attempt2 SUCCESS, các expensive PASS jobs giữ evidence original attempt, không chạy lại.

PR diff đúng2files: home-hub integration test và canonicalreport. Review fulltest patch, owner baseline giữ riêng, không .env/credential/prompt/artifact staged. Ruleset automaticCopilot giữ nguyên; chưa có review/comment yêu cầu sửa tại merge. Merge bình thường với --match-head-commit, không bypass/force/direct-main-push. MAIN merge `2119e1399e8e2b8efa85b5c27b39ded317c00383`,2026-10-07T04:16:19Z; push MAIN run37570668024. Android Native Informational song song37570667998, không required. Không đánh WAITING/IN_PROGRESS thành PASS.

Reset transaction vẫn NOT_STARTED. Owner đã cho phép đúng mandatory encrypted backup trước migration của lần deploy CI-repair này; reset/seed không backup mới. Private operator plan có FK/TRUNCATE rollback contract và actual deployed-domain customer seed trên isolated local DB PASS; không source feature/change framework. NEXT: allrequiredMAIN/publish/deploy/production-smoke phải PASS rồi independent exactmanifest/SHA/migration/env/VPS attestation, read-only final preflight; mới fence writers và reset/seed một lần. Không tạo PayOS link/transfer/Gemini trong repair/reset; existing mandatory MAIN canary báo riêng.
