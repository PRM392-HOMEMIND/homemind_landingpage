# Báo cáo triển khai frontend popup HomeMind

## Checkpoint hiện tại — Popup Marketing Redesign + 120s Timer

**LOCAL_READY** — local gates PASS:978 case distinct PASS / 0 FAIL còn mở / 25 baseline SKIP. DEVICE-REDESIGN-01 BLOCKED do không có thiết bị/AT thật, không tính PASS. UI landscape, auto-open homepage + reopen120s, API thật và legal đã kiểm; source runtime fingerprint `35b0f246ca1be01881ea9bf1c42a2be3b670e5bb5782ef965a47e4f6738d592f`. GitHub MAIN/live vẫn5d55 tại preflight; publication/CI/VPS cho candidate mới chưa chạy. Campaign đang enabled=true/revision2 do admin bật từ trước; task không toggle. Các Phase1/2/recovery bên dưới là lịch sử; kết quả release mới sẽ ghi ngoài Git tại evidence root để không tạo thêm deployment.

## Checkpoint lịch sử — Phase 2 release đã xác minh

**RELEASE_COMPLETE_VERIFIED / FRONTEND_PHASE2_RELEASE_COMPLETE** — 11/10/2026, Asia/Saigon. PUBLIC homepage và ADMIN management đã tích hợp API thật theo BE `233e71562dda9ce3f7776e2fa52f23db3d96be21`, kiểm thử trên Nest/PostgreSQL local riêng:757 PASS/25 baselineSKIP, không regression mới còn mở. Recovery giữ nguyên source đã test,48 deployment/recovery tests local Linux PASS. GitHub MAIN và production `/healthz` cùng exact SHA `5d55b1b842aef09bfe729c69ace8e79d74863bb2`; trusted run38073244434/attempt2 SUCCESS; website/5viewport/legal/login/Admin guest guard được kiểm tra độc lập PASS. Campaign vẫn disabled/revision1; không production DB tests hoặc business writes.

Lỗi deploy attempt1 và checkpoint BLOCKED được giữ trong lịch sử/evidence. Root cause là frontend protection guard ghim API/DB IDs07/10 đã biến mất sau BE release10/10; owner cho phép metadata-only audit và reconcile guard frontend. Chỉ ID/StartedAt trong `/etc/homemind-landingpage.json` đổi, mọi policy/file hash/runtime khác giữ nguyên, có lock/backup/atomic validation. Rerun đúng failed jobs, không tạo commit/image mới hoặc deploy thêm candidate lần hai. Previous frontend slot healthy và rollback assets còn đủ; archived backend IDs là historical snapshot, cần reconcile guard nếu sau này dùng rollback. Chi tiết cuối ở mục Recovery và report trênH:.

Những phần Phase1/Phase2 checkpoint cũ bên dưới là lịch sử; STOP BEFORE COMMIT của Phase1 đã được user thay bằng quyền release Phase2. Physical-device/AT/nativeSafari limits và coverage gaps đã ghi vẫn không được gọi là PASS; completion label ở đây xác nhận release criteria đã thực hiện, không khẳng định mọi scenario có thể xảy ra đều được kiểm tra.

## Trạng thái tại baseline

Ngày 10/10/2026, Asia/Saigon. Baseline: **PHASE_1_RELEASE_REPORT_ONLY**. Kết quả: **FRONTEND PHASE 1 — READY FOR BACKEND CONTRACT SYNC**. UI/controller/boundary và các case độc lập đã triển khai, review và xác minh; API/form contract thực vẫn **PENDING_BE_API_CONTRACT**. Đây không phải production readiness hoặc ALL PASS cho toàn bộ yêu cầu API/thiết bị. Người dùng xác nhận FE chỉ có release report; task không chờ BE hay tự đổi baseline.

FE HEAD `c1142d937d8dc962d4b090d36457f012e1be9824`, nhánh `main`, index ban đầu trống. Bốn file `markdowns/HOMEMIND_LANDINGPAGE_{DEPLOYMENT_PLAN,DEPLOYMENT_REPORT_VI,RUNBOOK_VI,VPS_AUDIT}.md` đã sửa; `CLAUDE.md` và release report chưa tracked là của người dùng. Snapshot byte hashes/status/index và diff ban đầu: `H:/HomeMind/tasks/feedback-popup-fe/20261010-baseline-c1142d9/baseline.json`, `baseline-working.diff`, `baseline-staged.diff`.

Nguồn API được đóng băng: release report SHA-256 `4faaa1f3ae1b3275c7d93b2837ae44967316b75ff89fd650c24cf07cf4a0a85c`. Report là file untracked, không giả gán FE commit cho nó. BE release được report mô tả ở mục 15–18 là `743587ba30103c44fe8c604dcfd6ebd5f1429b24`, không phải baseline DTO đã được bàn giao và không phải evidence chạy test FE mới. Không đọc/sửa repo BE hoặc cập nhật baseline theo deploy mới.

Đã đọc AGENTS.md/CLAUDE.md; hướng dẫn Next 16.3.8 trong `node_modules/next/dist/docs/` về Server/Client Components, CSS Modules, distDir, supported browsers và generator agent files. Source có client components, native dialog admin, ThemeButton/Container, Geist, emerald/slate, Lenis; env example không có public popup env. Chỉ có admin OpenAPI/client/types, không có public popup contract. Không dùng base URL/CSRF/admin credentials của admin để đoán public API.

## Bảng contract thực

| Hạng mục | Nguồn baseline thực | Endpoint / method | Base URL | Auth / CSRF / origin / cache | Request / constraints | Response / errors | Config / trigger / enabled |
|---|---|---|---|---|---|---|---|
| Public config popup | Release mục 16 nói config HTTP 200/no-store/enabled=false ở lần release trước | **UNVERIFIED:** không có path/method contract | **UNVERIFIED** | `no-store` được report xác nhận lịch sử; origin không được phép 403. Credentials/CSRF/public allowlist không được chỉ rõ | **UNVERIFIED** | Report nhắc enabled=false nhưng không định nghĩa DTO, optional hay error envelope | Chưa có client/config/trigger trong FE source. Không mời đăng ký/submit |
| Public đăng ký/góp ý | Release mục 18 chỉ định API report đang thiếu | **BLOCKED:** không đoán POST path | **UNVERIFIED** | **UNVERIFIED** | **BLOCKED:** required/optional, null/omitted, limits, normalization và idempotency chưa bàn giao | **BLOCKED:** success/schema/reward status/business errors chưa bàn giao | Không form và không request production |
| Gift/account state | Policy user; release mục 4/18 về durable boundaries và anonymous nomination | Không thêm endpoint dò email/account | Không áp dụng | BE chịu trách nhiệm cấp quà và uniqueness | FE không lưu email/click/history để khóa quà | Không suy kích hoạt hay ngày hết hạn từ HTTP hoặc ngày submit | Không hiển thị paid/manual/pending/resume/account trạng thái chưa xác minh |
| Admin contract hiện có | `docs/HOMEMIND_ADMIN_OPENAPI.json`, `src/lib/admin-api/*` | `/v1/admin/*`, không phải public popup | URL admin hiện có trong validation.ts | Admin cookie/CSRF riêng | DTO admin không thay public DTO | Envelope/admin errors không thay public errors | Không gọi admin API, không bật campaign, không sửa auth |

**Endpoints thật đã tích hợp trong task: KHÔNG CÓ**, do public contract thiếu. Mock/fixture chỉ kiểm thử presentation local. Không có call production (GET hay mutation) do task.

## Quyết định UI có căn cứ

- Khung popup dùng tên “30 ngày HomeMind Premium”, mô tả “Chia sẻ thông tin và góp ý của bạn với HomeMind.” Không thêm quota, mã/link qua email, thẻ, auto-renew hay hứa kích hoạt ngay.
- Chính sách nguyên văn từ yêu cầu user: “Mỗi tài khoản chỉ được nhận quà Premium dùng thử 30 ngày một lần. Bạn vẫn có thể gửi lại thông tin hoặc góp ý; các lần gửi sau không cấp thêm quà, gia hạn hoặc khởi động lại thời gian dùng thử.”
- Link tới `/privacy-policy` tồn tại trong source và được kiểm tra local. Không thêm consent hoặc OTP.
- Typography lấy Geist qua root layout; nền trắng, slate text, emerald badge, radius và padding cùng homepage. CSS Module giữ scope. Không sửa globals, brand, header hoặc bố cục homepage; chỉ thêm boundary hai dòng.
- Chưa có config/trigger baseline nên homepage chỉ thêm `FeedbackCampaign` boundary **fail closed**, không render invitation/form hoặc gọi endpoint. Preview dùng CTA chủ động trong H:; không timer/exit intent/localStorage hoặc auto bật campaign. Đây không phải integration thành công.
- Modal native `dialog`, heading làm accessible name/initial focus, Escape/nút đóng, backdrop không đóng, giữ children mounted khi đóng để không xóa draft. Parent sở hữu draft/request; khung không tạo/hủy/retry request. Pending trong fixture chỉ kiểm tra lifecycle presentation, không phải request race evidence.
- Viewport height/offset theo visualViewport khi mở, safe-area CSS, body nội dung cuộn giữa header/footer. Đóng/unmount phải restore inline overflow và focus; không thêm motion popup.

## Source Phase 1 và review phạm vi

Ma trận được tạo trước source tại `docs/HOMEMIND_FEEDBACK_POPUP_FRONTEND_TEST_MATRIX_VI.md`. Khung/modal, presentation, controller và adapter boundary tách riêng; không có endpoint operational hay field DTO production. `FeedbackCampaign` là server boundary trả `null`, thêm đúng hai dòng vào homepage. Mọi trạng thái gửi dùng fixture có nhãn rõ; route `/feedback-fixture` chỉ ở bản sao H:, production build thuần đã xác minh route này trả 404.

Controller kiểm tra config abstract lại trước mỗi thao tác; synchronous single-flight chặn double-click/Enter; outcome yêu cầu hành động “Gửi lượt góp ý mới” trước lượt tiếp theo. Đóng không hủy thao tác và giữ draft trong mount, mở lại xem tiến trình/kết quả. Unmount/dispose abort và vô hiệu hóa kết quả cũ; Promise.race với abort xử lý cả adapter bỏ qua signal. Không retry tự động, không local reward tracking. Timeout mặc định 20 giây là guard UI Phase 1, **không phải timeout API được BE xác nhận**. Chỉ adapter Phase 2 đã xác minh mới được phân loại lỗi chắc chắn bị từ chối; lỗi không rõ/malformed receipt là “có thể đã nhận”.

Scroll lock reference-count cho các instance popup, khôi phục đúng inline styles và tọa độ cũ; không sửa Lenis/mobile menu. Dialog native giữ focus nền inert, trap Tab/Shift+Tab rõ ràng từ heading, trả opener nếu còn trong DOM. Body cuộn giữa header/footer; CSS local có safe-area hai bên, visualViewport height/offset và reduced motion. Không render HTML/raw server error, URL/storage/log/analytics không giữ draft. Privacy mở trang có sẵn trong thẻ mới, kèm thông báo.

Đã review từng file source, fixture/tests/config và code CSS module bundler sinh: không thay global CSS, auth/billing/admin API, env/lockfile/dependency/CI/production config; không secret/credential/client admin vào popup; không email canonicalization hoặc normalization tự thêm. Test fixture không được import từ `src/app` của repo bàn giao. Các API-dependent requirement giữ BLOCKED ở ma trận, không bị đổi thành PASS bởi fixture.

## Danh sách file của task

| File | Thay đổi / mục đích |
|---|---|
| `src/app/page.tsx` | Import và mount boundary fail-closed, không viết lại homepage |
| `src/features/feedback/FeedbackCampaign.tsx` | Production gate `PENDING_BE_API_CONTRACT`, trả null |
| `src/features/feedback/FeedbackPopup.tsx` | Khung native dialog, focus, viewport, privacy, policy |
| `src/features/feedback/feedback-popup.module.css` | Layout/scoped palette/responsive/safe-area/reduced motion |
| `src/features/feedback/policy.ts` | Chính sách sản phẩm nguyên văn |
| `src/features/feedback/FeedbackExperience.tsx` | Presentation config/loading/outcome, injected form slot |
| `src/features/feedback/adapter.ts` | Interface UI generic, không wire DTO/client HTTP |
| `src/features/feedback/session.ts` | State/race/timeout/single-flight/dispose |
| `src/features/feedback/scroll-lock.ts` | Khóa/khôi phục cuộn có ownership |
| `playwright.feedback-unit.config.ts` | Unit runner hiện có, không thay stack |
| `playwright.feedback.config.ts` | Chromium/Firefox/WebKit/Edge fixture E2E, output env |
| `tests/feedback/session.unit.spec.ts` | State/adapter abstraction/race/error regression |
| `tests/feedback/scroll-lock.unit.spec.ts` | Restore/nested lock/idempotent release |
| `tests/feedback/preview-page.tsx` | Component fixture synthetic, chỉ mount ở bản sao H: |
| `tests/feedback/popup.spec.ts` | Browser/presentation/a11y/responsive/privacy tests |
| `tests/feedback/report-browser-coverage.mjs` | V8/source-map merger dùng tooling task-local, chỉ output H: |
| `docs/HOMEMIND_FEEDBACK_POPUP_FRONTEND_IMPLEMENTATION_REPORT_VI.md` | Báo cáo này |
| `docs/HOMEMIND_FEEDBACK_POPUP_FRONTEND_TEST_MATRIX_VI.md` | Ma trận requirement/evidence và blockers |

## Kiểm thử và handoff

