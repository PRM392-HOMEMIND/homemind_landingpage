# HomeMind — Nhật ký lỗi frontend quản trị

Các lỗi lịch sử bên dưới được giữ lại; PASS chỉ áp dụng cho kiểm tra đã thực hiện trên candidate tương ứng.

| ID | Phát hiện | Xử lý / bằng chứng | Trạng thái |
| --- | --- | --- | --- |
| F001 | Validator ban đầu chỉ nhận UTC Z, từ chối timestamp RFC3339 có offset/microsecond hợp lệ | Cho phép RFC3339 output đúng OpenAPI, giữ UTC Z nghiêm ngặt cho query; unit calendar invalid và integrated schema pass | FIXED |
| F002 | Type generator dùng `{}` cho input không có field, lint no-empty-object-type lỗi | Dùng `Record<string, never>`; generate/check/typecheck/lint | FIXED |
| F003 | Lint quét JS trace/report public cũ trong working tree | Ignore thư mục artifact Playwright trong ESLint; không bỏ qua source/test | FIXED |
| F004 | Dependency baseline Next 16.3.1, sharp/source-map-js có advisory runtime | Next/eslint-config-next 16.3.8; sharp 0.35.5, source-map-js 1.2.2; npm audit production 0 | FIXED |
| F005 | Search timer có thể áp dụng query cũ sau Apply/Clear | Hủy timer khi Apply/Clear/unmount | FIXED |
| F006 | Helper grant/picker thiếu khôi phục khi cursor hết hạn | Thêm đọc lại từ trang đầu, xóa accumulator/stack | FIXED; live cursor expiry thiếu dataset |
| F007 | Một ảnh usage capture trong guard loading, harness chưa chờ authenticated region đầy đủ | Chờ `.hm-main` và mọi loader kết thúc; happy-path template phải không có error | FIXED; standalone final22 pass |
| F008 | Null archive/read/superseded hiển thị generic chưa biết | Hiển thị ý nghĩa null đúng field, không đổi wire data | FIXED |
| F009 | Comparator public báo sai do root CSS variable được Tailwind emit thêm và sai số Lab/subpixel | Đối chiếu style màu RGBA thực và geometry 0.001px, giữ kiểm tra heading/link/font/overflow; 15/15 pass. Legal 10 screenshot pixel-identical | FIXED comparator; không sửa public content |
| F010 | Email test login trùng địa chỉ hỗ trợ đã công khai trong committed baseline | Password/file vẫn scan tuyệt đối; không chèn identifier vào admin code. Auth screenshot che identifier, ảnh session cũ task-owned đã xóa. Không đổi email public/credential | DOCUMENTED source constraint |
| F011 | OPTIONS gọi thủ công bằng fetch không có preflight header không đọc được qua CORS | Quan sát preflight tự động bằng Chromium CDP; 204, đúng allow-origin và credentials=true | FIXED harness; không sửa CORS |
| F012 | Generator documentation có lỗi syntax tạm thời do inline backtick; formatter glob không match route group | Sửa literal, enumerate route files; lint/typecheck/contract pass | FIXED tooling |
| F013 | Business test selector exact label không match label có select options | Scope selector tới label span/select; giữ assertions số liệu/biểu đồ; 4 PASS_LIVE | FIXED harness |
| F014 | Inactive tab có thể clear dù tab khác đang đọc; guest tab không phục hồi sau login ở tab khác | Broadcast thời điểm read thành công trong RAM; guest revalidate khi login/refresh được báo, không heartbeat | FIXED; final cross-tab gate PASS_LIVE |
| F015 | Windows build EBUSY khi standalone test server giữ thư mục build | Dừng đúng process Node task theo port/command line trước rebuild; không xóa/reset source | FIXED environment; rebuild gate phải pass |
| F016 | Final mobile menu collision check thất bại | Clamp cả hai biên viewport, max-height/scroll trong popup và focus preventScroll; final mobile menu/drawer/focus và integrated19 checks pass | FIXED |
| F017 | Gitleaks staged nhận nhầm checksum nguồn OpenAPI là generic API key | Giữ checksum public, đổi nhãn xác định rõ checksum; không whitelist/disable rule; index scan 0 leaks | FIXED |
| F018 | Git autocrlf có thể làm checksum/generated check khác giữa Windows/Linux | Normalize newline LF cho checksum và so sánh generated content; không thay schema/contract nội dung | FIXED reproducibility |
| F019 | Gitleaks nhận nhầm Docker ID đứng cạnh role literal api trong tuple operator observations | Dùng record có field rõ container_id/service/started_at; không đổi ID hoặc whitelist/disable scanner. Revalidate staged scan trước commit | FIXED representation; staged gate required |
| F020 | Admin primary text13px trắng trên emerald600 contrast3.77:1 | Emerald700 default/800 hover từ palette hiện hữu; browser-computed candidate5.48:1/7.68:1 PASS và guest guard/private-file PASS sau production build. CI/private acceptance yêu cầu≥4.5:1 ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Public CSS giữ nguyên | FIXED; final release gate pending |
| L001 | Không có payment trong production hiện tại | Detail/transactions và financial partial/review/superseded edge cases chưa có happy-path; không tạo payment/seed data | BLOCKED_DATA |
| L002 | Customer dataset chỉ một bản ghi | Next-page/cursor-scope expiry chưa chạy live; limit/filter UI có chạy; không gọi skipped là pass | BLOCKED_DATA |
| L003 | Không xác nhận các session khác của test principal thuộc riêng task | Logout-all đã triển khai/confirm, không thực thi live. DELETE chỉ session harness tạo được kiểm tra 200 rồi me401 | NOT_RUN_NOT_ISOLATED |
| L004 | Fault 409/429/503/audit-write-failure không thể kích hoạt an toàn production | Handler có triển khai; pure validation/unit và offline thật riêng; không overload/đổi backend | NOT_RUN_ISOLATED_ENV_UNAVAILABLE |
| L005 | Audit đầy đủ gồm dev còn 5 high trong cùng chain braces → micromatch → fast-glob → Next ESLint | Advisory chưa có patched braces. Chỉ dev tooling với glob repo cố định; production audit 0. Không force downgrade Next/làm giả audit | OPEN_DEV_TOOLING |
| L006 | 8 giờ absolute không chờ đủ thời gian thực | UI local expiry, contract identity và refresh deadline có kiểm tra; full 8h elapsed NOT_RUN | NOT_RUN |
| L007 | Native browser zoom chưa thực hiện | Các CSS viewports hẹp, reduced motion và keyboard có kiểm tra; không gọi chúng là native zoom | NOT_RUN |
| L008 | Main run37585293436 build PASS nhưng VPS deploy thất bại `docker operation failed or timed out` | Verified SSH diagnosis: hai old protected IDs missing sau backend replacement trước task; daemon/capacity/proxy và file/unit guards PASS. Frontend config backed up và chỉ reconcile IDs/start dưới app lock với unique roles/full invariants, post-check PASS; source audited metadata đồng bộ. Không backend restart/guard bypass; failed run giữ FAILURE. Corrective PR/gated release tiếp theo, new routes hiện404 | FIXED_METADATA; release pending |

Braces advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Runtime Next patch: [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j). Không dùng `npm audit fix --force` để downgrade framework hoặc bỏ check.
