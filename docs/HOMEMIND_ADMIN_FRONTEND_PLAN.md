# HomeMind — Kế hoạch frontend quản trị

Checkpoint 2026-10-07: đã triển khai; đang hoàn thành kiểm chứng candidate và gate phát hành. Không coi checkpoint backend lịch sử là lệnh thao tác.

## Nguồn và phạm vi

- Giữ repository `QuangVMZu/HomeMind_LandingPage`, baseline frontend `281e1de11af8e6d55691fb9495e87ceae0365a8a`, nhánh `feat/homemind-admin-web`.
- Đã đọc toàn bộ hai hợp đồng được cung cấp, parse OpenAPI: 36 JSON operations, 51 schemas. OPTIONS là cơ chế kỹ thuật, không có màn hình riêng.
- Giữ trang chủ, privacy, terms, favicon, nội dung, tài sản và SEO public. Không lấy số liệu marketing làm số liệu admin.
- Không sửa backend, database, Flutter, PayOS/Gemini hoặc chạy reset/bootstrap lịch sử.

## Kiến trúc

- Next App Router hiện hữu; route group `(admin)`, route mỏng, feature modules và layout riêng. Public không khởi tạo API admin. Lenis chỉ chạy trên public.
- `src/lib/admin-api`: generated types và operation metadata từ OpenAPI; validator required/type/nullable/enum/version; allowlist query riêng từng operation. URL = origin API + path đầy đủ từ OpenAPI.
- `src/lib/auth`: guarded client boundary vì cookie API host-only không có trên host frontend. Cookie do browser quản lý, CSRF/identity/vocabulary chỉ trong RAM. Web Locks serialize unsafe auth giữa tab; BroadcastChannel chỉ truyền tín hiệu và thời điểm, không truyền token.
- Tối đa 4 request đồng thời, queue tối đa 32, deduplicate GET đang chạy, hủy theo route/session, search debounce 600ms. Budget client 100 privileged reads/phút, có phối hợp tab; backend vẫn là nguồn giới hạn cuối cùng 120/phút.
- Không retry mutation. GET 503 chỉ retry một lần sau 700ms. 429 chờ ít nhất 60 giây và Retry-After. 401/403 terminal xóa state, hủy request; không có vòng refresh tự động.
- Khoảng ngày [from,to), UTC Z khi gửi; picker UTC+7 hoặc UTC rõ ràng; date-only không đổi timezone. VND dùng chuỗi số nguyên/BigInt; chỉ scale số nhỏ ở biên vẽ biểu đồ. Quantity giữ chuỗi decimal.
- UI chỉ hiển thị field được schema khai báo; field bổ sung được validator chấp nhận theo Markdown nhưng không tự đưa dữ liệu mới lên giao diện.

## Quy ước thiết kế

- Brand public: Geist, emerald #10b981/#059669, nền trắng, slate #0f172a. Admin CSS chỉ dưới `.hm-admin`.
- Sidebar 236px, header 68px, control 40px, radius card 12px, viền #e2e8f0, shadow nhẹ. Tablet dùng drawer; bảng/tab cuộn trong vùng, không làm tràn trang.
- Action phụ dùng menu ellipsis: portal tránh clipping, Arrow/Home/End, Escape/outside click, focus restore, collision viewport. Session actions dùng dialog xác nhận và focus trap native.
- Loading không chứa metric giả; error không thành zero/empty; empty có phân biệt bộ lọc. Snapshot/requestId riêng từng response; không tuyên bố nhiều request cùng snapshot.

## Lệnh

`npm ci`, `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run admin:contract`, `npm run test:admin:unit`, `npm run test:smoke`, `npm run test:deploy`, `npm run test:admin:secrets`.

Local private: `npm run test:admin:integration`, `npm run test:admin:browser`, `npm run test:admin:business`, `npm run test:admin:idle`. Credential chỉ được đọc bởi harness; không dùng trong CI. `test:admin:guest` chạy CI không credential. Cài Chromium/Firefox bằng Playwright khi cần.

Candidate browser dùng origin `https://homemind.vn`, lấy **tài nguyên frontend thật** từ build local qua `frontend-surface.mjs`; mọi request business gửi thẳng API production, không interception/mocking API, không tắt browser security. Chế độ `--production --smoke` không map frontend. Evidence hai chế độ được ghi khác nhau.

## Gate và bước tiếp theo

1. Chốt static/build/contract, secret scan source/index/build, regression public, private acceptance trên candidate cuối.
2. Commit các file thuộc nhiệm vụ; giữ nguyên thay đổi owner trong `markdowns/`, `CLAUDE.md` và credential local.
3. Push nhánh, PR, chờ check thực tế (Docker image/health/browser/containment và source/security). Merge bình thường khi gate xanh.
4. Quan sát workflow main đúng merge SHA: build/security trước publish/deploy; deployment tự động hiện hữu. Không deploy SSH trùng hoặc sửa approval/protection.
5. Xác minh SHA/digest/HTTPS/no-store/private-file 404, focused real login/deep-link/logout/public smoke; giữ rollback sẵn có. Cập nhật kết quả cuối trong trả lời, tránh commit chỉ để gây deploy lại báo cáo.

Checkpoint 2026-10-07: steps1–3 đã hoàn thành, PR1 merged main0aac496; main run37585293436 build PASS/private digest6a5076… nhưng remote deploy fail vì protected IDs đã missing sau backend replacement trước task. Verified SSH diagnosis và scoped frontend guard reconcile đã PASS với backup/full invariants; chỉ IDs/start thay, source audited metadata đồng bộ, không backend/database/proxy restart. Production còn healthy SHA281e1de; chưa có post-deploy authenticated PASS. NEXT EXACT ACTION: corrective PR (actual frontend-serving metadata + diagnostics/failure history) → PR gates → normal merge → exact main automatic release → production smoke. Failed run giữ FAILURE; không rerun green build/duplicate manual deploy/historical bootstrap/reset. Credential chỉ RAM, không source/file/argv/log. Chi tiết report/register.