Baseline lint/build PASS; 5 warning `next/no-img-element` trong HeroSection/TestimonialsSection đã tồn tại và giống lượt cuối. Sau fix focus, `npm run lint`, `npm run typecheck`, `npm run build` PASS trên bản sao source byte-identical ở H:; `validation-exit-codes.json` ghi 0/0/0. Không route fixture trong build thuần. Unit 22 PASS; regression hiện có 31 PASS / 25 SKIP / 0 FAIL (24 responsive cases mobile lặp desktop + 1 short-landscape được suite baseline skip; không đổi tests hay tính SKIP là PASS). Evidence cuối: `logs/post-review-{lint,typecheck,build,unit,regression}.log`, `post-review-regression-html/`, `post-review-production-build/`, `logs/post-review-production-fixture-gate.log` dưới evidence root. Các lượt `final-*` trước review vẫn giữ provenance riêng.

Browser cuối: **120 PASS / 0 FAIL / 0 SKIP**, 30 case × 4 engine (`post-review-browser.json`, `logs/post-review-browser.log`, `post-review-browser-results/`). Branch audit bổ sung đúng một test partial visualViewport: **4 PASS / 0 FAIL / 0 SKIP** (`viewport-supplement.json`, `logs/viewport-supplement.log`, `viewport-supplement-results/`). Tổng fixture E2E **124 PASS**; unit 22 PASS; regression 31 PASS / 25 SKIP: tổng automated cuối **177 PASS / 0 FAIL / 25 SKIP**, không cộng các lượt lịch sử. Lint/typecheck sau test-only append tiếp tục exit 0 (`supplement-exit-codes.json`, `logs/final-supplement-{lint,typecheck}.log`); không đổi app/config/dependency sau build cuối nên không build lại chỉ vì thêm test.

Ma trận 50 requirement/case rows: **32 PASS / 0 FAIL / 0 SKIP / 18 BLOCKED / 0 NOT_RUN / 0 N/A**. Trong 18 BLOCKED, 17 phụ thuộc public contract/form/API hoặc cả contract + input thiết bị; FE-07-03 là keyboard/safe-area thiết bị thật không có công cụ. Các giới hạn native zoom/assistive technology/minimum browser versions được nêu riêng. Không chuyển BLOCKED thành PASS bằng mock. **Real API integration: chưa xác minh và chưa triển khai HTTP adapter; 0 endpoints thật tích hợp.**

### Coverage và nhánh chưa phủ

Baseline toàn app: **NOT_MEASURED**; repo không có coverage engine/config/threshold tại checkout, không coi là 0%. Dùng c8/V8 task-local và Playwright Chromium JS coverage với source maps H-only; không thay package/lockfile/threshold hoặc thêm exclusion để che source. `coverage-unit-final/` có 100% statement/line/function/branch cho adapter.ts, session.ts, scroll-lock.ts. Browser + unit merge ở `coverage-popup-final/{index.html,summary.json,coverage-final.json,mapping-evidence.json}`, log `logs/coverage-popup-complete.log`.

| Scope | Statement | Line | Function | Branch |
|---|---|---|---|---|
| 6 file handwritten runtime được đo: adapter/session/scroll-lock/FeedbackPopup/FeedbackExperience/policy | 329/329, 100% | 329/329, 100% | 30/30, 100% | 178/178, 100% |
| Raw report, giữ cả CSS-module JS bundler sinh | 341/341, 100% | 341/341, 100% | 30/30, 100% | 179/180, **99,44%** |

Một V8 block chưa phủ ở generated `feedback-popup.module.css [app-client] (css module)`, line 1: code export `__turbopack_context__.v({...})`, không có nhánh nghiệp vụ trong source CSS. Đã mở/review `coverage-popup-final/generated-css-source.txt`; giữ nguyên trong raw metric, không loại trừ. Branch nullish offsetTop của visualViewport ban đầu chưa hit (98,88%) được bổ sung case P1-10 và xác minh trên cả 4 engine; không sửa source để bỏ branch.

`FeedbackCampaign.tsx` là server-only static gate trả null; hai dòng homepage integration không có browser instrumentation nên **NOT_MEASURED riêng**, được kiểm trực tiếp/reload/no invitation/no API và pure build fixture 404. CSS declarations không có JS statement coverage; được kiểm layout/contrast/responsive và mở ảnh. Report merger/test harness không nằm trong runtime feature metric. Đây là V8/source-map coverage theo scope, không phải baseline toàn app, không chứng minh mọi input/thiết bị/API hay BE uniqueness đã kiểm thử.

### Defects đã tái hiện và sửa

| Lỗi | Evidence trước fix / nguyên nhân | Fix / regression |
|---|---|---|
| Config refresh giữa precheck/gửi làm strand operation | `logs/unit-initial.log` FAIL; generation bị thay bởi background read | Chặn refresh khi operation active; regression `background config refresh...` PASS |
| Có thể gửi lại ngay từ outcome nếu gọi controller trực tiếp | `logs/unit-double-before-fix.log` FAIL | Chỉ submit từ idle; explicit new action; giữ multiple intentional sends |
| Adapter bỏ qua AbortSignal làm dispose chờ timeout | `logs/unit-abort-before-fix.log` FAIL | Race abort promise và cleanup timer/listener; regression dispose settles promptly PASS |
| Tab đầu tiên từ heading bỏ qua nút đóng | `logs/browser-initial.log` FAIL | Xử lý heading ngoài tab order, wrap hai chiều; browser regression |
| Firefox restore dynamic disabled button khi reload | `logs/browser-all-dev.log` FAIL ở Unicode/reload; thuộc browser form-state restore | `autoComplete=off` chỉ trên action button, không tắt autofill field; final Firefox reload test |
| WebKit pointer open không lập focus opener tin cậy | Lượt production fixture đầu FAIL ở cả 3 campaign-change cases; `return-focus-before-fix.json` tái hiện active element vẫn ở heading/dialog cũ | Focus trigger trước `session.open()`, rồi modal capture đúng opener; giữ assertion trả focus, bổ sung pointer close regression |
| Timing/locator fixture | Log initial giữ nguyên | 10ms timeout test thay bằng đợi operation settle; assertion focus dùng keyboard để thực sự kiểm `:focus-visible`; pending fixture hoàn tất bằng event thay vì timer 2s; scope vùng thông báo role rõ ràng |

