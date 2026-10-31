# HomeMind — Báo cáo frontend quản trị

Checkpoint ngày 2026-10-07: frontend đã merge; first main deployment thất bại do guard runtime cũ. Đã reconcile guard có bằng chứng; corrective PR/release gates còn cần hoàn tất. Không coi failed main run là PASS hoặc production URLs mới đã hoạt động. Xem checkpoint release bên dưới.

## Đã triển khai

- `/dang-nhap`: login SYSTEM_ADMIN thật, CSRF, không prefill; redirect session hợp lệ.
- `/bang-dieu-khien`: overview/trends/distribution/top payers; provenance, phạm vi thời gian và current-state tách rõ.
- Các child routes: khách hàng/list/detail và related tabs; không gian/list/detail/quota/members/inventory/shopping/history; thanh toán/list/detail/transactions/matching grants; gói sử dụng; usage periods/requests/turns; thông báo/list/detail; vận hành; nhật ký/list/detail; phiên của admin.
- Đủ 36 operation mappings và 51 response/input schemas theo contract. Chỉ business GET; mutation chỉ auth namespace. Không có mock business runtime/checkout/refund/edit/AI content.
- Client guard phù hợp cookie API host-only; auth RAM và cross-tab Web Locks; không cookie bridge/SSR giả, persistent store hoặc polling giữ phiên.
- Brand public tái sử dụng với admin CSS riêng, control 40px, bảng cuộn, mobile drawer, ellipsis keyboard và dialog xác nhận. Source routes public, legal, assets, favicon giữ nguyên.
- Chỉ thêm bản vá dependency cần thiết: Next/eslint-config-next 16.3.8, các transitive security patches. Không thêm chart/table/auth backend dependency.

## Bằng chứng đã chạy

| Nhóm | Candidate / môi trường | Kết quả |
| --- | --- | --- |
| Install/static/build | Windows Node22.20, lockfile, Next16.3.8, working tree candidate | npm ci, typecheck, build thành công; lint 0 errors (warning public img cũ được giữ) |
| Generated contract | OpenAPI được cung cấp | 36 operations/51 schemas consistent |
| Pure unit | Playwright runner, không gọi API/mock runtime | 8 pass: allowlist/UUID/window/password/RFC3339/null/addition/money precision/date-only |
| Real HTTP/schema | Chromium origin production được duyệt, API production | 32 distinct JSON operations 200/schema pass trong integration; logout 200 thêm qua UI = 33; OPTIONS204 pass; negative400/401/403/404 pass; DELETE chính session task rồi me401 |
| Real browser discovery | Frontend production build local, origin được duyệt, business API thật | 22 PASS_LIVE; 2 BLOCKED (payment detail, customer next page); Chromium + Firefox |
| Final browser regression | Standalone sau batch auth/menu fixes | Full pass phát hiện mobile menu (24 pass/1 fail/2 blocked); đã sửa, final integrated smoke19 pass/0 fail/1 blocked. Có generic wrong-login, guest tab restore, mobile menu/drawer/focus, cancel logout-all, cross-tab refresh, offline/logout/back, Firefox |
| Business UI targeted | Standalone candidate/API thật | 4 PASS_LIVE: REAL/SIMULATED_TEST totals vs allRecords, unfiltered plan snapshot, real chart points, shared quota/projection/null, outgoing business GET only |
| Idle elapsed | Private Chromium context, API thật, không HTTP keepalive | 16 phút thực không background read; guard về login/xóa bảng và backend me401: PASS_LIVE |
| Public smoke | Candidate local, test public hiện hữu | 31 pass, 25 skipped do project mobile trùng ma trận desktop; không tính skip là pass |
| Public comparison | 3 public routes × 5 widths, production pre-change baseline | 15/15 pass heading/link/font/overflow/colors/geometry; 10 legal screenshot pixel-identical; homepage khác biệt nhỏ do animation/counter thời điểm capture |
| Deployment rehearsal | Existing Python suite | 22 pass, rollback/failure containment covered; không phải rollback production vừa chạy |
| Secret review | Source/build/package local, private value comparison | 0 findings/password exposure; credential untracked/ignored, Docker context/package allowlist, no browser source maps. Login identifier vốn trùng contact public được ghi riêng |
| Gitleaks history/source/index | Verified v8.30.1 binary SHA256 | 18 commits và source/contract docs scan không có leaks; index final scan0 leaks sau sửa nhãn checksum false positive, không disable rule |
| Dependency audit | Official npm registry | Runtime 0 vulnerabilities; full dev audit còn 5 high trong chain chưa có patch, ghi L005 |

Screenshots/authenticated evidence chỉ ở temp directory với ACL owner/SYSTEM, không trace/video/storageState, không upload GitHub. API evidence lưu status/schema/opID và template path, không lưu customer data/password/cookie/CSRF/query. Không coi global counters là chứng minh database bất biến; inspection request chứng minh frontend chỉ gọi GET business và mutation auth, background workers vẫn có thể hoạt động.

## Giới hạn và checkpoint