Firefox behavior đối chiếu tài liệu [MDN disabled attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled) và [Mozilla bug 1847798](https://bugzilla.mozilla.org/show_bug.cgi?id=1847798). Không có thay đổi field autofill hay constraint form production.

Development browser run lịch sử 85 PASS / 11 FAIL trên 96 lượt được giữ ở `browser-all-dev.json` và `logs/browser-all-dev.log`. WebKit Windows dùng 5 stable RAF, đo khoảng 2 giây/action khi opener không đổi vị trí: `webkit-diagnostic.json`, installed Playwright `coreBundle.js` của bản sao H:. Budget WebKit tăng 30→120 giây cho test nhiều vòng; các assertion giữ nguyên 8 giây, retries=0, không skip hoặc nới kết quả mong đợi. Pending fixture timer 120 giây chỉ giữ thao tác mô phỏng đến event; timeout thực của controller vẫn có unit regression.

Production fixture trước focus fix: `final-browser.json`, `logs/final-browser.log`, `final-browser-results/`: 105 PASS / 7 FAIL (4 locator fixture + 3 WebKit focus return). Source/test fingerprint khi đó ở `pre-focus-fix-source-manifest.json`. Không tính các FAIL lịch sử là PASS; lượt sau fix dùng build và report riêng.

### Visual review và giới hạn công cụ

Ảnh cuối `screenshots/verified-*` được **mở bằng tools.view_image** ở 360×800, 390×844, 768×900, 1280×900, 1440×900, 390×320, 768×390 và 640×450; thêm checking/pending/submitted/rejected/uncertain, mobile long draft + error, visualViewport keyboard simulation, body đã cuộn ở 360/1440. `visual-review-final.json` ghi path/hash/runtime fingerprint; screenshot trạng thái kiểm thử vẫn có nhãn dữ liệu mô phỏng. Đã xem homepage 390/1440 và privacy 390 từ regression; header/hero/CTA/container/typography không có layout regression quan sát được. Nút đóng/CTA ở viewport, body cuộn, policy/notice wrap đúng và palette nhất quán homepage.

Engine được chạy headless trên Windows: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6, Edge 155.0.4283.45, Node 22.20.0; `engine-inventory.json`. WebKit không chứng minh Safari/macOS/iOS thật; mobile widths/visualViewport/safe-area CSS/640×450 reflow tương đương zoom 200% không chứng minh keyboard/notch/IME/autofill/browser zoom/assistive technology trên thiết bị thật hoặc browser minimum-version. Không có evidence cho các trường hợp đó; ghi BLOCKED/giới hạn, không gán PASS.

### Storage, isolation và tái chạy

Evidence root: `H:/HomeMind/tasks/feedback-popup-fe/20261010-baseline-c1142d9/`. Source và dependencies test copy ở `workspace/`; TEMP/TMP=`temp/`, npm cache=`npm-cache/`, Playwright browsers=`browsers/`, PWTEST_CACHE_DIR=`playwright-cache/`. Đã kiểm tra file cache/artifact thực sự ở H: (`workspace/.next`, `temp/playwright_*`, `temp/node-compile-cache`, `npm-cache/_cacache`, Playwright transform/cache). Edge binary có sẵn trên C: chỉ được dùng chạy browser, profile ở H:. Không Docker/DB/container/BE repo/AVD/shared prune.

Commands dùng toolchain sẵn có trong H workspace: `npm run lint`, `npm run typecheck`, `npm run build`; `node node_modules/playwright/cli.js test` với `SMOKE_BASE_URL=http://127.0.0.1:3407`, output và HTML report ở H:. Unit: `node node_modules/playwright/cli.js test -c playwright.feedback-unit.config.ts`; c8 task-local trong `tooling/` (không thêm repo dependency).

Preview chỉ trong H workspace: tạo `src/app/feedback-fixture/page.tsx` import `Home` và `tests/feedback/preview-page.tsx`, render hai component; bật `productionBrowserSourceMaps` **chỉ ở config bản sao H:** để thu coverage. Build rồi `next start --hostname 127.0.0.1 --port 3408`; `FEEDBACK_BASE_URL=http://127.0.0.1:3408`, `FEEDBACK_JSON_REPORT`/`--output` trỏ H:; chạy `node node_modules/playwright/cli.js test -c playwright.feedback.config.ts`. `next start` có warning standalone đã biết; đây là preview local, không phải deploy. Không dùng fixture route/config này làm production integration.

Coverage browser chỉ bật qua `FEEDBACK_BROWSER_COVERAGE=1` ở Chromium. Converter dùng `FEEDBACK_COVERAGE_TOOLS=.../tooling` và arguments browser-results, unit coverage-final.json, H: output. Source map chỉ được fetch từ loopback của preview task, không từ server BE. C8/Istanbul/V8 tooling dùng prefix H:, không sửa package.json/lockfile/threshold.

## Checkpoint correction — không restart

Trước correction: **COMPLETED AND VERIFIED** đọc release/source/local guides, snapshot Git, baseline lint/build, homepage browser 390/1440 và mở hai screenshot; **PARTIALLY IMPLEMENTED** hai báo cáo; **NOT STARTED** source popup; **WAITING FOR BE CONTRACT** mọi endpoint/DTO, không integration đã thử. Baseline regression sau đó kết thúc: 11 PASS / 7 SKIP của project mobile lặp case desktop, không tính SKIP là PASS.

Giữ toàn bộ evidence và thay đổi hợp lệ. Không có endpoint/DTO suy đoán cần xóa. Correction thay nhãn baseline, mở rộng Phase 1 sang controller/loading/outcomes/race và adapter boundary generic; chỉ dùng fixture UI, không gọi API thật. Không tìm lại report thiếu, không truy cập repo BE, không chờ agent BE.

Business fact từ report: 2.592.000 giây = 30 ngày; release mục 4 lưu durable boundaries để delayed worker/manual release/paid coverage không kéo dài thời lượng; continuation dùng ranh giới lịch đã lưu, không lấy ngày worker xử lý muộn. Mốc manual release lịch sử trước metadata migration đã bị ghi đè không thể tái dựng (mục 18); FE không backdate hoặc tự tính ngày kết thúc từ submit. Báo cáo không đủ xác nhận public account matching/activation UX, yêu cầu tạo/đăng nhập account, hoặc nơi xem entitlement/ngày bắt đầu/kết thúc. Anonymous nomination không chứng minh quyền sở hữu email/phone (mục 18). Config enabled=false và origin403 là checkpoint lịch sử (mục 16), không proof current live. Một quà mỗi account dù nhiều submission là **product policy user**, không phải BE enforcement đã verify ở task này.

## PENDING BACKEND API DOCUMENTATION — PHASE 2

Public config endpoint/method/base URL/schema/cache-refresh/trigger/allowlist; submit endpoint/DTO/required/optional/null/omitted/validation/normalization; success/error schema/enums/field errors; auth/credentials/CSRF/origin/CORS; idempotency/retry identity; public account matching/cấp/kích hoạt quà; paid/manual/wait/resume; reward/account status và nơi xem ngày bắt đầu/kết thúc; local/test service baseline cho real integration. Không chờ deploy hoặc tự đọc contract tương lai. Chỉ bắt đầu Phase 2 khi user chỉ thị và cung cấp nguồn mới.

## Fingerprint và Git/release boundary

App/runtime source fingerprint đã test: `3F8A4CD8B27B92287332DDA9813052B3DB35EB1D5054472FC2BDBA5740AF85FA`. Final source/tests/config manifest `tested-source-manifest.json` SHA-256 `5A61B3C8B60AC73FFBE23C5C648D59E97ABD7A147E634AEE5A5DF9EFA80C6AFF`. Lượt 120 case dùng `main-validation-source-manifest.json` (`DB2CAC8E4B95BAF00402E9D233B852A165176F1A44738A840D10DA909ED05097`); test-only append được xác minh prefix byte-identical bằng `test-append-preservation.json`, và 4 lượt riêng dùng cùng app build/runtime hash. Không gán evidence trước focus fix vào source mới. Sau test chỉ cập nhật báo cáo; full working-tree/task manifest + diff hashes cuối nằm ở `final-git-receipt.json` ngoài repo để tránh self-hash vòng tròn.

HEAD `c1142d937d8dc962d4b090d36457f012e1be9824`, nhánh `main`, index hash `0CA6B5C8993521CBAA118634C31C981891808D133D1C125543F08B690D49CE60`; staging ban đầu và cuối trống. Kiểm tra byte hashes mọi file baseline: chỉ `src/app/page.tsx` đổi đúng hai dòng của task; bốn markdown user, CLAUDE.md và release report giữ nguyên. Diff review gồm cả 17 file mới ngoài tracked diff; không dựa vào git diff --stat để bỏ qua file untracked. Server/port task dừng theo ownership, evidence giữ ở H:, không cleanup tài nguyên BE/owner.

- Git/release boundary: STOPPED BEFORE COMMIT
- New changes staged by this task: NO
- Committed / Pushed / Merged / Deployed by this task: NO / NO / NO / NO
- PR / Tag / Production campaign enabled by this task: NO / NO / NO
- Mandatory cases chưa xác minh: **CÓ — 18 BLOCKED** như ma trận; không endpoint/DTO để kiểm actual API/form, và không thiết bị thật cho FE-07-03. Đây là điểm chờ Phase 2/công cụ, không phải FAIL UI được giấu.

## Phase 2 — PUBLIC + ADMIN, tiếp tục Phase 1

Phần Phase 1 ở trên là lịch sử tại checkpoint cũ. User đã cho phép đọc contract BE được release, tích hợp thật, thêm quản lý campaign vào Admin hiện có và phát hành FE sau các gate. Boundary STOP BEFORE COMMIT phía trên chỉ mô tả Phase 1; không mô tả quyền phát hành Phase 2. Giữ popup, controller, scroll lock, adapter boundary và evidence Phase 1; không viết lại homepage, auth hoặc dashboard.

### Baseline đã đóng băng

FE base `c1142d937d8dc962d4b090d36457f012e1be9824`, origin `QuangVMZu/HomeMind_LandingPage`. Candidate riêng tại `H:/HomeMind/tasks/feedback-popup-fe/20261010-phase2-233e715/candidate/`, branch `feat/landing-feedback-phase2`. Bốn file deployment markdown có thay đổi sẵn của owner, CLAUDE.md, lịch sử release và index trong checkout D: không chuyển vào candidate. Snapshot trước sửa ở `initial-*` trong evidence root.

BE baseline **MAIN `233e71562dda9ce3f7776e2fa52f23db3d96be21`**, repository `QuangVMZu/HomeMind`. Đọc Git object đúng revision và archive read-only; không dùng HEAD checkout owner khác, không tự đổi contract khi BE có commit mới. Post-release result được đọc đầy đủ từ task BE trên H:, dùng làm release context, không thay DTO. Bốn tài liệu contract và SHA-256:

| Nguồn BE tại revision trên | SHA-256 |
|---|---|
| docs/HOMEMIND_FEEDBACK_POPUP_API_REPORT_VI.md | b494140ed7a5f4c338006b0a88fe78e02bb5219be5137b59865b0af6d960bf03 |
| docs/HOMEMIND_FEEDBACK_POPUP_FE_HANDOFF_VI.md | e5095667950a2edebbb00d8076739929c876a56a0922aafce7f9fdf987e09e16 |
| docs/HOMEMIND_FEEDBACK_POPUP_REWARD_HARDENING_REPORT_VI.md | dc465e882810f3ffddeb7422d303ab1554f17bac8ec7be3edce9192fb42ddd1b |
| docs/HOMEMIND_FEEDBACK_POPUP_REWARD_TEST_MATRIX_VI.md | ea40fc3a2750adf885e24426bf89933f1ae74c36de04ce4d7c74b38c3b4f2499 |

Các blob, manifest và source fixture ở `contracts/`, `backend-source/`. Không tạo tài liệu API giả trong FE. Hướng dẫn Next 16.3.8 cài tại node_modules đã đọc trước khi thêm Client component và dynamic route Promise params.

### Contract thật được tích hợp

Base mặc định `https://api.homemind.vn/v1`; PUBLIC có override origin qua env public để test, ADMIN tiếp tục lấy origin từ kiến trúc authenticated API có sẵn. Không thay production config.

| Endpoint / method | Auth, cache, origin | Request / constraints | Response / recovery |
|---|---|---|---|
| GET /public/feedback-popup | Anonymous, credentials omit, no-store; origin allowlist, không CSRF | Không body. enabled phải boolean; campaign/offer/4 field constraints/idempotency metadata đúng baseline | Strict schema; loading/error/unknown/malformed fail closed. GET lại trước submit. Không auto-popup/timer/exit intent |
| POST /public/feedback-popup/submissions | JSON, credentials omit, no-store; origin allowlist; Idempotency-Key UUID được hỗ trợ | Chính xác fullName, phoneNumber, email, review, cả bốn required string. Name 1–120 codepoint, phone 1–40, email 3–254/auth validator, review 1–5000. Raw UTF16 caps 1000/200/1000/20000, body 32768 byte. Name/review NFC+trim; email auth trim+lowercase, không NFC hoặc alias; phone libphonenumber VN/E.164 | 202 ACCEPTED + submissionId + acceptedAt + message. Không reward/account status. Mọi success dùng “đã gửi thông tin”, không “đã kích hoạt”. Manual retry giữ snapshot/key; lượt mới key mới; không auto retry POST |
| GET /admin/feedback-popup | Cookie __Host-homemind-admin, SYSTEM_ADMIN, credentials include, private/no-store, approved origin | Không body | data config + meta admin-v1; revision/audit thay đổi gần nhất, không default enabled |
| PATCH /admin/feedback-popup | Cookie SYSTEM_ADMIN + X-HomeMind-Admin-CSRF; origin; private/no-store | enabled boolean + expectedRevision lấy config đang hiển thị | Xác nhận trước thao tác; single flight; không auto retry. 409 CONFIG_REVISION_CONFLICT tải lại và xác nhận mới. Timeout/network không khẳng định chưa đổi |
| GET /admin/feedback-popup/submissions | Cùng admin auth; private/no-store | limit 1–100, cursor opaque, sort, q tối đa 120 UTF16, benefitState, duplicate, userId UUIDv4, cặp from/to UTC tăng dần tối đa 366 ngày | items/page + meta; filter đổi reset cursor. Counts hiển thị phạm vi trang, không giả tổng toàn campaign |
| GET /admin/feedback-popup/submissions/:id | Cùng admin auth; private/no-store | submissionId UUIDv4 | Review, benefit, lifecycle nếu có, segments; 404/400 an toàn. Unknown enum/null/missing optional không suy đoán ngày hoặc trạng thái |

Public errors được xác minh từ docs/source: 400 VALIDATION_ERROR/INVALID_JSON/INVALID_IDEMPOTENCY_KEY; 403 ORIGIN_NOT_ALLOWED; 409 FEEDBACK_POPUP_DISABLED/IDEMPOTENCY_CONFLICT; 413 PAYLOAD_TOO_LARGE; 415 UNSUPPORTED_MEDIA_TYPE; 429 RATE_LIMITED; 503 FEEDBACK_POPUP_BUSY/FEEDBACK_POPUP_UNAVAILABLE. Field codes map sang tiếng Việt an toàn, không render raw server message. Unknown code, non-JSON, sai schema, 500, mất response và timeout là kết quả chưa xác định. Rate/busy có cooldown theo Retry-After. Public key replay cùng payload trả cùng receipt kể cả khi campaign tắt; FE vẫn chỉ gửi khi fresh config enabled theo yêu cầu sản phẩm, giữ identity uncertain để retry sau khi chương trình cho phép.

Admin dùng error envelope fields array, meta admin-v1; không lấy public schema thay thế. Client hiện có tiếp tục queue/read budget/session clearing. Mở rộng boundary chỉ cho allowlisted feedback admin routes và origin authenticated hiện có. CSRF lấy mới qua cơ chế auth lock hiện có; token chỉ ở memory. 401/403 kể cả malformed/non-JSON vẫn vô hiệu phiên, không giữ PII trên UI. GET retry theo policy client có sẵn; PATCH không retry tự động.

### Business / copy / UI

Policy “mỗi tài khoản chỉ nhận một quà; gửi lại không cấp thêm, gia hạn hoặc bắt đầu lại” là yêu cầu user, được contract hardening xác nhận server enforcement. FE không dò account/email hoặc dùng storage/lịch sử thiết bị để chặn quà. Local tests kiểm lặp submission và một issued reward; không tự tuyên bố kiểm toàn bộ concurrency BE hoặc issuance production.

Contract xác nhận contact-pair nomination và liên kết account; form không tạo tài khoản. Hướng dẫn dùng email/phone khớp tài khoản, tạo tài khoản HomeMind nếu chưa có, đăng nhập/làm mới thông tin gói nếu đã có. Public receipt không chứng minh đã cấp quà hoặc kích hoạt. FREE, paid schedule, manual wait và phần ngân sách còn lại sau paid interruption được mô tả thận trọng; 2.592.000 giây không phải submit + 30 ngày lịch. Không hứa gửi mail/code/link đổi quà, không thẻ, tự gia hạn hoặc quota không được xác minh.

PUBLIC tích hợp vào `/` qua FeedbackCampaign, dùng Container/ThemeButton/emerald/typography homepage. CTA người dùng chủ động chỉ có khi config enabled; người đã mở được xem lại draft/outcome khi tắt, nhưng không submit. Native dialog có accessible name, initial heading focus, trap/restore focus, Escape giữ draft, backdrop không đóng, scroll restore; đóng pending không abort request và outcome vẫn thuộc lượt đó. Unmount abort/ignore stale result. Nội dung cuộn, safe-area/visualViewport, các trường font 16px; không CSS global mới.

ADMIN thêm nav “Phản hồi và quà tặng” vào shell có sẵn, routes `/bang-dieu-khien/phan-hoi-qua-tang` và `/:submissionId`; không thêm login/auth flow mới. Config toggle có modal xác nhận. List/filter/pagination/detail, linked account, first award, scheduled/actual dates và segment history lấy DTO. Phân biệt trạng thái lượt gửi DUPLICATE với trạng thái quà gốc. NOT_TRACKED được ghi “Không được theo dõi”; không suy elapsed seconds là feature usage, không dựng PAUSED/global totals. Shared confirmation component và private route protections được giữ.

### Infrastructure test, privacy và storage

REAL integration dùng Nest compiled từ exact frozen SHA, PostgreSQL 18 fixture isolated (tmpfs, không publish DB port), official migration/admin grants/bootstrap trên DB task-owned. Tên resource `homemind-e2e-f6c0898aec8c`, label ownership checked trước mọi SQL; API loopback port lấy manifest và xác minh docker port, không nhận DATABASE_URL tùy ý. ProductionDatabaseAccess=false bắt buộc. Local only NODE_ENV=test cho HTTP loopback, synthetic SYSTEM_ADMIN và signup; workers tắt, PayOS disabled. Public rate limit local 1000 tránh interference giữa browser runs; default 5 POST/60 GET từ source, UI 429 dùng fixture và unit, không giả đã stress default rate thật.

API fixture không sửa BE source. Docker Desktop data-location setting trên H: đã kiểm tra. TEMP/TMP, npm/Playwright caches, node profiles, build, evidence và screenshots ở H:. Không VPS SQL/Prisma/DB test, không prod signup/submit/toggle, không đọc production credential. Public browser API interception được cài trước navigation và deny unknown endpoint; ADMIN mapper chỉ gửi API tới owned local fixture trong approved simulated website origin.

Preview route và source-map flag chỉ ở `preview/`, không ở candidate/build production. Fixture state/copy rõ trong tests; production adapter không dựng success giả. Form/contact/review không URL, analytics, console hoặc persistent storage. Response/config/input chỉ render React text; kiểm prototype-named codes không lookup inherited object properties. Auth cookie/CSRF không bundle hoặc trace. Admin traces tắt để tránh ghi cookie; screenshot data synthetic.

### Defects đã sửa và evidence

| Defect | Reproduction / cause | Fix / regression evidence dưới evidence root |
|---|---|---|
| Lượt mới tự submit | Browser default activation xảy ra sau type button → submit đổi trong onClick | preventDefault trước newSubmission; public integration exact request count/key/body; public-candidate và final logs |
| Focus bỏ summary / vòng Tab Firefox | Focus query thiếu summary; Firefox đưa scroll DIV vào Tab order | Có summary trong focusables; content tabIndex=-1. keyboard-before-fix, firefox-summary-before-fix JSON activeTag DIV, public-regression-batch2 PASS |
| Mobile Admin tràn ngang | Absolute sr-only trong table thoát scroll containing block | position:relative trên tableScroll; admin-batch3 geometry FAIL trước fix, full final five widths sau fix |
| Malformed auth failure không clear phiên | Shared client parse/schema error xảy ra trước 401/403 auth invalidation | Invalidate malformed authorization; auth-before-fix FAIL / auth-after-fix PASS, unit + browser expiry |
| Prototype-named code/status | Dictionary lookup trả inherited __proto__/constructor/toString | Object.hasOwn guard; proto unit FAIL trước fix/PASS sau fix; malicious fixture browser regression |

Các harness lỗi cũng lưu nguyên: admin fields fixture null sai contract (đổi array đúng DTO, không nới schema); local cookie jar bị anonymous clear-cookie overwrite (chỉ capture authenticated response); 429 fixture thiếu CORS expose header; Firefox intentional route.abort có diagnostic được assert chính xác, không ignore lỗi bất ngờ. Một lượt Admin bị invalidated do build thay manifest khi server cũ đang chạy đã dừng và restart server; không dùng kết quả đó làm PASS. Các independent defects được gom batch và chạy lại affected suites, rồi validation final với stable build.

### Validation và release receipt

Evidence root: `H:/HomeMind/tasks/feedback-popup-fe/20261010-phase2-233e715/`. Kết quả validation cuối, coverage, source fingerprint, screenshot review và gate/deploy receipts được ghi ở phần tiếp theo khi hoàn tất. Tại thời điểm lập phần này: **chưa commit/push/deploy Phase 2**, chưa tuyên bố release complete. Lịch sử Phase 1 và logs failed intermediate được giữ; không lấy coverage UI abstract để thay coverage Phase 2.

### PENDING BACKEND API DOCUMENTATION — PHASE 2 (sau đồng bộ)

Endpoint/DTO/auth/error/reward lifecycle cần cho feature hiện tại đã có và đóng băng tại SHA trên. API hiện **không hỗ trợ** tổng toàn campaign/total unique rewards tổng, feature usage thực tế, một enum PAUSED riêng hoặc public reward/account lookup: UI không bịa metric và không mở dò account. Nếu sản phẩm cần các khả năng đó phải có contract được user cung cấp sau; không là endpoint “ngầm” đã tích hợp. Hardware keyboard/notch/IME/AT/native zoom và browser minimum versions chưa có thiết bị xác minh; engine/viewport simulation không thay evidence thiết bị thật.




### Phase 2 — LOCAL VERIFICATION COMPLETE, publication/CI/deploy còn chờ

Đã giữ UI/focus trap/session/scroll locking và lịch sử Phase 1. Boundary fail-closed tạm thời đã thay bằng API thật 233e715; form bốn trường và Admin management dùng endpoint được xác minh. Không bỏ UI, không dựng API report FE giả, không đổi BE contract. PUBLIC nằm trên `/`; Admin dùng login/shell/coordinator hiện có, routes `/bang-dieu-khien/phan-hoi-qua-tang` và `/[submissionId]`.

**REAL API integration verified LOCAL:** 14 contract/integration tests Nest+PostgreSQL; Public browser trên bốn engine gồm simultaneous two tabs/one logical award; Admin thật login/logout, guest/customer denial, missing/wrong CSRF, audited local toggle/revision conflict, real filters/list/detail/account linking/dates/repeated submissions. Mẫu paid/manual/scheduling/unknown lifecycle presentation dùng contract fixtures; không nói đã tái chạy toàn bộ BE regression paid/manual trong FE suite. Public HTTP202 chỉ là đã gửi thông tin; không có gift/account status, không suy activation/expiry.

Các bug và correction bổ sung sau review:

- WebKit cookie Secure không được giữ bằng HTTP route.fetch mapper: tái hiện csrf200/login403, đổi **test transport** sang owned loopback HTTPS CONNECT proxy + private one-day SAN certificate; exact two host allowlist, ownership/port/revision guards. Không đổi cookie, CORS, CSRF, OS hosts/cert store hoặc production config. Raw BE Set-Cookie giữ Secure/HttpOnly/SameSite=Strict; WebKit context cookie metadata báo None, là giới hạn instrumentation được ghi riêng; không dùng metadata đó để tuyên bố đã thay cookie contract.
- Pointer WebKit không focus nút campaign: fail focus restore trước fix; đặt focus opener tại trigger trước Confirmation. Không sửa modal/login dùng chung; actual toggle/cancel/focus trên bốn engine đã PASS.
- Notification nằm ngoài vùng cuộn mobile sau submit: `outcome-viewport-before-fix` 3 FAIL, sau fix notice scroll tức thời trong modal, giữ keyboard focus; mobile outcome/current screenshots PASS, đã mở ảnh.
- CTA lượt mới vẫn bật khi outcome + campaign disabled/unknown: `outcome-config-before-fix` 2 FAIL. Bỏ exception outcome trong disabled predicate; current gate tests gồm loading recovery, keyboard trap không có CTA enabled, giữ draft/no extra POST, manual recovery/new key. 36 affected browser cases PASS trên bốn engine.
- Harness race khi đóng context ngay sau401 redirect: chờ finite guest read của login page. WebKit explicit navigation abort có exact access-control diagnostic; chỉ chấp nhận khi có `requestfailed` đúng owned URL/reason `Load request cancelled`, và vẫn assert PATCH count/cleanup. `admin-navigation-diagnostic` 2 FAIL trước correction; transport regression 24 PASS. Không ignore lỗi console bất ngờ, không skip/nới business assertions.

Một số failure contexts từng giữ **synthetic local** password; đã redacted task artifacts và afterEach clear input trước context capture. Không có production credential được đọc/injected/captured. Admin traces/video/screenshots failure tự động tắt; visual data synthetic/owned local.

| Suite / command | Kết quả cuối | Evidence dưới root H: |
|---|---|---|
| UNIT: `npm run test:feedback:unit; c8 scoped --all` | 210 PASS | `unit-last-source.json` |
| REAL_CONTRACT: `npm run test:feedback:contract; owned fixture` | 14 PASS | `real-contract-release-candidate.json` |
| PUBLIC: `test:feedback:browser; 39 cases × four engines; affected/full/real union` | 156 PASS | `public-final-source-mock.json; public-config-gate-final.json; public-real-release-candidate.json` |
| ADMIN: `test:feedback:admin; 48 cases × four engines; repair/auth/detail/optional union` | 192 PASS | `admin-all-final.json; admin-transport-regression-final.json; admin-final-auth-detail.json; admin-optional-final.json; admin-conflict-final.json` |
| LEGACY_UI: `playwright -c playwright.feedback.config.ts; 31×four, 28 affected rerun` | 124 PASS | `fixture-release-three.json; fixture-release-webkit.json; legacy-outcome-final-source.json` |
| HOMEPAGE: `playwright test; direct/reload/legal/menu/hero/FAQ/favicon/assets` | 31 PASS, 25 SKIP | `homepage-candidate-final.json` |
| EXISTING_ADMIN_UNIT: `npm run test:admin:unit` | 8 PASS | `existing-admin-unit-final.json` |
| DEPLOY_REHEARSAL: `python -m unittest discover -s tests/deploy -v` | 22 PASS | `logs/deployment-final.log` |


Tổng case độc lập: **757 PASS; 0 FAIL mới còn mở; 25 SKIP baseline không tính PASS**. Chỉ counting PASS sau fix và rerun; giữ original failure JSON/logs. Catalogue36 unchanged PASS; lint/typecheck PASS (5 img warnings baseline), production candidate/preview builds PASS. Reproducible npm ci H: 377 packages PASS; production audit official registry0; source/history gitleaks + secret boundaries no findings. Bash/shellcheck/deploy rehearsal PASS. Không đổi threshold/exclude coverage, test stack hoặc workflow.

Full dev audit informational có 5 high **đã có trong baseline c114**, confirmed `baseline-audit.json` giống candidate, không phải regression. [GitHub advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) hiện không có patched braces version. Required workflow dùng production `npm audit --omit=dev`: PASS; không nới gate hoặc force downgrade. Tool giới hạn hardware keyboard/notch/OS IME/native Safari/macOS/real AT/native zoom/browser minimum versions: BLOCKED device verification; engine/input-event/viewport/reflow simulation được ghi đúng phạm vi. Default BE rate5/min chưa stress riêng do local fixture dùng1000, không tính real default429 PASS; FE429 unit/fixture PASS.

Coverage engine c8/V8 + browser source maps trên H: preview; source map/preview route không ở production candidate. Giữ raw generated CSS/mapped branches. Không reuse coverage FeedbackExperience sau thay source: thay bằng current build. Các phần unchanged đã freeze mapping và verify byte SHA trước merge. ADMIN/current shared code unchanged khi Public fix; previous evidence không gán toàn bộ runtime mới mà xét footprint và rerun affected behavior. Rerun36 sau CTA predicate chỉ thay outcome+non-enabled; enabled/idle cases tương đương boolean, old full140 giữ provenance; current37 Chrome coverage và real8 chạy trên candidate cuối. Production build cuối `logs/build-unknown409-candidate.log`, runtime source không đổi sau build; test-only additions đã lint/typecheck/current210.

| Scope | Statement | Line | Function | Branch |
|---|---:|---:|---:|---:|
| PUBLIC | 100% | 100% | 100% | 100% |
| ADMIN | 100% | 100% | 100% | 98.86% |
| SHARED_CLIENT_AUTH | 99.65% | 99.65% | 74.07% | 94.46% |


Remaining raw gaps: Admin Management JSX span174 maps columns270→191 (invalid source span; empty/normal/superseded segments have separate asserted UI evidence, retain mapped gap); use-query12 defensive unauth phase return unreachable while mounted through existing AdminGuard; generated CSS wrapper branch50% kept. Shared client/auth includes older request dedup/budget/wait callbacks, BroadcastChannel/read/refresh/password/revoke and pageshow persisted paths beyond changed feature; detailed location/function/hit list `coverage-phase2-release/uncovered.json`, not labelled full auth coverage. New withAdminCsrf guest/checking/error/aborted/fresh-token and phase/revision stale-write guards have7 explicit unit tests plus actual cookie/CSRF browser/API enforcement. Percentages do not prove every possible real-world scenario.

Evidence: `coverage-phase2-release/summary.json`, `coverage-final.json`, `source-version-evidence.json`, `uncovered.json`, `index.html`; screenshots `screenshots-release/public-initial-{360,390,768,1280,1440}.png`, guides/low viewport, pending/submitted/rejected/uncertain390/1280; public/browser five-width form images; Admin list/detail/confirmation five widths plus filtered table/legacy detail. Important images actually opened; before-fix images retained. Screenshot fixtures are not production responses.

Source/tests/config SHA256: `4adb9ce9a6f0dabb5c6a3474118d8fb8c5e402eb9e3ac08a9a425a8b0c0e2b3d`. Runtime/package SHA256: `96b32ee98ea9f349982706a082bf3fefa8a6a2e660749ea73e933f0932e3b96b`. Manifest: `tested-phase2-source-manifest.json`; preview source byte-equal. Full diff/working-tree hashes and publication receipt generated separately to avoid self-reference. After final runtime tests only report/evidence changes; source mutation requires affected verification.

### Task-owned files prepared for release

- `.env.example`
- `docs/HOMEMIND_FEEDBACK_POPUP_FRONTEND_IMPLEMENTATION_REPORT_VI.md`
- `docs/HOMEMIND_FEEDBACK_POPUP_FRONTEND_TEST_MATRIX_VI.md`
- `package-lock.json`
- `package.json`
- `playwright.feedback-admin.config.ts`
- `playwright.feedback-contract.config.ts`
- `playwright.feedback-integration.config.ts`
- `playwright.feedback-unit.config.ts`
- `playwright.feedback.config.ts`
- `src/app/(admin)/bang-dieu-khien/phan-hoi-qua-tang/[submissionId]/page.tsx`
- `src/app/(admin)/bang-dieu-khien/phan-hoi-qua-tang/page.tsx`
- `src/app/page.tsx`
- `src/config/public-api.ts`
- `src/features/feedback-admin/Management.tsx`
- `src/features/feedback-admin/api.ts`
- `src/features/feedback-admin/management.module.css`
- `src/features/feedback-admin/use-query.ts`
- `src/features/feedback/FeedbackCampaign.tsx`
- `src/features/feedback/FeedbackExperience.tsx`
- `src/features/feedback/FeedbackPopup.tsx`
- `src/features/feedback/adapter.ts`
- `src/features/feedback/feedback-popup.module.css`
- `src/features/feedback/http-adapter.ts`
- `src/features/feedback/policy.ts`
- `src/features/feedback/scroll-lock.ts`
- `src/features/feedback/session.ts`
- `src/features/feedback/validation.ts`
- `src/layouts/admin-shell.tsx`
- `src/lib/admin-api/client.ts`
- `src/lib/auth/admin-session.ts`
- `tests/browser/brand-legal.spec.ts`
- `tests/browser/fixtures.ts`
- `tests/browser/icon-colors.spec.ts`
- `tests/browser/landing.spec.ts`
- `tests/feedback/adapter.unit.spec.ts`
- `tests/feedback/admin-csrf.unit.spec.ts`
- `tests/feedback/admin-fixtures.ts`
- `tests/feedback/admin-integration.spec.ts`
- `tests/feedback/admin-real-contract.spec.ts`
- `tests/feedback/admin.unit.spec.ts`
- `tests/feedback/contract-fixtures.ts`
- `tests/feedback/https-proxy.mjs`
- `tests/feedback/integration.spec.ts`
- `tests/feedback/local-fixture.ts`
- `tests/feedback/popup.spec.ts`
- `tests/feedback/preview-page.tsx`
- `tests/feedback/real-contract.spec.ts`
- `tests/feedback/report-browser-coverage.mjs`
- `tests/feedback/scroll-lock.unit.spec.ts`
- `tests/feedback/session.unit.spec.ts`
- `tests/feedback/validation.unit.spec.ts`


### Publication boundary tại checkpoint LOCAL

User Phase2 explicitly supersedes STOP BEFORE COMMIT. Candidate là isolated H: worktree `feat/landing-feedback-phase2` tại basec114; owner D: branch/HEAD/index và4 deployment markdown modifications được bảo vệ, không stage/copy chúng vào candidate. Chỉ stage task-owned allowlist sau review. MAIN/CI/deploy **chưa được ghi PASS trước receipt thực**. Runbook/workflow unchanged: unprotected MAIN nếu verified → normal non-force push → mandatory build/source/security/Linux image smoke PASS → trusted automatic landing-only deploy (needs build) → read-only web/guest/config/healthz verification. Không dispatch/SSH improvised/deploy duplicate. Source fingerprint + authorized-release-files.json là input review, không bao gồm private fixture/cert/cache/artifact.

VPS/database boundary: tất cả SQL/schema fixture/account/feedback/reward writes chỉ owned local PostgreSQL. Không VPS DB test/SQL/migration/seed/stress, không production signup/login test/submit/admin toggle. Public GET production pre-release actual200 enabledfalse revision1 in `production-public-config-before.json`, không lấy historical value làm current proof. Campaign chỉ control cho SYSTEM_ADMIN thao tác sau; không bật khi release. Post-deploy receipt phải ghi current state/read-only verification. Rollback follows existing trusted controller/runbook; local22 failure-containment tests PASS, không test rollback bằng tác động production.

PENDING BACKEND API DOCUMENTATION — PHASE 2: endpoint/DTO/auth/current lifecycle required đã xác minh, không còn blocker contract trong feature. Unsupported global totals/feature usage/PAUSED/public lookup là N/A, cần contract mới nếu muốn mở scope; không tự thêm. Operational release status cập nhật ở receipt sau khi có SHA/check/deploy thật.


## Phase 2 — publication receipt / VPS gate bị chặn

**PARTIAL — MAIN_PUBLISHED / VPS_DEPLOYMENT_BLOCKED.** Không tuyên bố `FRONTEND_PHASE2_RELEASE_COMPLETE`.

Commit tiếng Anh: `feat(landing): integrate premium feedback and admin campaign management`.
Commit và GitHub MAIN SHA: `5d55b1b842aef09bfe729c69ace8e79d74863bb2`. Backend contract giữ nguyên `233e71562dda9ce3f7776e2fa52f23db3d96be21`.
Runtime/source đã kiểm thử không đổi sau validation cuối; chỉ bổ sung receipt tài liệu. Source/tests/config SHA256 `4adb9ce9a6f0dabb5c6a3474118d8fb8c5e402eb9e3ac08a9a425a8b0c0e2b3d`; runtime/package SHA256 `96b32ee98ea9f349982706a082bf3fefa8a6a2e660749ea73e933f0932e3b96b`; Git tree `bf60b78d87251e8a5a0dfb34d2fdeba00149bb31`. Git clean-filter/index blobs đã so sánh với mọi file đã test trước commit. Hai report được chuẩn hóa line endings LF khi staged diff check phát hiện CR thừa; không sửa runtime/test để làm check xanh.

52 file task-owned đã commit riêng tại H: worktree, normal non-force push trực tiếp MAIN sau khi xác minh unprotected/rulesets trống và remote đúng baseline. Không stage owner deployment markdowns, không sửa nhánh/HEAD/index của owner D:. MAIN mới được xác minh bằng GitHub API. Không force push, bypass protection, PR/merge hoặc CI/config thay đổi.

| Gate thực | Kết quả | Evidence |
|---|---|---|
| Mandatory LOCAL (phạm vi kiểm thử khả dụng) | PASS: 757; baseline25 SKIP không tính PASS; hardware gap vẫn ghi riêng | `local-verification-receipt.json`; matrix execution ledger |
| GitHub MAIN publication | PASS: exact SHA trên | `logs/push-main.log`; `publication-input.json`; staged diff/hash checks |
| CI build/source/security/controller/Linux image/browser/provenance/private publication | PASS | [Build job](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434/job/114274817010); `ci-deployment-first-attempt.json`; `logs/ci-run-final.log` |
| Private tested image | Published immutable digest `sha256:aa240c91300c0f9bd2065379331f1188504ae8d25638e859646aa2b5bd7f369b` | CI publication PASS; digest truyền vào trusted deploy log. Workstation token không có read:packages để query versions (403), không thay scope hoặc giả dùng query đó làm evidence |
| Trusted automatic VPS deploy | **FAIL** | [Deploy job](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434/job/114276132991); `logs/ci-failed-final.log` |
| New revision frontend smoke / new admin routes after deployment | **BLOCKED_NOT_DEPLOYED** | GET healthz vẫn c114; quản lý list/detail trả404; không gán trang cũ cho evidence bản mới |
| Current website / campaign read-only checkpoint | Homepage/legal/login200; config200/no-store, enabledfalse/revision1 | `production-readonly-blocked-checkpoint.json` |

Workflow [19](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434), exact candidate SHA, build SUCCESS; deploy FAILED ở `Reject an obsolete main release and deploy exact digest`. SSH identity setup PASS; controller trả `docker operation failed or timed out` lúc `2026-10-10T17:55:29Z`, exit1. Public acceptance/conditional rollback steps SKIPPED vì deploy không thành công, không tính PASS. Không dispatch workflow, rerun deploy, đổi check, dùng SSH improvised hoặc bật campaign.

Nguyên nhân lệnh Docker cụ thể **UNVERIFIED**: `deploy/release.py:71` cố ý gom CalledProcessError/TimeoutExpired thành thông báo trung tính; Actions log không chỉ ra subcommand/stderr. Không đủ evidence để kết luận container thiếu, daemon lỗi, thiếu quyền hay private pull lỗi. Runtime/guard baseline có thể cần đối chiếu sau BE release, nhưng đó chỉ là giả thuyết. Bước tiếp theo cần operator dùng kết nối đã xác minh/runbook và diagnostic chỉ đọc `deploy/vps-admin-release-diagnostic.py` để xác định command/category, current/previous và protected identities. Không tự truy cập DB, thay guard/backend/config để vượt gate. Đã yêu cầu kết quả diagnostic; không mặc định im lặng là quyền thay cấu hình.

GET HTTPS healthz trả200/no-store, revision `c1142d937d8dc962d4b090d36457f012e1be9824`; `/`, `/privacy-policy`, `/terms-of-service`, `/dang-nhap` trả200; hai path quản lý list/detail mới trả404. Đây là observation trang cũ còn phục vụ, **không** chứng minh candidate đã deploy, controller đã rollback hay protected runtime toàn VPS không đổi. Không kiểm tra feature authenticated trên production. Public GET config vẫn disabled/revision1 giống pre-release; không có production feedback/account/reward/admin-toggle request.

Rollback readiness: controller/runbook giữ current/previous, high-watermark, app-only records; local22 failure-containment tests PASS. Không thực hiện rollback production; tình trạng retained previous slot thực tế cần operator đọc qua runbook. Task không sửa VPS/backend/DB/settings và không chạy production PostgreSQL/Prisma/SQL/schema/migration/seed/stress. Không kiểm tra DB để giải thích deploy failure.

Final operational counts tách khỏi LOCAL cases: CI build1 PASS; deploy1 FAIL infrastructure; new revision smoke1 BLOCKED; hardware DEVICE-01 BLOCKED; không còn contract blocker trong PUBLIC/ADMIN feature. Phạm vi không track/global totals/PAUSED/public account lookup giữ4 N/A. Baseline dev audit5 high informational giữ riêng; production audit0 PASS. Không tuyên bố ALL PASS hoặc production readiness.

Evidence root `H:/HomeMind/tasks/feedback-popup-fe/20261010-phase2-233e715/`. `release-blocked-receipt.json`, `ci-check-runs-final.json`, original CI failure logs, fingerprints/coverage/screenshots còn nguyên. Report receipt này được giữ trong working tree để user review; không push thêm commit tài liệu kích hoạt thêm lần deploy cùng candidate. Runtime source/verified GitHub commit không thay đổi.


## VPS deployment recovery — kết quả cuối 11/10/2026

**RELEASE_COMPLETE_VERIFIED**. Đã tiếp tục candidate5d55b1b, không tạo lại popup/Admin/API/tests. Historical failed attempt1, blocked receipt và root-cause evidence giữ nguyên; MAIN/source/dependencies/controller/workflow không đổi.

Root cause đã chứng minh: `Controller.rollout → protected → docker inspect --format {{json .State}}` gọi guardID API cũ `a5d3e6d2…` không tồn tại; exit1/NO_SUCH_OBJECT, không timeout. Cả API/DB guard07/10 obsolete sau verifiedBE release10/10. Docker29.8.2 active và tài nguyên đủ; lỗi trước privatepull/candidate/switch nên release18/high-watermark18 còn nguyên. Historical CI rawstderr không được lưu; current underlying command được tái hiện độc lập, không giả có log chi tiết lịch sử.

Owner đã cho phép chỉ Docker metadata của đúng API/DB và guardfrontend update. Actual images/API-DB metadata khớp BE233e715; bindings/networks/restart/readiness/four protected hashes/Nginx start giữ nguyên. Đổi chỉID/StartedAt ở `/etc/homemind-landingpage.json` dưới private lock/expected config/controller/state/currentSHA checks, exclusive600 backup/atomic replace/pre-post trusted protections/publicsmoke. ConfigSHA256 e259a9cb… → d7fc4fcb…; backup `/var/backups/homemind-landingpage-guard-before-feedback-phase2-20261011.json`. Backend/DB/proxy/campaign không sửa; release state không đổi trong reconcile.

Final local verification: repository deployment22PASS và task recovery26PASS, **48 distinct PASS**, gồm immutable/stale/duplicate handling, original error/timeout, failure containment/previous preservation/rollback, metadata guards, exact-byte restore/backup collision/state race và actual slot archive identity. Không cộng rerun vào757 application cases hoặc CI acceptance. Application151source/test/config files vẫn byte-match manifest `4adb9ce9a6f0dabb5c6a3474118d8fb8c5e402eb9e3ac08a9a425a8b0c0e2b3d`; runtime fingerprint `96b32ee98ea9f349982706a082bf3fefa8a6a2e660749ea73e933f0932e3b96b`, Git treebf60b78d…. Giữ757 local PASS/25baselineSKIP và coverage đã đo (Public100%; Admin100%statement/line/function/98.86%branch; combined99.86%statement/line/90.41%function/98.35%branch). Source không đổi nên không chạy lại UI/build/lint đã PASS; recovery helpers được testLinux. Historical helper import/invocation/encoding failures vẫn lưu, không nới assertion/security flags.

Chỉ một official `gh run rerun 38073244434 --failed`; không workflowdispatch/SSHmanualdeploy/newcommit. [Attempt2](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434/attempts/2) SUCCESS, [deploy114373825796](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434/job/114373825796) SUCCESS. Successful build tái sử dụng (startedAt vẫn2026-10-10T17:48:35Z). Exactdigest controller PASSED; public gate31PASS/25baselineSKIP, guestguard/contrast/privatefiles404PASS. Conditional rollback/failure artifact SKIPPED/N/A vì không cần, không tínhPASS.

**Production thực:** activegreen3101 healthy/restart0/exactSHA5d55/digest `sha256:aa240c91300c0f9bd2065379331f1188504ae8d25638e859646aa2b5bd7f369b`; OCI provenance/amd64/linux/usernode đúng. Current/lastoutcomehealthy/PASSED, high-watermark19, no lock holder/pending activation. Independent browser real HTTPS/GET-only PASS: healthz200/no-store/exact5d55; home360/390/768/1280/1440px, navigation/FAQ/nooverflow; legal200; login blank/no-store; newAdminlist/detail deployed/guestredirectlogin, không routing404 hoặc private data. Generated assets200/errors0. Đã capture và mở9ảnh public/legal/Admin; không giả physical devices. Real publicconfig vẫn disabled/revision1/no-store, popup invitation không hiện đúng contract. Không submit/login/customer API test trênproduction.

Previousblue3100 exactc114/digest82f27dc5… vẫnhealthy, health200 và archive/route snapshot đủ: **previous-slot readinessPASS**. Không production rollback rehearsal. Archived previous server.json còn historicalBEIDs (`archiveGuardMatchesActiveBaseline=false`); không ghi đè archive/release metadata. Nếu owner yêu cầu trusted rollback sau này, cần reconcile frontendguard theo liveauthorizedBE metadata/expectedhash/backup procedure trước verify/deploy tiếp; không khôi phục BE/DB để khớp snapshot cũ. Không gọi full automatic backend-baseline adoptionPASS; đây là caveat archive có sẵn.

Evidence root: `H:/HomeMind/tasks/feedback-popup-fe/20261010-phase2-233e715/recovery-20261011/`. Dedicated report `HOMEMIND_LANDINGPAGE_VPS_DEPLOY_RECOVERY_REPORT_VI.md`, receipt `release-recovery-receipt.json`, `HomeMindDeployment/{frontend-before,guard-metadata-current,guard-reconciliation-applied,frontend-after-deployment,guard-metadata-after-deployment,frontend-slot-readiness-after}.jsonl`, CI/logs, screenshots và final Git/source receipt. Recovery không tạo MAIN commit chỉ ghi success receipt; chỉ cập nhật hai task report workingtree sau hash preflight. OwnerD HEADc114/main/index và owner deployment docs/CLAUDE/release report được giữ nguyên, không stage/branch change.

Không production SQL kể cảreadonlySQL, DBtest/Prisma/migration/seed/reset/stress/exec/env/volume reads, fakeaccounts/feedback/reward writes, authlogin hoặc campaigntoggle. Approved metadata trước/sau semantic-identical cho API/DB/protected files/units, campaign vẫndisabledrevision1. Không backend image/code/config/rule changes. Rootcause/fix/localtests/requiredCI+deploy/exactwebsiteSHA/legal/Adminguard/previous-slot/safety/evidence đều xác minh; còn physical-device limits và rollback operational caveat nêu rõ, không còn blocker cho release recovery.

## Popup Marketing Redesign + 120s Timer — 11/10/2026

Checkpoint của task mới: **LOCAL_READY**, chưa commit/push/deploy redesign. Các receipt Phase 1/2/recovery phía trên là lịch sử. Campaign ở baseline task mới đã được administrator bên ngoài bật: GET thực `enabled=true`, `revision=2`, `updatedAt=2026-10-11T03:17:52.360Z`; task không thực hiện toggle. Không lấy giá trị disabled của recovery làm trạng thái hiện tại.

### Baseline, phạm vi và contract

FE origin `QuangVMZu/HomeMind_LandingPage`, MAIN/website revision `5d55b1b842aef09bfe729c69ace8e79d74863bb2`. BE `QuangVMZu/HomeMind`, MAIN được đối chiếu `233e71562dda9ce3f7776e2fa52f23db3d96be21`. Tài liệu API/handoff archive đối chiếu Git blob chính thức lần lượt `1ba7c93059153fd04b6660ceb7e8f01bb1a81e8b` / `aa5558063e4e23d81e509e1aafb42613041d838a`; không tự đổi contract. Nguồn đầy đủ và hash ở `evidence/api-baseline.json` dưới root mới.

Không cần BE changes: thay đổi chỉ placement/copy/layout/invitation scheduling/legal và tests. Public GET `/v1/public/feedback-popup`, POST `/v1/public/feedback-popup/submissions`, adapter/base URL từ config hiện hữu, credentials omit/no-store/origin/idempotency/fresh pre-submit/validation/timeout/202 neutral không đổi. Admin cookie/CSRF/SYSTEM_ADMIN/API/route không sửa. Không thêm consent/OTP/quota/endpoint/account lookup hoặc reward allocator phía FE.

Owner D: checkout vẫn HEAD `c1142d937d8dc962d4b090d36457f012e1be9824`, branch `main`, index baseline SHA256 `0ca6b5c8993521cbaa118634c31c981891808d133d1c125543f08b690d49ce60`. Candidate task riêng trên H: branch `feat/premium-popup-redesign`, base MAIN5d55; hai report có uncommitted recovery history được mang sang và giữ. Không mang owner deployment markdowns/CLAUDE/dirty files khác vào release. Baseline byte hashes/diffs ở `evidence/baseline.json`, `owner-status-before.txt`, `owner-diff-before.patch`, `owner-staged-before.patch`.

Evidence root mới: `H:/HomeMind/tasks/feedback-popup-fe-redesign/20261011-main-5d55b1b/` (các đường dẫn tiếp theo tương đối root này). TEMP/TMP, npm cache, browser artifacts, TLS fixture, log/coverage/screenshots ở H:. Browser binaries có sẵn trong H: task cũ; Docker Desktop settings xác minh storage `H:/DockerDesktopWSL/DockerDesktopWSL`. Không đổi máy/global config hoặc restart/prune daemon.

### UI, wording và pháp lý

Modal rộng tối đa1000px; ≥900px grid38/62 thực, form có tên/phone ngang và email/review toàn cột; ≤899px stack, ≤479px single-field. Hero emerald/navy, icon Gift sẵn có, input16px, close44px, CTA≥48px, footer CTA riêng giữ trong viewport; nội dung scroll khi cần trong safe-area/visualViewport/100dvh. Entrance fade/scale200ms; reduced-motion tắt effects của popup/CTA. Không dependency/lockfile/ảnh stock mới.

CTA cũ “Góp ý và tìm hiểu quà Premium 30 ngày” đổi thành “30 Ngày Đặc Quyền Premium”, chuyển strip gần footer về cạnh CTA hero hiện hữu, giữ các section/anchors. Heading đồng nhất, subtitle “Chia sẻ góp ý của bạn để đăng ký trải nghiệm HomeMind Premium.”; submit “Gửi góp ý & đăng ký trải nghiệm”. Bỏ nguyên câu bốn-trường bắt buộc theo yêu cầu; mỗi label có sao đỏ aria-hidden, control vẫn required/aria-required/error-describedby. Hướng dẫn ba bước trong details mặc định đóng; policy one-account/one-gift luôn hiện ngắn. Success chỉ “đã ghi nhận góp ý”, không suy diễn activated/expiry hoặc gửi email/mã đổi quà.

Popup có links thật `/terms-of-service#premium-30-ngay` và `/privacy-policy#gop-y-nhan-qua-premium`, tab mới noopener/noreferrer + accessible hint, giữ draft khi quay lại. Hai trang bổ sung duy nhất section cuối; source-hash tests bảo vệ byte-equivalent mọi nội dung cũ sau newline normalization. Terms giữ phân biệt ACCEPTED/nomination/award/activation, contact matching/account ownership, trial budget2.592.000 giây, paid/manual scheduling/pause, không submit+30days. Privacy ghi đúng fullName/phoneNumber/email/review và metadata được docs xác nhận (submission/time/idempotency/IP hash/UserAgent/optional submitter), mục đích/audit/liên kết đúng quyền; giữ retention/rights/contact cũ, không hứa thời hạn/consent/marketing mới. Ngày hiệu lực06/10 giữ; last updated11/10 và content version2026.10.11.1. Không có yêu cầu owner/legal approval riêng trong source/runbook đã đọc; đây là bổ sung dựa contract, không tư vấn/phán quyết pháp lý mới.

### Scheduling state machine

`REOPEN_DELAY_MS=120_000` là constant duy nhất. Một scheduler owner theo Document. Initial mount fresh GET: chỉ mở ngay sau config strict enabled khi home/visible/focused và không website dialog khác. X/Escape close tạo timestamp `now+120000`; lần close sau reset deadline. Manual open hủy lịch; deadline đến khi đang mở không thao tác/reset form. Không session/localStorage suppression.

Khi due, fresh no-store GET; enabled mở một lần. Unknown/disabled/error/malformed/403 fail closed và recovery chỉ GET hữu hạn sau120s. Hidden/lost focus/website dialog hoặc alertdialog đang giữ focus: chờ visibility/focus/MutationObserver, rồi fresh check, không polling background/multiple timeout. Ngoại lệ an toàn này cố ý trì hoãn opening đến khi không cướp focus. Navigate/unmount stop/dispose owned timer/listeners/observer, generation bỏ stale response. StrictMode probe initialization được queueMicrotask+active guard; Fast Refresh và duplicate mount không sở hữu timer thứ hai.

Scheduler chỉ invitation, không POST/draft/key/reward logic. Close pending không abort để tiếp tục nhận outcome; reopen giữ pending/success/error/uncertain. New submission hoặc retry là user action; key same cho manual retry, key mới cho lượt mới; không tự gửi/nhận lại quà. Config tắt trong modal giữ draft và fresh pre-submit/BE gate chặn, không ép đóng mất dữ liệu.

### Defect/regression evidence

- Unit phát hiện start lấy open state quá sớm ở constructor: đọc snapshot lại tại start; failed-before và235 unit PASS sau sửa.
- Next dev StrictMode phát hai initial GET: browser regression fail-before gets2, queueMicrotask active guard sửa nguyên nhân;3 strict-mode browser PASS, Fast Refresh real dev giữ draft/one dialog/one deadline PASS.
- Native WebKit Tab bỏ links dù DOM trap liệt kê chúng: explicit tabIndex0 sửa legal links; kiểm keyboard trên bốn engine với assertions giữ nguyên.
- Harness label-star matching: locator exact-label chứa dấu sao trong label text; role textbox/name chính xác dùng accessible name và required/label assertions vẫn kiểm. Bare legacy fixture không có production CTA: chỉ fixture-specific opener được sửa, four-engine targeted4PASS; historical full run122PASS/2FAIL được giữ, latest case aggregation không coi failed run là toàn xanh.
- Tailwind4 colors lab() khiến contrast parser cũ đọc sai: dùng canvas sRGB của màu thật; AA assertion không nới.
- Native legal hash trên WebKit một lần dừng scroll3663 thay vì mục cuối (trace/screenshot giữ trong redesign-final). Repeats5 và diagnostics varying CSS/cache/JS hydration đều đạt; trigger race cụ thể **chưa tái hiện ổn định**. Có inherited homepage smooth-scroll animation trên legal: regression native navigation expectation fail-before; CSS module chỉ khi legal article hiện diện chuyển fragment sang native immediate, không đổi homepage scrolling. Kiểm tra lại direct/reload/back và bốn engines sau fix; không giả toàn bộ timing root cause đã được chứng minh.
- Coverage helper không hiểu indexed Next dev maps và bắt sourceMappingURL trong string/earlier dependency directive: flatten sections bằng existing trace-mapping, chỉ actual comment và last directive; checked-in regression có hai source/offsets/fake directive PASS. Synthetic helper fixture tách khỏi app coverage. Không sửa application để che coverage.

### Tests, coverage và giới hạn

Lượt unit235PASS; real contract14PASS trên BE archive/Nest và PostgreSQL task-owned `homemind-e2e-f5d43f97c1ca` (DB tmpfs/no published DB port, API loopback, synthetic providers). Public actual production frontend suite156PASS trên Chromium/Firefox/WebKit/Edge; gồm actual local HTTP và hai tab/one reward fixture, IME/paste/autofill event simulation/error/timeout/neutral/outcome/keys. Fixture không có production DATABASE_URL, ownership labels kiểm trước operations. Admin regression192 distinct cases PASS:41 completed PASS từ lượt trước gián đoạn +7 Chromium resumed +144 Firefox/WebKit/Edge resumed. Hai timeout I/O trong lượt bị gián đoạn được giữ ở log, không giả full interrupted run PASS.

Các command/check còn được chốt trong matrix execution ledger. Fake clocks kiểm119999/120000 chính xác và cycles/hidden/dialog/pending/outcomes; browser DOM visibility simulation không giả background/mobile hardware thật. Widths320/360/390/768/1024/1280/1366/1440/1920,390×320,640×450 và equivalent200%reflow/visualViewport được test; screenshot trước/sau và các pending/error/success/uncertain states đã capture và OPEN inspect. Keyboard/safe-area thật, AT/physical IME/native Safari/OS zoom không có thiết bị: DEVICE BLOCKED, không tính PASS; available browser engines không thay real-device claim.

Coverage scoped unit+browser source maps: public ten JS/TS feature files (adapter/http-adapter/invitation/policy/scroll-lock/session/validation/FeedbackCampaign/FeedbackExperience/FeedbackPopup)100% line/statement/function/branch. New invitation riêng100% cả bốn metrics. Combined instrumented scope88.65% line/statement,88.02% function,97.11% branch: bao gồm unchanged Admin/shared TS chưa được browser instrument cùng run; use-query0%, shared auth/client partial là gaps có thật. Không gọi đây whole-app coverage, không dùng CSS-module generated stub làm CSS visual coverage. New legal SSR content là static JSX/data; new business branch N/A, source-preservation và actual browser kiểm, không fabricated legal render coverage. Không threshold/exclusion mới. `coverage-verified/{summary,coverage-final}.json`, `coverage-unit-final/`, `evidence/coverage-inputs.json` và helper logs giữ nguyên; historical Phase2 scope/metrics không gán cho candidate mới.

Lint0errors/5existing img warnings; production audit0, full audit5existing HIGH dev transitive ESLint chain informational, lockfile unchanged. Package/license inventory unchanged/no new dependency. Baseline static JS1,400,618 bytes → final1,403,415 (+2797; +0,20%); CSS91836→94620 (+2784; +3,03%). `evidence/build-inventory-final.json` đo output production không source maps,105 runtime source files byte-identical với candidate. CLS measured on supporting Chromium/Edge, geometry mandatory all engines; không fabricate Firefox/WebKit Layout Instability metric.

### Review, source fingerprint và release gate

Task-owned allowlist gồm source popup/timer/hero/home/legal + tests/coverage helper/playwright config + hai reports. Không package/lockfile/env/auth/Admin/.github/deploy changes; API core/session/normalizers giữ byte-identical trừ display label review. Trước publication kiểm full diff/untracked, source/history Gitleaks, private-file bundle scan, lint/type/build, existing22 release-controller regressions và pinned Linux image/readonly nonroot health/browser/failure containment. Local uncommitted image label là runtime-content fingerprint, **không giả là Git commit SHA**; CI artifact mới phải mang exact candidate commit.

Source/runtime/test hashes, allowed-file manifest, exact commands/logs/test JSON và final verdict nằm ở root evidence; fingerprint cuối được tạo sau mọi thay đổi. Mọi kiểm thử trước legal CSS fix chỉ giữ cho paths byte-equivalent không bị ảnh hưởng; legal/production build/image/related regressions được chạy lại. Không nới assertion/skip test để xanh. Historical failures được giữ.

Publication/deployment chưa được ghi PASS ở checkpoint này. MAIN/rules phải kiểm lại ngay trước normal non-force push; existing workflow required build/security/image/publication → trusted exact-digest auto deploy → public/guest checks, không manual SSH/duplicate dispatch/deploy. Operational receipts sẽ ghi ngoài Git sau deploy, không tạo MAIN commit chỉ ghi deploy-success. Independent live health phải exact new SHA, legal/login/Admin route protected và campaign GET/no-store; production requests chỉ GET/website, zero database tests/SQL/Prisma/business writes/login/toggle/backend changes.

### Final local execution, storage recovery và file review

978 PASS distinct: unit235; isolated real contract14; PUBLIC production browser156; redesign196; ADMIN192; legacy popup124; Linux image smoke31; existing Admin unit8; deploy rehearsal22.25 baseline SKIP chỉ thuộc mobile duplicate cases của image smoke. Không cộng coverage/reruns/StrictMode/HMR/helper checks vào978. Latest per-case aggregation ở `evidence/latest-test-ledger.json`;74 definition mới có ledger trong matrix. Historical REDESIGN183PASS/1FAIL và LEGACY122PASS/2FAIL giữ nguyên; legal16PASS, keyboard4PASS, rejected8PASS và legacy shell4PASS là targeted verification thay đúng case bị ảnh hưởng, không nới assertions. Không có software requirement mandatory còn BLOCKED/FAIL/NOT_RUN ở local; physical-device row vẫn BLOCKED. Publication/live rows NOT_RUN trước phát hành.

H: bị Windows disk153/UASPStor129 ở Disk1, làm build/lint/Admin đứng chờ I/O. Evidence `windows-storage-interruption.json`, logs Admin cũ và fixture exited255/noOOM được giữ; không khẳng định nguyên nhân vật lý sâu hơn. Sau owner báo ổ ổn định/Docker đã mở, chỉ task-owned fixture `homemind-e2e-f5d43f97c1ca` được setup lại với tmpfsDB/synthetic providers/testmode/loopback. Không restart/prune shared Docker, không đụng fixture BE/owner. `fixture-recovery-owned.json` PASS; final build46,63s/lint/typecheck, real contract14 và Admin151 affected/remaining cases PASS. Việc fixture mới mất dữ liệu tmpfs cũ không được giả là dữ liệu giữ lại; prior real test receipts vẫn lưu riêng.

Final runtime source hash `35b0f246ca1be01881ea9bf1c42a2be3b670e5bb5782ef965a47e4f6738d592f`. `verification-reuse-scope.json` xác nhận ten public logic files dùng coverage và các API/Admin/auth/deploy paths không đổi sau legal hardening; chỉ legal module/import và CSS BOM normalization ảnh hưởng runtime. Related legal16 và actual keyboard4 case đã chạy lại trên final production3527; Docker Linux image mới build + official image smoke/nonroot/read-only/health/failure containment PASS. Test-only refinement thêm xác minh có thể cuộn tới actual review input khi keyboard viewport320px:4 engines PASS; lint/typecheck chạy sau refinement PASS. Không app source/config/dependency thay đổi sau validation cuối.

Screenshots đã capture và OPEN: before desktop/mobile popup/hero/strip; after widths320/360/390/768/1024/1280/1366/1440/1920,390×320/640×450; error/pending/accepted/rejected/uncertain1366×768; keyboard simulation trước/sau internal scroll; final `current-desktop.png`, `current-mobile.png`, `current-terms.png`, `current-privacy.png`. Paths ở `screenshots/`, `keyboard-final/`, `redesign-final/`; last four match final runtime fingerprint trong `evidence/current-visual.json`. X/CTA/required controls không bị mất; actual keyboard/notch/AT vẫn chưa được chứng minh trên hardware. Review toàn bộ source/test diff và untracked files, không chỉ ảnh render.

| File task-owned | Thay đổi và scope |
|---|---|
| `src/features/feedback/invitation.ts` | Timer owner/deadline/safe-open/fresh GET/cleanup; không POST hoặc draft/reward logic |
| `src/features/feedback/FeedbackCampaign.tsx` | StrictMode-safe invitation init,4 required stars/layout,3 steps; validation/DTO giữ nguyên |
| `src/features/feedback/FeedbackExperience.tsx` | Hero CTA/short copy/form heading; existing outcomes và operation controls giữ nguyên |
| `src/features/feedback/FeedbackPopup.tsx` | Landscape hero/form/legal links/native keyboard tab order; focus/scroll lifecycle giữ |
| `src/features/feedback/feedback-popup.module.css` | Landscape38/62, mobile/safe viewport/actions/motion/reduced-motion; scoped |
| `src/features/feedback/policy.ts`, `validation.ts` | Rút gọn policy và review display label; không sửa rules/normalizer |
| `src/components/sections/HeroSection.tsx`, `src/app/page.tsx` | Move popup CTA vào hero, bỏ strip; sections/navigation giữ |
| `src/app/(legal)/privacy-policy/page.tsx`, `terms-of-service/page.tsx` | Append grounded program sections/anchors; original legal text protected by hashes |
| `src/components/legal/LegalDocument.tsx`, `legal-document.module.css` | Updated version/date và native legal fragment scrolling; no homepage global change |
| `tests/feedback/invitation.unit.spec.ts`, `legal.unit.spec.ts`, `redesign.spec.ts`, `playwright.feedback-redesign.config.ts` | State/ownership/legal preservation/four-engine actual home/timer/layout/accessibility tests |
| `tests/feedback/adapter.unit.spec.ts`, `integration.spec.ts`, `popup.spec.ts` | Correct new accessible copy/opening/tab order selectors, retain contract assertions |
| `tests/feedback/https-proxy.mjs` | Test-only strict owned loopback frontend port selection |
| `tests/feedback/report-browser-coverage.mjs`, `coverage-helper-regression.mjs` | Existing tooling map-format/directive correction + independent synthetic regression, never production fixture |
| `tests/browser/brand-legal.spec.ts`, `fixtures.ts` | Legal version expectations and real visitor close handler for live-enabled regression; no production config interception |
| Hai reports frontend | Preserve Phase1/2/recovery, append new planning/results/source/release gate |

27 files allowlisted;0 new dependencies; package/lock/env/.github/deploy/auth/Admin APIs untouched. New temporary fixtures/credentials/TLS/log/screenshots/preview route/source maps/operational reports ở H ngoài Git, production image private-file exclusions PASS. Full source fingerprint được tạo ngoài docs sau finalize để tránh hash self-reference; release SHA/digest/run URL bổ sung vào external receipt sau official deployment, không commit receipt gây redeploy vòng lặp.

Final command receipts: `unit-coverage-final` (c8 + playwright.feedback-unit); `real-contract-resumed` (playwright.feedback-contract); `public-final`, `redesign-final`+targeted legal/keyboard/rejected, `admin-chromium-resumed`/`admin-remaining-resumed`, `legacy-final`+shell regression; `lint-release-final`, `typecheck-release-final`, `final-production-build-resumed`, `production-audit`, `admin-catalogue`, `admin-unit`, `deployment-regression`, `linux-image-build-native-legal`, `linux-image-smoke-native-legal`. Exact argv/cwd/TEMP/cache/duration/exit và source match trong `evidence/*.json`/`logs/*.log`. Prod audit0; full dev audit5 pre-existing HIGH informational, no lock/dependency modification. Build/image route table không có preview route hoặc source maps.

Pre-publication operator onlyread xác nhận current5d55/immutableaa240c91, healthy green3101, previousc114 healthy blue3100, no lock holder, no pending controller activation; frontend config/controller/proxy/Compose hashes khớp recovery. Chưa deploy candidate mới tại receipt này. Production campaign GET enabledtrue/revision2 unchanged from task-start;0 production DB tests/SQL/Prisma/login/business writes;0 backend source/reward/config changes. Trusted workflow phải PASS build/security/browser/private digest publication rồi deploy exact MAIN; failure/approval gate không được bypass. Final live revision/slot/rollback readiness sẽ kiểm độc lập sau deploy.

## Popup Marketing Redesign + 120s Timer — correction sau acceptance rollback

Checkpoint local: **LOCAL_READY**, chưa xác nhận publication/deployment của replacement tại thời điểm commit báo cáo này. Giữ lịch sử candidate `83365785dbd274bdaca159c2f42979331918d42a` và [run 38116098274](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38116098274): build SUCCESS, exact-digest activation SUCCESS, public acceptance FAIL (29 PASS / 2 FAIL / 25 baseline SKIP), trusted conditional rollback SUCCESS về `5d55b1b842aef09bfe729c69ace8e79d74863bb2`. Digest bị rollback `sha256:213efe509c6f7e4d39d8fc895569e5580b6d945a1c556344ce3a9d27a320c375`. Không blind rerun hoặc SSH deploy; phải dùng SHA/image mới qua pipeline nguyên trạng.

Nguyên nhân CI được xác nhận bằng trace/ảnh đã OPEN: handler đóng invitation bằng pointer click, rồi test dùng `focus()` và đòi `:focus-visible`. Diagnostic local xác nhận brand focused=true nhưng focusVisible=false sau pointer; keyboard Tab chuyển focusVisible=true. Hai lỗi CSS được tái hiện với API Nest local campaign enabled trước fix. Không phải Docker timeout hoặc lỗi kích hoạt image. Test sửa để dùng keyboard modality thật, giữ color/outline assertions và thêm focus assertion. Đợi public GET đã xác thực + native initial dialog rồi đóng, tránh race React showModal/native inert tree; handler có ownership rõ khi test đang kiểm tra dialog.

Lượt enabled phát hiện thêm hai lỗi runtime: SPA legal→`/#features` bị khóa body trước khi fragment scroll hoàn tất; Tab đến muộn trên dialog đã close chạy trap với controls đã hidden. Regression fail-before được giữ. `invitation.ts` chuẩn bị fragment trước lần mở đầu (getElementById/decode an toàn), không scroll lại ở chu kỳ sau; `FeedbackPopup.tsx` bỏ qua key trên dialog đã đóng. Cả X/Escape/deadline120000/fresh GET/draft/result/idempotency/other-dialog safety giữ nguyên. Regression mới kiểm anchor rồi chủ động scroll về đầu; chu kỳ sau giữ vị trí đó, không có POST.

Extended WebKit kiểm tra phát hiện footer links có sẵn bị bỏ qua bởi native Tab (source footer trước fix giống baseline). Bổ sung tabIndex=0 cho bốn link liên hệ/pháp lý, không đổi text/layout/API. Before trace và diagnostic chứng minh BODY/FAQ button thay vì link; after WebKit desktop/mobile PASS với Tab thật. Mobile menu test mở bằng Enter để xác minh keyboard opener/focus return đúng, không giả định WebKit pointer click focus button. Firefox navigation-cancel favicon NS_BINDING_ABORTED được phân biệt với resource failure; vẫn kiểm fresh favicon HTTP200, giữ mọi runtime/asset/color assertions. Enabled fixture mới chỉ trong test loopback, không có production mock endpoint/flag/bundle; website smoke vẫn lấy GET thật.

997 distinct scoped PASS / 0 software FAIL còn mở / 25 baseline SKIP: UNIT242, CONTRACT14, PUBLIC156, REDESIGN208, ADMIN192, LEGACY124, IMAGE31, ADMIN_UNIT8, DEPLOY22. Các case real contract/admin không đổi source được giữ bằng chứng cũ; public thực chạy lại bốn engines có owned Nest/PostgreSQL integration. Không cộng reruns/coverage/supporting brand probes vào997. Device/AT/native mobile keyboard/notch/OS zoom vẫn BLOCKED theo giới hạn thiết bị, không gán PASS. New timer/modal logic100% line/statement/function/branch; ten public feature JS/TS100% với fresh data của hai file sửa và chỉ tái dùng coverage khi normalized source hash không đổi. Combined instrumented scope88.78% line/statement,88.27% function,97.10% branch; unchanged Admin use-query/shared auth/client gaps giữ nguyên. CSS wrapper không được gọi là CSS coverage, Footer/static legal SSR không có business branch đo runtime JS.

Full logs/failures giữ trên H. Lượt production build copy thiếu updated test interface bị typecheck từ chối, snapshot được sửa đủ rồi build PASS; local image guard từ chối content revision nhập thiếu40 ký tự, build lại dùng fingerprint[:40] PASS, không nới guard. Khi rebuild final footer, các case đang dùng local3527 bị connection failure; raw logs giữ, đúng9REDESIGN/3PUBLIC cases chạy lại PASS. Một regression-test snapshot chụp focus trước cleanup hoàn tất được sửa bằng đợi focus rời closed dialog, vẫn giữ assertion focus/scroll không thay đổi và runtime errors0; late-Tab4 engines PASS. Không xóa/skip test hoặc nới assertion. Final lint/typecheck/build/image/no-store/guest/failure containment PASS; production audit0, dependency/license/lock không đổi; pinned secret scan0 findings. No .github/deploy/auth/Admin API/backend/production config changes.

Runtime fingerprint cuối `d65ca9f581e1cb3cf01c14c9779fb89c34721c5b3cd49181a173836c4767142c`. Source/full diff hash và exact release SHA sẽ được xác nhận từ external publication receipt, không gán artifact833 cho code mới. Evidence root `H:/HomeMind/tasks/feedback-popup-fe-redesign/20261011-main-5d55b1b/`: `replacement-test-ledger.json`, `replacement-coverage.json`, `source-fingerprint-current.json`, `replacement-preflight-state.json`, `focus-modality-finding.json`, `first-attempt-ci-state-current.json` trong evidence; failure traces ở ci-first-browser-failure/enabled-before/fragment-before/closed-tab-before; screenshots/replacement-desktop/mobile/terms/privacy đã capture và OPEN. Backend233e715 và campaign production enabledtrue/revision2 được giữ baseline;0 production SQL/DB test/feedback/account/reward write/login/toggle. Operational final receipt ngoài Git, không tạo commit success chỉ để redeploy.


## Popup Marketing Redesign + 120s Timer — receipt VPS đã xác minh

**FE_POPUP_REDESIGN_RELEASE_COMPLETE_VERIFIED**. Exact MAIN/live `3509f46cad51706c8c02b83520a27c86873703af`; immutable image `sha256:23be317ea2052a8389d048bff6ce4884720b178930e601ff3902391e2d6cf331`. [Trusted workflow](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38120448111) attempt1/run21: build SUCCESS, deploy SUCCESS, required public/browser acceptance SUCCESS. Candidate833 historical FAIL và automatic rollback giữ nguyên evidence; replacement3509 có gate và image mới, không blind retry/SSH deploy. New source fingerprint `bf28f9664b0c877a22f42de0f2f7d9a3e3cd11ecf63ed9222fabe5d830ce5939`; runtime `d65ca9f581e1cb3cf01c14c9779fb89c34721c5b3cd49181a173836c4767142c`.

Local997 distinct PASS,0 software FAIL còn mở,25 baseline SKIP; physical device/AT/native keyboard/notch/OSzoom BLOCKED và không báo PASS. Unit242, real owned local Nest/PostgreSQL contract14, PUBLIC156, REDESIGN208, ADMIN192, LEGACY124, image31, Admin unit8, deploy22. Timer/modal logic và ten public instrumented files100% line/statement/function/branch; combined88.78% line/statement,88.27% function,97.10% branch. Reused evidence chỉ khi source hash không đổi; static legal/Footer SSR/CSS không được gọi là runtime JS coverage. Supporting reruns không cộng trùng997.

Independent read-only HTTPS health/revision, homepage5widths, actual initial invitation+virtual119999/120000+fresh GET, legal anchors, guest login/dashboard/management guard, assets và runtime PASS; live screenshots capture và OPEN. Currentblue:3100 healthy/restart0/exact SHA+digest; previousgreen:3101 giữ5d55 healthy, archives/proxy rollback snapshot và guard match sẵn; lock không có holder/pending activation. Campaign vẫn enabledtrue/revision2, đã bật trước task bởi admin;0 task toggle. BE233e715 không đổi.0 production database tests/SQL/Prisma/business writes/feedback/account/reward/login. Không sửa .github/deploy/auth/Admin API/production config hoặc shared services.

Operational receipts ngoài Git: `H:/HomeMind/tasks/feedback-popup-fe-redesign/20261011-main-5d55b1b/HOMEMIND_FEEDBACK_POPUP_REDESIGN_RELEASE_REPORT_VI.md` và `HOMEMIND_LANDINGPAGE_VPS_DEPLOY_RECOVERY_REPORT_VI.md`; `evidence/release-complete-state.json`, `production-readonly-redesign-state.json`, replacement-test-ledger/coverage/source manifests/owner-task-sync; operator frontend-after/slot-readiness-after; CI logs/run snapshots; screenshots/live-*. Owner D HEAD/branch/index và unrelated baseline files được giữ; chỉ28 task paths sync để review. Receipt này chỉ ở working tree D và H evidence, không tạo MAIN commit gây deploy thêm. Các dòng NOT_RUN pre-publication/FAIL lịch sử ở trên là lịch sử, không phải trạng thái replacement cuối.


## Popup Alignment & Brand Logo — kế hoạch trước sửa

Baseline MAIN/live3509f46cad51706c8c02b83520a27c86873703af, verified bằng GitHub API/publicGET trước sửa; campaignenabledtrue/revision2 giữ nguyên. Task UI-only: FeedbackPopup.tsx/CSS, tests/config và hai reports; không sửa FeedbackExperience/session/invitation/adapter/DTO/auth/Admin/BE/DB/.github/deploy/package/lock/assets. Logo source chính thức src/app/logo.png, Brand.tsx dùng Next/Image36px trong Navbar. Chỉ thay badge gift16; giữ giftMark/Gift40/stroke1.5/CSS/animation hiện có nguyên vẹn. Suspected alignment cause: content grid tính trên available width sau stable scrollbar gutter, actions margin38% tính trên dialog width; phải đo fail-before rồi sửa shared grid geometry, không pixel offset.

Evidence task-owned `H:/HomeMind/tasks/feedback-popup-fe-alignment/20261011-main-3509f46`; TEMP/TMP/npm/PW cache/build/log/screenshots H. Owner D HEADc114/branchmain/index0ca preserved; all217 owner file hashes và diffs snapshot. Worktree fix/popup-alignment-logo trên H, normal publication chỉ khi local + workflow gates PASS; CI tựdeploy, không SSHdeploy. 0 productionPOST/login/DB/SQL/toggle.


## Popup Alignment & Brand Logo — kết quả local trước publication

Checkpoint **LOCAL_READY**. Baseline FE MAIN/live `3509f46cad51706c8c02b83520a27c86873703af`; branch worktree H `fix/popup-alignment-logo`. BE released contract `233e71562dda9ce3f7776e2fa52f23db3d96be21` giữ nguyên; GET `/v1/public/feedback-popup`, POST `/v1/public/feedback-popup/submissions` và Admin adapter/DTO/auth không sửa. Không cần BE changes: hai lỗi nằm ở DOM/CSS và brand mark. Campaign thực đã enabled=true/revision2 trước task (admin bên ngoài), public GET no-store xác nhận trước sửa và preflight; task không toggle. Owner D HEAD c1142d9/branch main/index 0ca6b5c8 và 217 file baseline được kiểm hash, không stage/commit owner checkout.

**Root cause:** form nằm trong grid `.content` bị trừ stable scrollbar gutter 15px; footer ngoài grid dùng `margin-left:38%` theo full dialog width. Hai containing widths khác nhau, nên lệch trái 38%×15=5.703125 CSSpx và phải15 CSSpx ở Chromium1440×900. Nếu ảnh scale1.5 thì lệch trái tương ứng8.55px ảnh, phù hợp khoảng9px user nêu; DPR/zoom của ảnh user không được xác minh. Gutter tồn tại cả khi chưa có overflow. Fail-before hai regression được lưu, không dùng offset âm/translate/left để che lỗi. Sửa bằng chuyển footer vào cùng content grid, dùng cùng column2/row2; mint span hai rows, footer sticky bottom trong vùng cuộn chung; mobile column1. Gutter white liên tục, CTA luôn tiếp cận được, phần cuối nội dung cuộn lên khỏi footer.

| Chromium viewport/state | Form left/right trước | Footer left/right trước | Form & footer left/right sau | Delta left/right sau |
|---|---|---|---|---|
|1440×900 initial|594.53125 /1204|600.234375 /1219|594.53125 /1204|0 /0|
|1366×768 initial|557.53125 /1167|563.234375 /1182|557.53125 /1167|0 /0|
|900×900 initial|340.375 /868|346.078125 /883|340.375 /868|0 /0|

Before32 measurements=16 viewports×normal/forced-scroll; after192 measurements=16 viewports×initial/4 errors/long scroll×4 engines. All after left/right deltas0 CSSpx, desktop mint/white boundary0. Widths320,360,390,768,899,900,1024,1280,1366,1440,1920; thêm390×320,768×390,1366×768,390×420 keyboard-like,683×384 reflow200%. Long error text/textarea800px là layout fixture được ghi rõ, không được trình bày như DTO/response thật. Viewport keyboard/reflow/DPR2 là emulation, không physical devices.

**Logo:** reuse official transparent PNG `src/app/logo.png`, same asset used by `src/components/ui/Brand.tsx`/Navbar; Next/Image20×20, sizes20px, object-fit contain, reserved box, decorative alt empty vì text HomeMind Premium cạnh đó. Không wordmark/emoji/icon giả. Test so raw HTTP PNG SHA256 với file source và Navbar URL; delayed image/DPR2 giữ geometry trước/sau bằng nhau. Small Gift16 mất khỏi badge; large `<Gift size={40} strokeWidth={1.5}/>` và toàn bộ `.giftMark` CSS/media/72px tile/white/shadow/motion byte-identical baseline. Navbar/Footer/favicon/brand asset bytes không đổi. Source invariants xác nhận chỉ2 runtime files thay đổi,136 runtime/brand/API/timer/auth/Admin/release files không đổi.

**Files:** FeedbackPopup.tsx chỉ image import/badge/footer placement; feedback-popup.module.css shared grid/sticky/mobile/badge box; alignment.spec.ts thêm16 geometry+2 branding tests mỗi engine; redesign.spec.ts cập nhật XSS assertion để chỉ cho đúng một trusted brand image (no script/onerror/extra image; textarea/storage/URL/noPOST assertions giữ nguyên); playwright.feedback-redesign.config.ts thêm alignment testMatch; hai coverage helpers chỉ cho phép output task-owned H mới; hai reports append history.10 allowlisted files,0 dependencies/config/assets/business changes.

File test thứ10 `tests/feedback/admin-integration.spec.ts` sửa duy nhất frontend test mapper chuyển6 routing headers và thêm RSC content-type regression; Admin API mapper/auth/assertions không thay đổi. File này không được đưa vào production image.

**Final local verification:**1073 unique automated PASS,0 unresolved FAIL,25 existing baseline SKIP trong production-image smoke,0 mandatory automated BLOCKED/NOT_RUN. Breakdown: unit/component242; real Nest/PostgreSQL contract14; public156; redesign/alignment280; Admin196; legacy fixture124; auth unit8; deployment22; production-image/browser31. Targeted duplicate reruns và coverage supporting extra case không cộng count. Admin kiểm cả4 engines, session/guest/SYSTEM_ADMIN/auth/CSRF/local toggle/filter/list/detail/lifecycle/mobile; không login production. Timer119999/120000, Escape/manual/draft/pending/unknown result, disabled/error config, HTTP errors/idempotency/repeated submissions/one reward, no automatic POST đều có regression. Local API/PG frozen233e với labels/loopback/manifest guard trước mọi SQL; không production DB/SQL/Prisma/business writes.

**Lỗi và recovery trong test:** giữ original logs: expected fail-before alignment/logo; old PRIVACY assertion zero images không còn đúng với requested official image, thay bằng strict trusted-image/XSS test,4 engines PASS. Next16 generated asset token dùng alphabet base64url thay vì giả định hex; assertion chấp nhận đúng token syntax +exact Navbar match/raw PNG hash, không nới XSS.8 real cases ban đầu fail do Origin3541 không được local contract cho phép; dùng approved3527, không đổi backend/CORS. Gián đoạn Docker khiến ephemeral PostgreSQL tmpfs mất schema, rồi stale local role passwords làm migration P1000; khôi phục đúng task-owned synthetic fixture qua setup và recreate2 ephemeral services, không restart daemon/global prune/shared BE. Local runtime port mới lấy từ Docker binding đã verify; real8+contract14 PASS sau recovery. Interrupted runner227PASS/3old-assert FAIL/50unfinished được nối với49 Edge +4 privacy retests bằng ledger280; không báo runner bị kill đã hoàn tất. Initial type typo/empty test selection/shellcheck wrong path/compiled scanner non-Git copy đều giữ evidence và corrected commands PASS; không xóa/skip/nới nghiệp vụ assertion.

**Admin fixture regression:** full run190PASS/2FirefoxFAIL tại afterEach console guard; UI assertions đạt nhưng browser nhận HTML cho RSC prefetch. Mapper có sẵn từ3509 không chuyển Next FLIGHT_HEADERS; direct loopback GET cùng URL no-header=text/html, RSC1=text/x-component; regression fail-beforeFirefox tái hiện xác định được. Fix chỉ forward6 routing metadata headers đến website loopback, không Cookie/Authorization; API mapper và production Admin source untouched. Không suppress console, giữ assertion zero errors; full196 cases4engines chạy lại sau fix. Trùng tên biến headers gây một syntax-error khi chạy harness; đổi requestHeaders và kiểm lint/typecheck lại, log giữ nguyên.

**Coverage:** changed FeedbackPopup.tsx line/statement98/98=100%,function4/4=100%,branch37/37=100%,0 uncovered branch. Fresh32 Chromium source-map artifacts +current unit c8; không old/synthetic coverage reuse hoặc exclusion. CSS painted coverage N/A, thay bằng192 geometry states/media/scroll/visual checks. Broader raw instrumented app scope line/statement1217/1465=83.07%,function90/119=75.63%,branch660/695=94.96%; gaps thuộc unchanged Admin/query/auth hooks và browser-map functions, chi tiết HTML/coverage-final.json, không claim toàn app100%. Public unit logic7 files100% separately. Prior3509 broader baseline scope khác (88.78/88.27/97.10), không dùng như so sánh regression ngang scope. No threshold change.

**Mandatory gates:** final lint/typecheck/build PASS (lint5 unchanged img warnings); prod audit0 vulnerability PASS, pinned Gitleaks source/history0 findings, compiled private scan PASS, shell syntax/shellcheck/deploy22 PASS; exact runtime DockerNode24.21.0 image smoke31PASS/25 baselineSKIP. Full dev audit5 pre-existing HIGH informational (unchanged lock/dependencies), không giả PASS. No new license/dependency; build JS+309bytes/CSS+240bytes, no preview route/source maps/private artifacts in production. Precommit local image label dùng baseline3509 cho dirty-source rehearsal; exact new commit image sẽ được build/smoke trước push và officialCI. No CI/deploy source/security gate changes.

**Evidence:** task root `H:/HomeMind/tasks/feedback-popup-fe-alignment/20261011-main-3509f46/`; before-all-geometry-state.json; browser-redesign/results/**/geometry.json, initial/errors/long-scroll PNG và seam crops; consolidated-browser-ledger.json; local-test-ledger-final.json; coverage-final HTML/summary/mapping; command receipts evidence/*.json +logs/*.log. Đã OPEN before1440 seam/mobile và after representative tất cả16 viewport shapes; Chromium/Firefox/WebKit/Edge, initial/errors/long-scroll/seam. Không claim đã mở mọi PNG; screenshot capture không tự tính là visual inspection. Physical iOS/Android keyboard/notch/retina hardware/screen reader N/A chưa có thiết bị; four headless engines trên Windows, actual Edge channel. TEMP/TMP/npm cache/build/screenshots H; Docker storage setting H được xác minh.

Runtime fingerprint `cc34f800d68172f9f295ce85b394ec47f1bd1d64e2dbfe2315fdcedd78765e7b` gắn production build/runtime tests; full source/diff fingerprint tạo ngoài Git sau final docs để tránh self-reference. MAIN publication +requiredCI/deploy/liveSHA/digest/slots còn NOT_RUN tại commit-time report này; external release receipt sẽ cập nhật kết quả thật, không thêm MAIN commit gây deploy lần2.0 backend/campaign/prod data mutation.