Payment happy-path/partial/review/grant-supersession, next-page/expired cursor, 409/429/503/audit fail-closed, logout-all và full 8h elapsed chưa được test trên isolated real backend vì không có environment được cung cấp. Không seed/reset production. Idle15 phút đã có elapsed thực, không heartbeat; hoạt động hợp lệ từ tab khác được phối hợp trong RAM. Final cross-tab gate đã pass.

Browser zoom native chưa thực hiện; narrower CSS viewports và reduced motion/keyboard có kiểm tra, không gọi chúng là native zoom PASS.

## Checkpoint release thực tế

- Source commit: `d1a92247591d6f19f70684298afd3231b32d8ed3`; exact-commit Docker smoke/secret review đã PASS trước push.
- [PR #1](https://github.com/QuangVMZu/HomeMind_LandingPage/pull/1) merge bình thường sau [PR checks PASS](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37584733757).
- Main SHA: `0aac4965b2faa712c6696954a1374c5517f86baf`; tree giống candidate. Local main fast-forward tới SHA này; owner changes giữ nguyên.
- [Main run 37585293436](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37585293436): build SUCCESS gồm security/source/contract/unit/image/public/guest gates; deploy FAILURE tại `Reject an obsolete main release and deploy exact digest`.
- Image đã publish private, OCI revision đúng main, registry push/pull digest khớp: `ghcr.io/quangvmzu/homemind-landingpage@sha256:6a5076b983462ec10c367508ac9a81897dbca4563cb08224ee6e9f7fc0769561`.
- Actual remote error: `docker operation failed or timed out`. SSH read-only diagnosis xác định Docker daemon/capacity/proxy PASS, hai protected container IDs trong installed frontend config trả `missing-object`; API/DB hiện tại healthy, được thay trước frontend task. Networking/restart policy/health, protected file hashes và Nginx startup vẫn khớp guard.
- Read-only production check sau failure: health OK ở `281e1de11af8e6d55691fb9495e87ceae0365a8a`; homepage/privacy/terms200, HTTP308→HTTPS, bốn private-file URLs404. `/dang-nhap` và `/bang-dieu-khien`404. Post-deployment authenticated smoke BLOCKED_NOT_DEPLOYED; rollback chưa kích hoạt.
- Backend public readiness/status/body hash vẫn khớp frontend audited observations; điều này không chứng minh container identities/current installed guard còn đúng.

- Scoped operator correction đã thực hiện dưới frontend release lock: backup root-only `/var/backups/homemind-landingpage-guard-before-admin-runtime-20261007.json`; cập nhật đúng hai IDs/start times đã quan sát. Assert old config hash, unique Compose roles, exact binds/networks/restart/health và unchanged nonruntime protections trước write; protected/proxy/public checks PASS trước và sau. Installed frontend config hash `e259a9cbd7c4a5831c6e9d3ced9688f83d25ae5bec015772e44189b29b14793c`. API/DB IDs/start không đổi trong correction, public frontend vẫn281e1de. Không restart/pull/deploy backend, database hoặc proxy; không bỏ guard. Source `server.audited.json` được đồng bộ metadata.
- Retained known-good rollback snapshot `server.json` của current281e1de cũng reconcile đúng IDs/start, backup root-only riêng `homemind-landingpage-rollback-guard-before-admin-runtime-20261007.json`. Full nonruntime canonical hash giữ nguyên; archived metadata bằng live frontend config, protected/public checks PASS. Không đổi image/proxy snapshot hoặc kích hoạt rollback để thử production.
- Pre-merge bổ sung F020: primary text13px có contrast3.77:1 với emerald600; đổi riêng admin sang emerald700/800 và thêm browser-computed contrast gate≥4.5:1 trong guest CI + authenticated acceptance. Candidate production build/lint PASS, guest browser đo5.48:1 normal/7.68:1 hover và guard/no-store/private-file PASS. Không sửa public palette/CSS. PR2 đầu headf4fa21f PASS; revision bổ sung phải có fresh PR/main gates, không dùng PASS cũ thay thế.
- Operator credential chỉ dùng trong RAM, lấy từ đúng reply user đã cung cấp qua private local harness; không ghi lại giá trị trong argv/script/file/stdout. Verified existing console host-key policy; kết nối đóng và credential RAM giải phóng sau mỗi reviewed script. Private diagnostics chỉ có selected infrastructure metadata, không Env/log/cookie/customer/password.

Tiếp theo chính xác: scoped corrective PR gồm audited metadata/diagnostic/guard reconciliation và failure history → PR gates → normal merge → fresh exact-main build/deploy → production authenticated smoke và identity/HTTPS/no-store/private-file checks. Không rerun green build hoặc duplicate manual deploy để dò lỗi; failed first main run giữ nguyên FAILURE. Root code/protocol/checks không sửa. Không historical bootstrap/reset hoặc backend/database mutations.

Giữ owner changes trong `markdowns/` và `CLAUDE.md`; credential local không stage. Corrective commit chứa thay đổi frontend-serving thực tế, không phải report-only deployment loop. Release chưa hoàn tất.
