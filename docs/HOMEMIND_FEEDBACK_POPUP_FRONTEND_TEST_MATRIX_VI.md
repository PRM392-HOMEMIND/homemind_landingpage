# Ma trận kiểm thử frontend popup HomeMind

## Checkpoint hiện tại — Popup Marketing Redesign + 120s Timer

**LOCAL_READY** — local gates PASS:978 case distinct PASS / 0 FAIL còn mở / 25 baseline SKIP. DEVICE-REDESIGN-01 BLOCKED do không có thiết bị/AT thật, không tính PASS. UI landscape, auto-open homepage + reopen120s, API thật và legal đã kiểm; source runtime fingerprint `35b0f246ca1be01881ea9bf1c42a2be3b670e5bb5782ef965a47e4f6738d592f`. GitHub MAIN/live vẫn5d55 tại preflight; publication/CI/VPS cho candidate mới chưa chạy. Campaign đang enabled=true/revision2 do admin bật từ trước; task không toggle. Các Phase1/2/recovery bên dưới là lịch sử; kết quả release mới sẽ ghi ngoài Git tại evidence root để không tạo thêm deployment.

### Historical Phase 2 checkpoint (trước recovery)

## Checkpoint hiện tại — Phase 2PUBLIC/ADMIN: **757 PASS**, 25 SKIP baseline không tính PASS; execution ledger và evidence ở phần Phase 2 cuối file. Những BLOCKED contract ở phần Phase 1 là lịch sử, đã có contract BE233 và kết quả Phase 2 thay thế. DEVICE-01 vẫn BLOCKED do thiếu thiết bị/AT thật; RELEASE-01 BLOCKED: MAIN/build PASS nhưng trusted VPS deploy FAIL; receipt cuối ghi lỗi và website vẫn ở SHA cũ. Không gán mock hoặc coverage thành bằng chứng API production/cấp quà production.

## Baseline và phạm vi



Baseline: **PHASE_1_RELEASE_REPORT_ONLY**. Lập **trước khi viết source popup**, ngày 10/10/2026 (Asia/Saigon). FE HEAD `c1142d937d8dc962d4b090d36457f012e1be9824`, nhánh `main`. Nguồn sản phẩm: toàn bộ `docs/HOMEMIND_CODEX_FEEDBACK_POPUP_RELEASE_REPORT_VI.md`, đặc biệt mục 15–18. Đây là evidence release BE cũ, không phải evidence task FE mới.



API report được release report chỉ định không có trong FE; người dùng xác nhận chỉ có release report. Tìm trong `docs`, `markdowns`, `src/lib`, types, env example và OpenAPI FE: chỉ có contract admin, không có public popup contract. Không đọc/sửa repo BE, không gọi production, không đợi deploy BE mới.



Theo correction của user, Phase 1 gồm **khung modal, state controller và adapter boundary UI độc lập**. Các giá trị abstract `enabled/disabled/submitted` là giao diện presentation, không phải wire response/DTO. Form fixture không phải form contract. Những case API-dependent trong bảng có kết quả BLOCKED với reason **PENDING_BE_API_CONTRACT**. Không suy ra field, reward/account status, trigger hay API từ admin contract. Trang preview chỉ được tạo trong bản sao kiểm thử H:, không có route preview trong app bàn giao. Homepage có boundary fail-closed không render CTA hoặc form. Không coi mock/preview là API integration.



Evidence root: `H:/HomeMind/tasks/feedback-popup-fe/20261010-baseline-c1142d9/`. Bảng ban đầu NOT_RUN/BLOCKED được cập nhật bằng evidence cuối: **50 rows = 32 PASS / 0 FAIL / 0 SKIP / 18 BLOCKED / 0 NOT_RUN / 0 N/A**. N/A/SKIP không tính PASS. Case tổng hợp chỉ PASS theo thao tác/phạm vi mô tả; tỷ lệ coverage không thay thế case. BLOCKED gồm 17 case contract/form/API (FE-02-05 còn có giới hạn input thiết bị) và FE-07-03 thiếu thiết bị thật. Không kết luận ALL PASS toàn bộ yêu cầu.



Ký hiệu evidence trong từng row (đường dẫn tương đối evidence root):



| Ký hiệu | Evidence thật |

|---|---|

| U | `logs/post-review-unit.log`: 22 PASS; `tests/feedback/session.unit.spec.ts`, `tests/feedback/scroll-lock.unit.spec.ts`; `coverage-unit-final/` |

| B | `post-review-browser.json`, `logs/post-review-browser.log`, `post-review-browser-results/`: 120 PASS, 0 FAIL/SKIP, 30 case × 4 engine |

| S | `viewport-supplement.json`, `logs/viewport-supplement.log`, `viewport-supplement-results/`: partial viewport test 4 PASS, app build/source không đổi |

| R | `logs/post-review-regression.log`, `post-review-regression-html/`, `post-review-regression-results/`: 31 PASS / 25 SKIP baseline (24 mobile responsive lặp + 1 landscape desktop-only) |

| T | `validation-exit-codes.json`, `logs/post-review-{lint,typecheck,build}.log`: 0/0/0; `logs/post-review-production-fixture-gate.log`: 404; supplement lint/typecheck 0/0 |

| V | `screenshots/verified-*`, `visual-review-final.json`: đã mở đủ width/state, gồm pending/submitted/error/keyboard-like/low viewport; current regression homepage/legal images cũng đã mở |

| C | `coverage-popup-final/{summary.json,index.html,coverage-final.json,mapping-evidence.json}`, `logs/coverage-popup-complete.log`: raw 100% line/statement/function, 99,44% V8 branch; giữ generated CSS block chưa hit |



Tổng automated cuối: 22 unit + 124 fixture browser + 31 regression = **177 PASS / 0 FAIL / 25 SKIP**. Các FAIL trước fix giữ trong logs/report riêng, không cộng vào pass count. Real public API/config/form/BE uniqueness **chưa được xác minh**; fixture operations không phải HTTP. Browser engine/tool limitations, source/runtime fingerprint và nguyên nhân từng defect ở implementation report.



## Ma trận



| ID | Requirement | Trạng thái đầu | Input / thao tác | Expected UI / request | Loại test | Test file | Kết quả | Evidence / lý do |

|---|---|---|---|---|---|---|---|---|

| FE-01-01 | Config enabled / disabled | Chưa biết DTO | Public config true / false | Chỉ mời và submit khi được config xác nhận | Contract + E2E | Chưa thể viết contract test | BLOCKED | PENDING_BE_API_CONTRACT — Thiếu endpoint, schema, enabled state công khai |

| FE-01-02 | Loading / error / unknown / malformed | Chưa có public config client | Loading, 5xx, thiếu enabled, sai kiểu | Fail closed; không tự enabled | Contract + E2E | Chưa thể viết contract test | BLOCKED | PENDING_BE_API_CONTRACT — Không đoán endpoint hoặc field config |

| FE-01-03 | Config stale / tắt giữa mở và gửi | Form được mở từ config | Config đổi trước submit | Không POST khi campaign không cho phép | Contract + E2E | Chưa thể viết contract test | BLOCKED | PENDING_BE_API_CONTRACT — Thiếu TTL/refresh semantics và mã lỗi |

| FE-01-04 | Chủ động mở lại; không tự mở | Preview đóng | Mở / Escape / mở lại; chờ; reload | Không auto popup; nút chủ động vẫn dùng được | Component/browser | tests/feedback/popup.spec.ts | PASS | B: backdrop/manual reopen + pending/new-send; no auto timer; fixture only |

| FE-02-01 | Required / optional fields | DTO không có | Empty, whitespace, null, omitted từng field | Payload/validation khớp server | Unit + contract | Chưa thể viết validation test | BLOCKED | PENDING_BE_API_CONTRACT — Không biết danh sách field hay empty/null semantics |

| FE-02-02 | Boundaries | Giới hạn chưa xác minh | min−1/min/max/max+1 từng field | Không rule FE tự thêm | Unit + browser | Chưa thể viết validation test | BLOCKED | PENDING_BE_API_CONTRACT — Không có constraints server |

| FE-02-03 | Email canonicalization đúng auth | Chưa có public auth contract | Plus/dot, Unicode composed/decomposed, spaces, case | Không canonicalize khác auth | Unit + contract | Chưa thể viết validation test | BLOCKED | PENDING_BE_API_CONTRACT — Release mục 4 có cảnh báo NFC email, không có DTO công khai |

| FE-02-04 | Draft khi đóng | Preview input không phải DTO | Tiếng Việt, Unicode composed/decomposed, ký tự đặc biệt; điền input; đóng/mở | Giữ nguyên input trong cùng mount, không storage | Component/browser | tests/feedback/popup.spec.ts | PASS | B: Unicode/HTML draft close/reopen and 360×360 long draft; U: unchanged synthetic draft. Not real paste/autofill |

| FE-02-05 | Paste / IME / autofill form thực | Form contract chưa có | Paste trường DTO, IME đang composition và autofill mobile | Không chặn input hợp lệ | Form E2E + thiết bị thật | Chưa thể viết form test | BLOCKED | PENDING_BE_API_CONTRACT; thiếu form; công cụ không có bàn phím/IME thiết bị thật |

| FE-03-01 | Endpoint / method / payload / headers | API report vắng mặt | Gửi một lượt | Đúng baseline, không field nhạy cảm thừa | Contract + real integration | Chưa có HTTP adapter/contract | BLOCKED | PENDING_BE_API_CONTRACT — Không đoán endpoint; admin client không áp dụng public |

| FE-03-02 | Success optional / reward status | Chưa biết response | Success có/không optional; không reward status | Chỉ xác nhận gửi khi schema hợp lệ; không suy quà | Contract + E2E | Chưa có HTTP adapter/contract | BLOCKED | PENDING_BE_API_CONTRACT — Không có response schema |

| FE-03-03 | Unknown enum / malformed response | Chưa biết enum/schema | Enum lạ, sai schema | Không dựng success giả | Contract + E2E | Chưa có HTTP adapter/contract | BLOCKED | PENDING_BE_API_CONTRACT — Không có enum/schema baseline |

| FE-03-04 | Chính sách một lần / copy | Popup preview mở | Đọc title, policy, privacy | Đúng nguyên văn chính sách; không hứa email/code/quota/activation | Browser + review | tests/feedback/popup.spec.ts | PASS | B: exact rewardPolicy, privacy popup, no unsupported promise; V: verified images |

| FE-03-05 | Nhận / dùng quà và entitlement | Luồng chưa xác minh | Có/chưa có account, paid/manual, pending/resume | Giải thích đúng khi/ở đâu nhận, bắt đầu/kết thúc | Review + contract | Không có tài liệu đủ căn cứ | BLOCKED | PENDING_BE_API_CONTRACT — Release mô tả sửa BE, không xác nhận luồng public/account |

| FE-04-01 | Field errors / business errors | Error contract không có | Mã thực, 400/401/403/409 | Mapping đúng docs; giữ draft | Contract + E2E | Chưa có HTTP adapter/contract | BLOCKED | PENDING_BE_API_CONTRACT — Không gán business meaning tự sáng tác |

| FE-04-02 | Offline / timeout / 429 / 5xx / non-JSON | API chưa xác minh | Mất response, retry thủ công | Kết quả không chắc được diễn đạt thật, không auto retry POST | Contract + E2E | Chưa có HTTP adapter/contract | BLOCKED | PENDING_BE_API_CONTRACT — Cần endpoint/schema/error/timeout baseline |

| FE-05-01 | Double-click / Enter lặp / lượt mới | Chưa có submit | Gửi đồng thời rồi gửi lại có chủ đích | Một request đang chạy; cho lượt mới; không khóa quà FE | Component + contract | Chưa có form/adapter | BLOCKED | PENDING_BE_API_CONTRACT — Không tạo POST mock rồi coi là integration |

| FE-05-02 | Đóng/mở khi pending | Preview mô phỏng pending | Đóng bằng nút/Escape, mở lại, hoàn tất mô phỏng khi đóng | Không reset child; UI giữ pending/kết quả do parent sở hữu | Component/browser | tests/feedback/popup.spec.ts | PASS | B: pending/checking close/reopen and closed completion; U: operation lifetime |

| FE-05-03 | Stale / out-of-order / navigation | Chưa có request identity | Response cũ sau lượt mới/unmount/route | Không sửa draft mới, không false success | Component + contract | Chưa có HTTP adapter/contract | BLOCKED | PENDING_BE_API_CONTRACT — Chưa biết idempotency và response semantics |

| FE-05-04 | Nhiều tab | Hai preview tab độc lập | Mở/đóng/điền khác nhau | State từng tab độc lập; không local uniqueness / storage | Browser | tests/feedback/popup.spec.ts | PASS | B: two-tab synthetic draft isolation; storage/cookie empty, no client reward uniqueness |

| FE-05-05 | Unmount cleanup | Modal đang mở | Unmount fixture và chuyển route; reload riêng ở case mở/đóng | Khôi phục overflow; trả focus khi opener còn trong DOM; cleanup listener | Component/browser | tests/feedback/popup.spec.ts | PASS | B: ten cycles/unmount/navigation and pending unmount; U: dispose late resolve/reject |

| FE-06-01 | Accessible name / initial focus | Opener được focus | Enter để mở | Dialog được đặt tên, focus heading; nền inert | Keyboard/browser | tests/feedback/popup.spec.ts | PASS | B: accessible name/description, keyboard Enter, initial heading focus, native inert background |

| FE-06-02 | Focus trap / return | Modal mở | Tab / Shift+Tab nhiều vòng; đóng | Focus ở modal; trả opener khi đóng | Keyboard/browser | tests/feedback/popup.spec.ts | PASS | B: Tab/Shift+Tab, pointer return after config changes, no-actions shell; pre-fix failures retained |

| FE-06-03 | Escape / backdrop | Modal mở có draft | Click backdrop / Escape | Backdrop không đóng; Escape đóng và giữ draft trong mount | Browser | tests/feedback/popup.spec.ts | PASS | B: backdrop holds modal and draft, Escape closes, explicit reopen retains input |

| FE-06-04 | Form labels / errors / announcements | Không có DTO/error contract | Invalid từng field | Label/error association và announcement đúng | Component + axe/manual | Chưa có form | BLOCKED | PENDING_BE_API_CONTRACT — Không suy field hay validation |

| FE-06-05 | Scroll lock / restore / repeated | Trang đã cuộn, inline overflow có sẵn | Wheel nền; mở/đóng 10 vòng | Nền đứng yên; restore giá trị cũ; nội dung cuộn | Browser | tests/feedback/popup.spec.ts | PASS | B: ten cycles, wheel, exact prior overflow/scroll, unmount; U: nested/idempotent lock |

| FE-06-06 | Contrast / zoom 200% / reduced motion | Modal mở | Đo contrast, viewport tương đương 200%; giảm motion | Text/control rõ; không animation popup; không tràn | Browser + visual | tests/feedback/popup.spec.ts | PASS | B: measured AA palette/focus, reduced motion, 640×450 reflow; V: opened image. Native zoom not verified |

| FE-07-01 | 360/390/768/1280/1440 | Preview đóng | Mở ở từng width | Không tràn ngang; desktop gọn; close/CTA trong layout cuộn | Browser + mở screenshot | tests/feedback/popup.spec.ts | PASS | B + V: all five required widths, initial/scrolled screenshots opened |

| FE-07-02 | Viewport thấp / landscape / long content | Preview mở | 390×320, 768×390; nội dung/error dài giả lập | Header close/footer giữ chỗ; body cuộn được | Browser + visual | tests/feedback/popup.spec.ts | PASS | B + V: 390×320, 768×390, 360×360 long draft/uncertain alert; 10KB raw error not rendered |

| FE-07-03 | Mobile keyboard / safe area thực | Không có thiết bị thật | Mở keyboard, rotate, notch | Close/CTA vẫn tiếp cận được | Thiết bị thật | Không có | BLOCKED | Chỉ có thể mô phỏng viewport thấp và CSS env fallback |

| FE-08-01 | Browser runtime | Fixture chạy local | Chromium/Firefox/WebKit/Edge nếu có | Modal/focus/scroll không runtime error | Browser | playwright.feedback.config.ts | PASS | B: 30 cases per engine; S: viewport fallback on all four. Versions/limits in engine-inventory.json |

| FE-08-02 | Production build / route / reload / hydration | Homepage baseline | Lint, typecheck, build, smoke route trực tiếp/reload | Không regression mới; preview không nằm trong production routes | Toolchain + browser | tests/browser/*.spec.ts | PASS | T + R + B: production build, direct/reload/hydration, fixture route 404; no runtime errors |

| FE-08-03 | Listener / network repeated | Preview và home reload | Mở/đóng 10 vòng; quan sát request/error | Không API/account/admin request do popup, không leak | Browser | tests/feedback/popup.spec.ts | PASS | B + review: ten cycles, viewport listener cleanup, no API/account/admin requests; U: subscribers/timers/abort |

| FE-09-01 | XSS / PII / storage | Preview mở | Chuỗi HTML vào child fixture; đóng/mở; inspect URL/storage | Text escaped, không URL/log/storage/analytics chứa draft | Browser + source review | tests/feedback/popup.spec.ts | PASS | B + review: HTML escaped, malicious raw error not rendered, URL/storage/cookie no synthetic draft |

| FE-09-02 | Secret / origin / CSRF | Diff popup độc lập | Review import/env/endpoints | Không admin secret/client, không đổi bảo vệ | Source review | Báo cáo + diff | PASS | Review + baseline hashes: no HTTP adapter/secret/admin import or origin/CSRF changes |

| FE-10-01 | Homepage / header / hero / footer / simulator / FAQ | Homepage hiện tại | Smoke suite hiện có | Hoạt động như baseline, không layout/global CSS regression | Regression E2E | tests/browser/*.spec.ts | PASS | R: homepage/header/hero/anchors/simulator/FAQ/assets/footer; V: current build 390/1440 images opened |

| FE-10-02 | Mobile menu và legal | Navbar/legal hiện tại | Keyboard menu, anchors, privacy/terms direct/reload | Navigation hoạt động, không overlay/scroll leak | Regression E2E | tests/browser/brand-legal.spec.ts | PASS | R + B: desktop/mobile keyboard menu, short landscape, legal direct/reload/privacy new tab |

| FE-10-03 | Modal admin hiện có | Source admin baseline | Review dependencies/CSS scope | Component/admin styles/client không đổi | Source review | Báo cáo + diff | PASS | Review + baseline hashes: admin/modal/client/styles unchanged; no authenticated admin browser test claimed |

| API-REAL-01 | API thật local/test baseline | Không có API report/fixture được chỉ định | Config + submit trên test độc lập | Contract thật đã xác minh, không production write | Real integration | Không có | BLOCKED | PENDING_BE_API_CONTRACT — Không endpoint/DTO hay local/test public service được cung cấp |

| COV-01 | Line/statement/function/branch coverage | Repo chưa có coverage engine/threshold | Kiểm kê toolchain; giữ threshold nếu có | Báo metric thực và uncovered branches, không dùng SKIP thành PASS | Tooling + branch audit | Báo cáo | PASS | C: V8/c8 scoped metrics, 99.44% raw branch; generated CSS block retained; SSR/static gate not instrumented |



## Quy tắc evidence



PASS trình bày không nâng các case API/form BLOCKED thành PASS. Các trạng thái pending/kết quả trong preview chỉ là state fixture, không cấp quà, không tạo account, không gọi API. Chụp **và mở** ảnh các width/state quan trọng trước khi chốt kết quả visual. Giữ log thất bại và ghi fix/regression nếu phát hiện lỗi mới. Fingerprint của source đã test và Git/index preservation được ghi trong implementation report sau validation cuối.



## Phase 1 — abstract UI boundary / fixture, không phải API contract



Các requirement FE-01 đến FE-05 đã có trong ma trận trước source; sau correction user, phần UI của chúng được thực thi bằng fixture. Bảng dưới **không thay** các case BLOCKED về endpoint/DTO.



| ID | Requirement | Trạng thái đầu | Input / thao tác | Expected UI / operation fixture | Loại test | Test file | Kết quả | Evidence / lý do |

|---|---|---|---|---|---|---|---|---|

| P1-01 | Production gate | Không adapter | Home direct/reload | Không invitation/form/API; pending contract | Unit + browser | tests/feedback/session.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B + T: no adapter => fail closed; no invitation/form/API; production fixture route 404 |

| P1-02 | Config states | Abstract loading | Enabled/disabled/null/missing/wrong type/failure/timeout/out-of-order | Fail closed; stale read không re-enable; manual recovery | Unit + browser | tests/feedback/session.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B: enabled/disabled/missing/null/wrong type/error/timeout/stale reads, manual recovery |

| P1-03 | Fresh check before operation | Enabled và đã mở | Config tắt/malformed/failure/timeout lúc submit | Không gọi submit fixture; giữ draft | Unit + browser | tests/feedback/session.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B: disabled/malformed/error/timeout precheck prevents abstract submit; draft retained |

| P1-04 | Loading/submitted/rejected/uncertain | Idle, input synthetic | Pending, rejection, lost result, malformed receipt | Neutral copy; no gift status; CTA kết thúc loading; giữ input | Unit + browser | tests/feedback/session.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B + V: checking/sending/submitted/rejected/uncertain and invalid receipt; neutral copy/retained draft |

| P1-05 | Multiple operation / race | Một operation đang chạy | Double-click/Enter, close/reopen, explicit new, timeout + late response | Single-flight, không auto retry; identity thuộc future adapter; lượt mới cho phép | Unit + browser | tests/feedback/session.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B: single-flight, Enter/double click, explicit next, late receipt/timeout, no auto POST/reward lock |

| P1-06 | Dispose / stale async | Config/submission pending | Dispose, late resolve/reject; background refresh giữa gửi | Abort owned work; không publish stale state; không stuck | Unit + browser | tests/feedback/session.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B: dispose reads/precheck/sending, resolve/reject stale, background refresh blocked, pending unmount |

| P1-07 | Scroll ownership | Inline styles/scroll có sẵn | Nested lock, repeat release, 10 vòng, unmount | Restore đúng, release idempotent | Unit + browser | tests/feedback/scroll-lock.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B: exact lock restore/nested/idempotent release; ten cycles/unmount |

| P1-08 | Risk combination mobile/error/draft | 360×360, fixture network | Draft Unicode/HTML dài, submit, unknown outcome, scroll và Escape | Giữ nguyên draft; escape HTML; close/lượt mới trong viewport; trả focus | Browser + mở screenshot | tests/feedback/popup.spec.ts | PASS | B + V: 360×360 long Unicode/HTML draft + uncertain result, controls/escape/focus/retention |

| P1-09 | Pending unmount + late completion | Fixture đang gửi | Dispose/unmount, receipt đến muộn, chuyển legal route | Restore page; không popup/success cũ; không thêm operation | Unit + browser | tests/feedback/session.unit.spec.ts; tests/feedback/popup.spec.ts | PASS | U + B: pending unmount, late fixture receipt ignored, no extra operation, legal navigation |

| P1-10 | Defensive viewport fallback | visualViewport partial/polyfill synthetic | Object có EventTarget nhưng thiếu height/offsetTop; resize/đóng | Dùng innerHeight/offset 0; không NaN/tràn; close/CTA/focus restore hoạt động | Browser | tests/feedback/popup.spec.ts | PASS | S: 4/4 PASS, partial EventTarget viewport missing height/offsetTop; native API claim excluded |



## PENDING BACKEND API DOCUMENTATION — PHASE 2



BLOCKED / `PENDING_BE_API_CONTRACT`: endpoint/method/base URL; public config DTO/enabled/loading/cache-refresh/trigger; submit fields/required/optional/null/omitted/limits/normalization; success/error envelope/enums/field errors; auth/credentials/CORS/origin/CSRF; idempotency/retry identity; account matching/nomination/activation/paid/manual/wait/resume; reward/account status và nơi xem ngày bắt đầu/kết thúc; local/test service baseline để real integration. Chỉ đồng bộ Phase 2 khi user chỉ thị mới.



## Phase 2 — PUBLIC và ADMIN

User đã chỉ thị đồng bộ BE MAIN `233e71562dda9ce3f7776e2fa52f23db3d96be21` và mở rộng Admin. Đọc đủ bốn tài liệu Git object đúng SHA; hashes tại `H:/HomeMind/tasks/feedback-popup-fe/20261010-phase2-233e715/contracts/baseline.json`. Phase 1 phía trên là lịch sử, không phải evidence API mới. Case PUBLIC đã lập trước source Phase 2; kế hoạch ADMIN bổ sung theo scope update. Kết quả dưới đây sẽ được cập nhật từ validation candidate cuối.

| ID | Requirement / trạng thái đầu | Input / thao tác | Expected UI / request | Loại test / file | Kết quả | Evidence |
|---|---|---|---|---|---|---|
| PUBLIC-01 | Config loading/unknown | true/false/missing/malformed/stale/error/timeout, tắt giữa form và submit | Strict contract; fail closed; GET no-store/omit; manual CTA; fresh precheck | adapter/session unit; integration.spec.ts | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| PUBLIC-02 | 4 required fields | omitted/null/non-string/empty/space, extra keys | Field errors, chỉ gửi 4 string, không thêm consent/OTP | validation/adapter unit; real-contract.spec.ts | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| PUBLIC-03 | Boundaries/auth normalization | min/max ±1, raw caps, NFC/emoji/control/surrogates, email plus/dot/Unicode, VN/foreign phone | Khớp BE validators; không NFC/alias email; không truncate UTF16 | validation.unit.spec.ts; real-contract.spec.ts | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| PUBLIC-04 | Success/errors | 202, sai schema/status/nonJSON; 400/403/409/413/415/429/503/500; network/20s timeout | Neutral receipt; safe local errors; uncertain honest; cooldown; no auto POST retry | adapter unit; integration.spec.ts | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| PUBLIC-05 | Identity/races | double click/Enter, close/reopen pending, manual retry/new, unmount/late/out of order | Single flight; same retry key/body; new operation new key; draft retained | session unit; integration.spec.ts | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| PUBLIC-06 | Real Nest + PG isolated | public config/OPTIONS/submit/replay/conflict/disabled/signup then repeat | Real released image, 2 accepted submissions/1 issued reward; no public status leak | real-contract.spec.ts; live browser case | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| PUBLIC-07 | A11y/responsive | keyboard/trap/restore/Escape/backdrop/scroll, five widths/320-height/zoom/reduced motion/paste/composition | Named modal/labels/linked errors; controls reachable; no overflow | integration.spec.ts; popup.spec.ts; opened screenshots | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| PUBLIC-08 | Privacy/regression | raw HTML, malformed config/error, URL/storage/console/network, direct/reload/legal/nav | Escaped UI; no PII persistence; no extra account/admin request; fixture route absent | browser + review + secret checks | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| ADMIN-01 | Guest/expired/forbidden | deep links, customer bearer, no cookie, logout/expiry/401/403 while request pending | Backend denial; clear client/session/PII; no-store; login/dashboard reused | admin unit; admin-real-contract.spec.ts; admin-integration.spec.ts | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| ADMIN-02 | Config and toggle | disabled/enabled; cancel/confirm/double click; CSRF absent/wrong; revision conflict; timeout/error | Authenticated PATCH exact fields; confirm; no auto retry/enable; refresh canonical config | admin unit; real contract + browser | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| ADMIN-03 | Filters/pagination/list/detail | 0/1/100/101 limit; q 120/121 UTF16; all states/duplicates; UTC window boundaries; cursor/filter changes; empty/404/malformed | Allowlisted filters; page counts only; reset cursor; safe errors and text | admin unit; real contract + browser | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| ADMIN-04 | Lifecycle/counts | linked/unlinked, repeated, null/missing lifecycle, unknown enum, segments, paid/manual scheduling | API-derived dates and account-scope counts; NOT_TRACKED usage; no invented global totals/PAUSED | admin unit; real contract + browser | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| ADMIN-05 | UI/a11y/security/regression | five widths/low-height, nav/login/logout, confirmation focus/Escape, XSS/filter URL/PII/cache | Existing shell intact; scrollable table; protected detail; no secret persistence | admin-integration.spec.ts; existing admin suites; screenshots | PASS | local-verification-receipt.json; execution ledger bên dưới; source fingerprint trong implementation report |
| RELEASE-01 | Candidate verification/release | lint/type/build/unit/contract/E2E/coverage/security; selective commit/main gates/deploy/read-only smoke | Local release blockers PASS then exact SHA gates; no VPS DB or production POST/toggle | reports/logs/CI URLs | BLOCKED | Trusted deploy run38073244434 FAIL; `release-blocked-receipt.json`; receipt ở cuối file |
| DEVICE-01 | Hardware-only behavior | OS IME/mobile keyboard/notch/AT/native browser zoom/minimum versions | Không giả PASS thiết bị thật; mô phỏng engine và viewport ghi riêng | Giới hạn công cụ | BLOCKED | Không có thiết bị/AT thật trong phiên này; giữ giới hạn Phase 1 |


### Phase 2 — kết quả LOCAL cuối / trước publication

**757 PASS, 0 FAIL mới chưa sửa, 25 SKIP có sẵn; SKIP không tính PASS.** Không cộng lần chạy coverage/repeat/repair vào số case độc lập. ADMIN 192 = 48 case × 4 engine; PUBLIC 156 = 39 × 4. Hardware DEVICE-01 vẫn BLOCKED (không có thiết bị/AT thật). RELEASE-01 chưa PASS tại checkpoint này: MAIN/CI/deploy/read-only smoke phải có receipt thực sau publication.

Audit gồm dev dependencies: **FAIL có sẵn / informational**, 5 high từ braces → ESLint chain, y hệt lockfile baseline c114; không phải regression. Production audit `--omit=dev` đúng gate CI: PASS, 0 vulnerabilities. Endpoint audit của npm mirror trả 404 không phải PASS; chạy lại official registry. Không downgrade ESLint/Next hoặc force-fix. Default POST rate 5/min của BE không stress lại trong fixture nâng limit local 1000; 429 frontend được xác minh unit/browser fixture, nguồn/default và regression BE là evidence khác. Không gán default-rate real test là PASS.

N/A theo contract hiện hành: tổng toàn campaign / tổng unique reward toàn hệ thống; feature usage thật; enum PAUSED riêng; public account/reward lookup. Không bịa dữ liệu để biến N/A thành PASS.

Execution ledger sau ghi ID, requirement/case, setup ban đầu, thao tác/input/expected theo tên case, loại, source, kết quả và JSON evidence. Tên case giữ nguyên tên đã chạy; các giá trị/boundary/step/assertion cụ thể nằm trong source tương ứng và kế thừa normative expected PUBLIC-01…08 / ADMIN-01…05 ở trên. Một hàng browser gom engine để tránh lặp; số case chạy vẫn đếm riêng từng engine. `real` / `two local browser tabs` dùng Nest+PostgreSQL owned local; các case `fixture`/fault injection không phải response production.


### Execution ledger — UNIT

| ID | Requirement / input / thao tác / expected case | Trạng thái ban đầu | Loại / test file | Kết quả theo engine | Evidence dưới root H: |
|---|---|---|---|---|---|
| P2-UNIT-001 | disabled and additive optional config metadata accepted; read errors denied | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-002 | documented rejection 400 INVALID_IDEMPOTENCY_KEY | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-003 | documented rejection 400 INVALID_JSON | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-004 | documented rejection 400 VALIDATION_ERROR | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-005 | documented rejection 403 FORBIDDEN | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-006 | documented rejection 403 ORIGIN_NOT_ALLOWED | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-007 | documented rejection 409 FEEDBACK_POPUP_DISABLED | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-008 | documented rejection 409 IDEMPOTENCY_CONFLICT | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-009 | documented rejection 413 PAYLOAD_TOO_LARGE | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-010 | documented rejection 415 UNSUPPORTED_MEDIA_TYPE | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-011 | documented rejection 429 RATE_LIMITED | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-012 | documented rejection 503 FEEDBACK_POPUP_BUSY | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-013 | documented rejection 503 FEEDBACK_POPUP_UNAVAILABLE | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-014 | exact endpoint/method/headers/cache/credentials and unchanged 4-field DTO | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-015 | field codes, Retry-After and invalid request avoid HTTP; non-JSON/network abort remain uncertain | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-016 | invalid origin http://remote.invalid | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-017 | invalid origin https://api.invalid#x | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-018 | invalid origin https://api.invalid/path | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-019 | invalid origin https://api.invalid?q=x | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-020 | invalid origin https://u:p@api.invalid | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-021 | invalid origin not-url | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-022 | malformed config fails closed [] | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-023 | malformed config fails closed null | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-024 | malformed config fails closed true | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-025 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":"true","revision":1,"updatedAt":"2026-10-10T00:00:00.000Z","offer":{"name":"Premium","planId":"personal","durationDays":30,"durationSeconds":2592000},"fields":{"fullName":{"required":true,"minLength":1,"maxLength":120},"phoneNumber":{"required":true,"minLength":1,"maxLength":40},"email":{"required":true,"minLength":3,"maxLength":254},"review":{"required":true,"minLength":1,"maxLength":5000}},"idempotency":{"header":"Idempotency-Key","format":"uuid","required":false}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-026 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":true,"revision":0,"updatedAt":"2026-10-10T00:00:00.000Z","offer":{"name":"Premium","planId":"personal","durationDays":30,"durationSeconds":2592000},"fields":{"fullName":{"required":true,"minLength":1,"maxLength":120},"phoneNumber":{"required":true,"minLength":1,"maxLength":40},"email":{"required":true,"minLength":3,"maxLength":254},"review":{"required":true,"minLength":1,"maxLength":5000}},"idempotency":{"header":"Idempotency-Key","format":"uuid","required":false}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-027 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":true,"revision":1,"updatedAt":"2026-02-30T00:00:00.000Z","offer":{"name":"Premium","planId":"personal","durationDays":30,"durationSeconds":2592000},"fields":{"fullName":{"required":true,"minLength":1,"maxLength":120},"phoneNumber":{"required":true,"minLength":1,"maxLength":40},"email":{"required":true,"minLength":3,"maxLength":254},"review":{"required":true,"minLength":1,"maxLength":5000}},"idempotency":{"header":"Idempotency-Key","format":"uuid","required":false}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-028 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":true,"revision":1,"updatedAt":"2026-10-10T00:00:00.000Z","offer":{"name":"Premium","planId":"personal","durationDays":30,"durationSeconds":2592000},"fields":{"fullName":{"required":true,"minLength":1,"maxLength":120},"phoneNumber":{"required":true,"minLength":1,"maxLength":40},"email":{"required":true,"minLength":3,"maxLength":254},"review":{"required":true,"minLength":1,"maxLength":5000}},"idempotency":{}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-029 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":true,"revision":1,"updatedAt":"2026-10-10T00:00:00.000Z","offer":{"name":"Premium","planId":"personal","durationDays":30,"durationSeconds":2592000},"fields":{"fullName":{"required":true,"minLength":1,"maxLength":120},"phoneNumber":{"required":true,"minLength":1,"maxLength":40},"email":{"required":true,"minLength":3,"maxLength":255},"review":{"required":true,"minLength":1,"maxLength":5000}},"idempotency":{"header":"Idempotency-Key","format":"uuid","required":false}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-030 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":true,"revision":1,"updatedAt":"2026-10-10T00:00:00.000Z","offer":{"name":"Premium","planId":"personal","durationDays":30,"durationSeconds":2592000},"fields":{},"idempotency":{"header":"Idempotency-Key","format":"uuid","required":false}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-031 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":true,"revision":1,"updatedAt":"2026-10-10T00:00:00.000Z","offer":{},"fields":{"fullName":{"required":true,"minLength":1,"maxLength":120},"phoneNumber":{"required":true,"minLength":1,"maxLength":40},"email":{"required":true,"minLength":3,"maxLength":254},"review":{"required":true,"minLength":1,"maxLength":5000}},"idempotency":{"header":"Idempotency-Key","format":"uuid","required":false}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-032 | malformed config fails closed {"campaignId":"homepage-feedback-premium-30d","enabled":true,"revision":1.5,"updatedAt":"2026-10-10T00:00:00.000Z","offer":{"name":"Premium","planId":"personal","durationDays":30,"durationSeconds":2592000},"fields":{"fullName":{"required":true,"minLength":1,"maxLength":120},"phoneNumber":{"required":true,"minLength":1,"maxLength":40},"email":{"required":true,"minLength":3,"maxLength":254},"review":{"required":true,"minLength":1,"maxLength":5000}},"idempotency":{"header":"Idempotency-Key","format":"uuid","required":false}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-033 | malformed config fails closed {} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-034 | prototype property names are unknown field codes, never rendered errors | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-035 | uncertain response 200 {"status":"ACCEPTED","submissionId":"11111111-1111-4111-8111-111111111111","acceptedAt":"2026-10-10T00:00:00.000Z","message":"Thông báo trung tính của fixture, không phải cấp quà."} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-036 | uncertain response 202 null | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-037 | uncertain response 202 {"status":"ACCEPTED","submissionId":"11111111-1111-4111-8111-111111111111","acceptedAt":"2026-10-10T00:00:00.000Z","message":null} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-038 | uncertain response 202 {"status":"ACCEPTED","submissionId":"11111111-1111-4111-8111-111111111111","acceptedAt":"x","message":"Thông báo trung tính của fixture, không phải cấp quà."} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-039 | uncertain response 202 {"status":"ACCEPTED","submissionId":"x","acceptedAt":"2026-10-10T00:00:00.000Z","message":"Thông báo trung tính của fixture, không phải cấp quà."} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-040 | uncertain response 202 {"status":"ACTIVE","submissionId":"11111111-1111-4111-8111-111111111111","acceptedAt":"2026-10-10T00:00:00.000Z","message":"Thông báo trung tính của fixture, không phải cấp quà."} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-041 | uncertain response 202 {} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-042 | uncertain response 409 {"error":{"code":"UNRECOGNIZED","message":"<script>secret</script>"}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-043 | uncertain response 500 {"error":{"code":"INTERNAL_ERROR"}} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-044 | valid 202 with optional metadata 4 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-045 | valid 202 with optional metadata 5 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-046 | valid individual raw caps can exceed documented total body cap; no POST | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `adapter.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-047 | CSRF write boundary denies checking before requesting a token or invoking a write | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin-csrf.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-048 | CSRF write boundary denies error before requesting a token or invoking a write | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin-csrf.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-049 | CSRF write boundary denies guest before requesting a token or invoking a write | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin-csrf.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-050 | aborted write boundary cannot request CSRF or invoke a write | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin-csrf.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-051 | each intentional write obtains a fresh validated CSRF token under the existing lock | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin-csrf.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-052 | session phase changing during CSRF read prevents a stale write even if transport completes | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin-csrf.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-053 | session revision changing during CSRF read prevents a stale write even if transport completes | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin-csrf.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-054 | admin 429 shared cooldown forbids immediate PATCH | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-055 | admin HTTP uses existing credentials/cache and exact CSRF PATCH; no extra body | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-056 | admin config schema additions and missing/invalid declared fields | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-057 | admin detail schema additions and missing/invalid declared fields | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-058 | admin extension cannot send cookies/CSRF to another origin or unsupported write path | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-059 | admin failure 400 safe, authorization invalidation and PATCH never retried | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-060 | admin failure 401 safe, authorization invalidation and PATCH never retried | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-061 | admin failure 403 safe, authorization invalidation and PATCH never retried | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-062 | admin failure 404 safe, authorization invalidation and PATCH never retried | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-063 | admin failure 409 safe, authorization invalidation and PATCH never retried | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-064 | admin failure 500 safe, authorization invalidation and PATCH never retried | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-065 | admin failure 503 safe, authorization invalidation and PATCH never retried | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-066 | admin invalid filter {"benefitState":"PAUSED"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-067 | admin invalid filter {"cursor":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-068 | admin invalid filter {"duplicate":"yes"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-069 | admin invalid filter {"from":"2026-01-01T00:00:00+07:00","to":"2026-01-02T00:00:00Z"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-070 | admin invalid filter {"from":"2026-01-01T00:00:00Z","to":"2027-01-03T00:00:00Z"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-071 | admin invalid filter {"from":"2026-01-01T00:00:00Z"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-072 | admin invalid filter {"from":"2026-01-02T00:00:00Z","to":"2026-01-01T00:00:00Z"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-073 | admin invalid filter {"from":"2026-02-30T00:00:00Z","to":"2026-03-02T00:00:00Z"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-074 | admin invalid filter {"limit":"0"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-075 | admin invalid filter {"limit":"01"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-076 | admin invalid filter {"limit":"1.1"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-077 | admin invalid filter {"limit":"101"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-078 | admin invalid filter {"q":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-079 | admin invalid filter {"sort":"wrong"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-080 | admin invalid filter {"unknown":"x"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-081 | admin invalid filter {"userId":"550e8400-e29b-71d4-a716-446655440000"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-082 | admin invalid filter {"userId":"invalid"} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-083 | admin item schema additions and missing/invalid declared fields | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-084 | admin list schema additions and missing/invalid declared fields | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-085 | admin network, abort, session cleared and stale completion | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-086 | admin optional lifecycle, unknown state, accurate page distinct count | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-087 | admin read 503 retry only once; malformed/wrong version/nonJSON/status fails | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-088 | admin rejects non-string filters and normalized invalid UTC hour | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-089 | admin supported filters and UTF16 q boundaries | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-090 | malformed/nonJSON 401 and 403 still invalidate session | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-091 | prototype property names are unknown lifecycle states | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `admin.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-092 | scroll lock restores exact prior styles/position, nested ownership and idempotent release | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `scroll-lock.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-093 | already-resolved config promises still respect a newer read or disposal before publication | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-094 | background config refresh during a pending operation does not strand the operation | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-095 | config abstraction safely handles "ENABLED" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-096 | config abstraction safely handles "disabled" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-097 | config abstraction safely handles "enabled" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-098 | config abstraction safely handles null | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-099 | config abstraction safely handles true | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-100 | config abstraction safely handles undefined | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-101 | config abstraction safely handles {"enabled":true} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-102 | config failures and timeouts recover only through an intentional read | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-103 | disabled/malformed/error/timeout on pre-submit recheck sends no draft | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-104 | dispose aborts owned work, prevents updates and unsubscribes observers | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-105 | dispose during pre-submit config resolve/reject sends no operation and publishes no result | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-106 | dispose during submission ignores a late receipt or failure | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-107 | dispose settles owned work promptly even if an adapter ignores abort | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-108 | double click and Enter are single-flight; close/reopen preserves pending; intentional new send works | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-109 | known rejection differs from unknown failure and invalid success values | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-110 | late and out-of-order config reads cannot re-enable a disabled campaign | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-111 | late rejected config reads are ignored after a fresh result | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-112 | rate cooldown survives new operation and finishes without render-time clock | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-113 | retry denied during operation, unavailable precheck preserves uncertain identity, disabled rejection | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-114 | same-operation manual retry preserves payload, new operation remains explicit | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-115 | timeout keeps the outcome uncertain; old response cannot change a later operation | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-116 | unconfigured production boundary fails closed and performs no operation | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `session.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-117 | email raw cap 1000 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-118 | email raw cap 1001 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-119 | email raw cap 999 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-120 | email rejects required/type " \t \n " | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-121 | email rejects required/type "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-122 | email rejects required/type 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-123 | email rejects required/type [] | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-124 | email rejects required/type false | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-125 | email rejects required/type null | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-126 | email rejects required/type undefined | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-127 | email rejects required/type {} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-128 | email rejects unsafe code point "\u0000" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-129 | email rejects unsafe code point "\ud800" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-130 | email rejects unsafe code point "\udc00" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-131 | email rejects unsafe code point "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-132 | fullName NFC decomposed text and whitespace | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-133 | fullName code point boundary 0 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-134 | fullName code point boundary 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-135 | fullName code point boundary 119 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-136 | fullName code point boundary 120 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-137 | fullName code point boundary 121 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-138 | fullName raw cap 1000 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-139 | fullName raw cap 1001 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-140 | fullName raw cap 999 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-141 | fullName rejects required/type " \t \n " | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-142 | fullName rejects required/type "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-143 | fullName rejects required/type 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-144 | fullName rejects required/type [] | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-145 | fullName rejects required/type false | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-146 | fullName rejects required/type null | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-147 | fullName rejects required/type undefined | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-148 | fullName rejects required/type {} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-149 | fullName rejects unsafe code point "\u0000" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-150 | fullName rejects unsafe code point "\ud800" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-151 | fullName rejects unsafe code point "\udc00" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-152 | fullName rejects unsafe code point "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-153 | invalid auth email 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-154 | invalid auth email 11 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-155 | invalid auth email 19 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-156 | invalid auth email 2 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-157 | invalid auth email 20 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-158 | invalid auth email 255 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-159 | phone length boundary 0 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-160 | phone length boundary 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-161 | phone length boundary 39 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-162 | phone length boundary 40 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-163 | phone length boundary 41 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-164 | phoneNumber raw cap 199 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-165 | phoneNumber raw cap 200 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-166 | phoneNumber raw cap 201 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-167 | phoneNumber rejects required/type " \t \n " | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-168 | phoneNumber rejects required/type "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-169 | phoneNumber rejects required/type 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-170 | phoneNumber rejects required/type [] | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-171 | phoneNumber rejects required/type false | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-172 | phoneNumber rejects required/type null | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-173 | phoneNumber rejects required/type undefined | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-174 | phoneNumber rejects required/type {} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-175 | phoneNumber rejects unsafe code point "\u0000" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-176 | phoneNumber rejects unsafe code point "\ud800" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-177 | phoneNumber rejects unsafe code point "\udc00" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-178 | phoneNumber rejects unsafe code point "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-179 | review NFC decomposed text and whitespace | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-180 | review code point boundary 0 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-181 | review code point boundary 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-182 | review code point boundary 4999 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-183 | review code point boundary 5000 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-184 | review code point boundary 5001 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-185 | review permits tab CR LF and plain HTML; text/name and empty body checks | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-186 | review raw cap 19999 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-187 | review raw cap 20000 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-188 | review raw cap 20001 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-189 | review rejects required/type " \t \n " | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-190 | review rejects required/type "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-191 | review rejects required/type 1 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-192 | review rejects required/type [] | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-193 | review rejects required/type false | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-194 | review rejects required/type null | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-195 | review rejects required/type undefined | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-196 | review rejects required/type {} | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-197 | review rejects unsafe code point "\u0000" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-198 | review rejects unsafe code point "\ud800" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-199 | review rejects unsafe code point "\udc00" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-200 | review rejects unsafe code point "" | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-201 | valid auth email 17 é@example.in | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-202 | valid auth email 18 é@example.i | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-203 | valid auth email 21 a+b.c@exampl | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-204 | valid auth email 253 aaaaaaaaaaaa | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-205 | valid auth email 254 aaaaaaaaaaaa | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-206 | valid auth email 31  An.Test+pop | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-207 | valid phone +1 202 555 0123 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-208 | valid phone +84 912 345 678 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-209 | valid phone 0912345678 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |
| P2-UNIT-210 | valid phone 84912345678 | State/DTO/fetch fixture độc lập; không HTTP thật | UNIT / `validation.unit.spec.ts` | unit: PASS | `unit-last-source.json` |

### Execution ledger — REAL_CONTRACT

| ID | Requirement / input / thao tác / expected case | Trạng thái ban đầu | Loại / test file | Kết quả theo engine | Evidence dưới root H: |
|---|---|---|---|---|---|
| P2-REAL_CONTRACT-001 | real SYSTEM_ADMIN config, CSRF enforcement, revision conflict and audited local toggle | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `admin-real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-002 | real denied anonymous, wrong origin, malformed filters, missing detail and CORS | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `admin-real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-003 | real pagination, Unicode filters and lifecycle one award/account across repeated accepted submissions | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `admin-real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-004 | idempotent replay, conflict, explicit new submission and disabled replay | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-005 | real Unicode NFC boundaries fullName | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-006 | real Unicode NFC boundaries review | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-007 | real config/OPTIONS/no cookies and anonymous adapter submission | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-008 | real delayed signup, repeated feedback, durable single award, neutral public receipt | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-009 | real protocol/origin/unknown fields and error mapping | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-010 | real raw caps/contact validation exactly agrees with FE | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-011 | real required/type/control validation email | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-012 | real required/type/control validation fullName | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-013 | real required/type/control validation phoneNumber | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |
| P2-REAL_CONTRACT-014 | real required/type/control validation review | Owned Nest/PG233; session/contact fixture riêng | REAL_CONTRACT / `real-contract.spec.ts` | unit: PASS | `real-contract-release-candidate.json` |

### Execution ledger — PUBLIC

| ID | Requirement / input / thao tác / expected case | Trạng thái ban đầu | Loại / test file | Kết quả theo engine | Evidence dưới root H: |
|---|---|---|---|---|---|
| P2-PUBLIC-001 | HTTP presentation 400 VALIDATION_ERROR avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-002 | HTTP presentation 403 ORIGIN_NOT_ALLOWED avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-003 | HTTP presentation 409 FEEDBACK_POPUP_DISABLED avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-004 | HTTP presentation 409 IDEMPOTENCY_CONFLICT avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-005 | HTTP presentation 413 PAYLOAD_TOO_LARGE avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-006 | HTTP presentation 415 UNSUPPORTED_MEDIA_TYPE avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-007 | HTTP presentation 429 RATE_LIMITED avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-008 | HTTP presentation 500 INTERNAL_ERROR avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-009 | HTTP presentation 503 FEEDBACK_POPUP_BUSY avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-010 | HTTP presentation 503 FEEDBACK_POPUP_UNAVAILABLE avoids raw/XSS and keeps data | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-011 | accepted neutral result, intentional new operation, exact raw body and privacy | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-012 | actual form composition/paste/autofill events retain Unicode and do not submit IME Enter | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-013 | adapter initialization failure stays closed without a request or fake success | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-014 | form responsive 1280px and low viewport/error/long content | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-015 | form responsive 1440px and low viewport/error/long content | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-016 | form responsive 360px and low viewport/error/long content | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-017 | form responsive 390px and low viewport/error/long content | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-018 | form responsive 768px and low viewport/error/long content | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-019 | fresh config disabled/unavailable before POST and explicit recovery | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-020 | initial config false never invites or auto opens | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-021 | initial config loading never invites or auto opens | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-022 | initial config malformed never invites or auto opens | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-023 | initial config unavailable never invites or auto opens | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-024 | mobile outcome rejected is visible after submitting from the bottom of the form | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-025 | mobile outcome submitted is visible after submitting from the bottom of the form | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-026 | mobile outcome uncertain is visible after submitting from the bottom of the form | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-027 | outcome new-operation CTA stays disabled after disabled campaign precheck until manual recovery | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-028 | outcome new-operation CTA stays disabled after malformed campaign precheck until manual recovery | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-029 | pending double click/Enter close/reopen and late completion use one operation | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-030 | pending navigation aborts owned request; direct reload stays closed and fixture route absent | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-031 | rate-limit retry with failed precheck remains neutral and allows an intentional new operation | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-config-gate-final.json` |
| P2-PUBLIC-032 | real browser HTTP through isolated released Nest/PostgreSQL | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-real-release-candidate.json` |
| P2-PUBLIC-033 | real form labels, local errors, summary keyboard navigation, focus and preserved draft | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-034 | two local browser tabs submit independently; real backend allocates only one reward to owned fixture account | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-real-release-candidate.json` |
| P2-PUBLIC-035 | uncertain malformed retry same key/body, new operation new key | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-036 | uncertain network retry same key/body, new operation new key | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-037 | uncertain non-json retry same key/body, new operation new key | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-038 | uncertain timeout retry same key/body, new operation new key | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |
| P2-PUBLIC-039 | unknown prototype-named field error codes cannot crash or inject UI | Homepage/phiên mới; config kiểm soát; real chỉ owned fixture | PUBLIC / `integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `public-final-source-mock.json` |

### Execution ledger — ADMIN

| ID | Requirement / input / thao tác / expected case | Trạng thái ban đầu | Loại / test file | Kết quả theo engine | Evidence dưới root H: |
|---|---|---|---|---|---|
| P2-ADMIN-001 | CSRF request abort on navigation cannot send stale PATCH | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-transport-regression-final.json` |
| P2-ADMIN-002 | admin fixture PATCH conflict, no retry and stale result | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-conflict-final.json` |
| P2-ADMIN-003 | admin fixture PATCH network, no retry and stale result | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-004 | admin fixture PATCH pending-navigation, no retry and stale result | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-transport-regression-final.json` |
| P2-ADMIN-005 | admin fixture PATCH unknown-conflict, no retry and stale result | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-conflict-final.json` |
| P2-ADMIN-006 | admin fixture empty honest presentation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-007 | admin fixture list error 400, recovery/privacy | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-008 | admin fixture list error 401, recovery/privacy | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-final-auth-detail.json` |
| P2-ADMIN-009 | admin fixture list error 403, recovery/privacy | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-010 | admin fixture list error 404, recovery/privacy | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-011 | admin fixture list error 429, recovery/privacy | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-012 | admin fixture list error 500, recovery/privacy | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-013 | admin fixture list error 503, recovery/privacy | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-014 | admin fixture malformed honest presentation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-015 | admin fixture missing-lifecycle honest presentation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-016 | admin fixture non-json honest presentation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-017 | admin fixture unknown-state honest presentation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-018 | admin responsive 1280px list/detail/confirmation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-019 | admin responsive 1440px list/detail/confirmation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-020 | admin responsive 360px list/detail/confirmation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-021 | admin responsive 390px list/detail/confirmation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-022 | admin responsive 768px list/detail/confirmation | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-023 | campaign PATCH documented rejection 400 has no retry and no false success | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-024 | campaign PATCH documented rejection 401 has no retry and no false success | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-transport-regression-final.json` |
| P2-ADMIN-025 | campaign PATCH documented rejection 403 has no retry and no false success | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-026 | campaign PATCH documented rejection 429 has no retry and no false success | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-027 | every admin filter control sends the documented query and resets pagination | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-028 | existing dashboard sections remain readable through the owned released backend | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-029 | fixture PATCH timeout has uncertain result and no automatic retry | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-030 | fixture detail lifecycle ACTIVE, API dates/segments/repeat source | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-031 | fixture detail lifecycle BLOCKED, API dates/segments/repeat source | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-032 | fixture detail lifecycle CONFLICT, API dates/segments/repeat source | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-033 | fixture detail lifecycle DUPLICATE, API dates/segments/repeat source | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-034 | fixture detail lifecycle EXPIRED, API dates/segments/repeat source | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-035 | fixture detail lifecycle SCHEDULED, API dates/segments/repeat source | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-036 | fixture detail lifecycle WAITING_ENTITLEMENT, API dates/segments/repeat source | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-037 | fixture detail without lifecycle and config malformed/network/loading stays safe | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-038 | fixture stale list response cannot replace a newer filter result | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-039 | fixtures filter validation rejects invalid input without reads; next/previous/reset cursor | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-040 | fixtures pagination/filter reset, XSS-safe list and lifecycle detail | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-041 | invalid private detail deep link fails safely without a detail API request | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-042 | legacy benefit dates, superseded segments and unsupported usage stay truthful | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-043 | optional lifecycle omitted leaves reward counts unknown and empty segments truthful | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-optional-final.json` |
| P2-ADMIN-044 | prototype-named states and HTML reason codes remain safe admin text | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-all-final.json` |
| P2-ADMIN-045 | real authorized local campaign toggles only after confirmation, cancel/focus and single-flight | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-final-auth-detail.json` |
| P2-ADMIN-046 | real expired/revoked local session clears PII and denies deep link | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-final-auth-detail.json` |
| P2-ADMIN-047 | real guest deep link denial, secure login/navigation and logout clears admin data | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-final-auth-detail.json` |
| P2-ADMIN-048 | real linked account detail and repeated submissions show server dates and one logical reward | Guest/session mới; login thật owned fixture; dữ liệu/error fixture khi chỉ rõ | ADMIN / `admin-integration.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `admin-final-auth-detail.json` |

### Execution ledger — LEGACY_UI

| ID | Requirement / input / thao tác / expected case | Trạng thái ban đầu | Loại / test file | Kết quả theo engine | Evidence dưới root H: |
|---|---|---|---|---|---|
| P2-LEGACY_UI-001 | backdrop retains draft; Unicode input and explicit close/reopen preserve it without auto popup | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-002 | campaign config-error between open and submit stops the operation and preserves data for recovery | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-003 | campaign disabled between open and submit stops the operation and preserves data for recovery | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-004 | campaign malformed-config between open and submit stops the operation and preserves data for recovery | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-005 | confirmed policy and privacy; no unsupported reward or subscription promise | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-006 | defensive fallback for a partial visualViewport object keeps the modal usable | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-007 | disabled production config: direct/reload home makes only public config GET, no invitation/account/submit | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-008 | disabled/loading/malformed/error fixture config cannot invite or submit; manual recovery works | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-009 | keyboard open, named dialog, focus trap in both directions and return | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-010 | malformed-success uses honest local copy, retains data and supports an intentional next operation | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `legacy-outcome-final-source.json` |
| P2-LEGACY_UI-011 | network uses honest local copy, retains data and supports an intentional next operation | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `legacy-outcome-final-source.json` |
| P2-LEGACY_UI-012 | pending close/reopen, repeated Enter/double-click and late completion retain one operation | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `legacy-outcome-final-source.json` |
| P2-LEGACY_UI-013 | pending config recheck is announced, keeps data and can complete while closed | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `legacy-outcome-final-source.json` |
| P2-LEGACY_UI-014 | popup text/control contrast and focus indication meet AA for the implemented palette | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-015 | presentation shell without a form/action slot still supports keyboard and close | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-016 | rejected uses honest local copy, retains data and supports an intentional next operation | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `legacy-outcome-final-source.json` |
| P2-LEGACY_UI-017 | responsive 1280x900: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-018 | responsive 1440x900: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-019 | responsive 360x800: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-020 | responsive 390x320: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-021 | responsive 390x844: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-022 | responsive 640x450: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-023 | responsive 768x390: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-024 | responsive 768x900: close/actions visible, body scroll, no overflow | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-025 | scroll lock restores styles/position after 10 cycles, unmount and navigation without errors | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-026 | small mobile viewport preserves long Unicode draft through an uncertain outcome | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `legacy-outcome-final-source.json` |
| P2-LEGACY_UI-027 | timeout uses honest local copy, retains data and supports an intentional next operation | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `legacy-outcome-final-source.json` |
| P2-LEGACY_UI-028 | two tabs isolate draft and UI state without client reward tracking or PII storage | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-029 | unmount during pending operation restores the page and ignores its late fixture receipt | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-030 | visualViewport fallback supports close/reopen and resize without runtime errors | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |
| P2-LEGACY_UI-031 | visualViewport keyboard-like resize/offset keeps close/actions inside the usable viewport | Preview state fixture mới; không DTO/POST production | LEGACY_UI / `popup.spec.ts` | chromium: PASS; edge: PASS; firefox: PASS; webkit: PASS | `fixture-release-three.json, fixture-release-webkit.json` |

### Execution ledger — HOMEPAGE

| ID | Requirement / input / thao tác / expected case | Trạng thái ban đầu | Loại / test file | Kết quả theo engine | Evidence dưới root H: |
|---|---|---|---|---|---|
| P2-HOMEPAGE-001 | brand colors, secure Facebook link, legal navigation and keyboard menu | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: PASS | `homepage-candidate-final.json` |
| P2-HOMEPAGE-002 | responsive 1024px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-003 | responsive 1024px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-004 | responsive 1024px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-005 | responsive 1280px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-006 | responsive 1280px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-007 | responsive 1280px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-008 | responsive 1440px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-009 | responsive 1440px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-010 | responsive 1440px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-011 | responsive 1920px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-012 | responsive 1920px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-013 | responsive 1920px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-014 | responsive 320px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-015 | responsive 320px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-016 | responsive 320px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-017 | responsive 360px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-018 | responsive 360px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-019 | responsive 360px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-020 | responsive 390px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-021 | responsive 390px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-022 | responsive 390px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-023 | responsive 768px / | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-024 | responsive 768px /privacy-policy | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-025 | responsive 768px /terms-of-service | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-026 | short landscape menu scrolls independently and keeps all navigation usable | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `brand-legal.spec.ts` | desktop: PASS; mobile: SKIP | `homepage-candidate-final.json` |
| P2-HOMEPAGE-027 | colored favicon is the single served browser icon, including a cache-free refresh | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `icon-colors.spec.ts` | desktop: PASS; mobile: PASS | `homepage-candidate-final.json` |
| P2-HOMEPAGE-028 | production landing, navigation, simulator, FAQ and assets | Homepage/legal route mới; config disabled fixture loopback | HOMEPAGE / `landing.spec.ts` | desktop: PASS; mobile: PASS | `homepage-candidate-final.json` |

### Execution ledger — EXISTING_ADMIN_UNIT

| ID | Requirement / input / thao tác / expected case | Trạng thái ban đầu | Loại / test file | Kết quả theo engine | Evidence dưới root H: |
|---|---|---|---|---|---|
| P2-EXISTING_ADMIN_UNIT-001 | 36 declared operations keep a single admin prefix and reject every unknown query | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |
| P2-EXISTING_ADMIN_UNIT-002 | RFC3339 offsets and microseconds match OpenAPI; calendar errors do not | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |
| P2-EXISTING_ADMIN_UNIT-003 | VND precision and chart scaling survive amounts above Number.MAX_SAFE_INTEGER | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |
| P2-EXISTING_ADMIN_UNIT-004 | date-only expiry and explicit timezone boundaries cannot drift | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |
| P2-EXISTING_ADMIN_UNIT-005 | endpoint-specific filters and path/query consistency are enforced | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |
| P2-EXISTING_ADMIN_UNIT-006 | nullability, required properties and additive fields are distinct | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |
| P2-EXISTING_ADMIN_UNIT-007 | password is preserved exactly while email is normalized | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |
| P2-EXISTING_ADMIN_UNIT-008 | strict input validation preserves booleans, integer ranges and UTC windows | Contract/normalization fixture độc lập | EXISTING_ADMIN_UNIT / `contract.spec.ts` | unit: PASS | `existing-admin-unit-final.json` |

## Phase 2 — operational release results

LOCAL: 757 PASS / 0 regression FAIL còn mở / 25 baseline SKIP; không cộng CI/rerun/coverage vào case count. DEVICE-01 vẫn BLOCKED, 4 unsupported capabilities N/A. MAIN đã chứa source test; full release chưa hoàn thành.

| ID | Requirement | Ban đầu / thao tác | Expected | Loại / file | Result | Evidence |
|---|---|---|---|---|---|---|
| RELEASE-PUBLISH-01 | Chỉ publish task files/tested SHA | H: candidate baselinec114, owner D: dirty; stage allowlist52, commit/push thường | MAIN exact tested SHA, owner HEAD/index giữ nguyên | Git/index/hash review | PASS | `5d55b1b842aef09bfe729c69ace8e79d74863bb2`; `publication-input.json`; `logs/push-main.log` |
| CI-BUILD-01 | Mandatory build gates trước deploy | MAIN new SHA, auto workflow | Source/security/controller/image/browser/provenance/publication SUCCESS | Existing `.github/workflows/deploy-landingpage.yml` | PASS | [Build](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434/job/114274817010); `ci-deployment-first-attempt.json` |
| CI-DEPLOY-01 | Trusted landing-only deploy | Build PASS; automatic needs-build | Controller accepts exact digest and public SHA smoke PASS | Existing deploy job/controller | **FAIL — infrastructure** | [Deploy](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434/job/114276132991); `docker operation failed or timed out`, exit1; underlying Docker command UNVERIFIED |
| RELEASE-SMOKE-01 | Candidate VPS website / Admin routes | Deploy FAILED, no retry/bypass | healthz candidateSHA; new routes guest guard; styles/runtime | Read-only website checks | **BLOCKED_NOT_DEPLOYED** | `production-readonly-blocked-checkpoint.json`: healthzc114, new list/detail404; CI public acceptance SKIPPED |
| RELEASE-SAFETY-01 | Không production DB test hoặc tự bật campaign | Trước/sau release only website GET, no SQL/submit/auth/toggle | DB untouched by task; campaign controls not invoked | Command/HTTP scope review | PASS (scope task) | Config GET200/no-store enabledfalse revision1 before/after; no production mutation performed; không giả claim audit toàn hệ thống |

Workflow [19](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38073244434) kết thúc FAILURE; required CI/CD không được báo toàn PASS. Private image digest `sha256:aa240c91300c0f9bd2065379331f1188504ae8d25638e859646aa2b5bd7f369b` đã publication; không có deploy thành công. Conditional QEMU (amd64)/failure artifact/rollback steps N/A hoặc SKIPPED theo workflow, không tính PASS. Operator diagnostic chỉ đọc theo runbook đang chờ; không thay config/guard, restart Docker/VPS hay kiểm tra database. Receipt tài liệu nằm working tree sau commit; source không đổi.


## Recovery VPS — kết quả cuối 11/10/2026

**RELEASE_COMPLETE_VERIFIED**. Historical attempt1FAIL/blocked receipt được giữ; các case applicationlocalPhase2 bên trên không tự trở thành production evidence. Current MAIN/deployedSHA5d55b1b842aef09bfe729c69ace8e79d74863bb2; digestaa240c91…; attempt2 SUCCESS.

| ID | Requirement / trạng thái ban đầu / input | Expected / actual | Loại / test file | Result | Evidence dưới H: recovery-20261011 |
|---|---|---|---|---|---|
| REC-01 | GenericCIerror; MAIN/run/log audit | Candidatecurrent, identifyfailedstage, noobsoleteoverwrite | GitHub/controllerreadonly | PASS | main-before/run-before/runs-pre-retry; logs/first-attempt-failed.log |
| REC-02 | guard07/10 đãbiếnmất; safe missingobjectrepro | dockerinspectexit1/NO_SUCH_OBJECT trướcpull/activation | frontend-readonly-diagnostic.py | PASS (current reproduction; historicalrawstderr không lưu) | HomeMindDeployment/frontend-before.jsonl |
| REC-03 | 151 sourcefiles đãtest; comparemanifest | Unchangedsource/runtime/sourcefingerprint | hash/Git review | PASS | source-verification.json/final source receipt;4adb9ce9…/96b32ee9… |
| REC-04 | Releasefailure/timeout/freshness/digest/previous | Failuresafelycontained, stale/doubledeployrejected, previouspreserved | tests/deploy/test_release.py/test_ssh_session.py | PASS22Linux | logs/deployment-final-verified-linux.log |
| REC-05 | Collector/metadata/proposal/backup/state/slot/error boundary classes | Redaction/no automaticretry; onlymetadata; onlyID/start; preservepolicy/exactrestore; archives/identity validated | test_diagnostic/test_guard_metadata/test_guard_reconcile/test_guard_commit/test_slot_readiness | PASS26Linux | logs/recovery-final-verified-linux.log; earlier failures preserved |
| REC-06 | Owner initially forbidsliveDBmetadata; explicitexception granted | Metadataonly, exactreleasedimages andunchangedpolicies; private lock/backup/atomicguardupdate/pre-postPASS | approved externalhelper + unchangedtrustedcontroller | PASS | guard-proposal.json; guard-metadata-current.jsonl; guard-reconciliation-applied.jsonl; confige259→d7fc |
| REC-07 | Previous retained; rollback withoutproductionrehearsal | Previousslothealthy/health200/exactSHA, requiredarchives/currentroutesnapshotpresent | frontend-slot-readiness.py + localrollbacktests | PASS (previous-slot readiness; caveat below) | frontend-slot-readiness-after.jsonl; c114/82f27dc5… retained |
| REC-08 | BuildPASS/deployFAIL; fixverified/currentMAIN | Officialfailedjobsretryonce; deploy+publicacceptanceSUCCESS; buildreused | existingtrustedworkflow | PASS | ci-attempt2-success.json; deployjob114373825796; logs/deployment-attempt2-success.log |
| PUBLIC-REC-09 | Websitec114 before; realconfigdisabled | Newexact5d55/health200/no-store, 5widths/navigation/FAQ/assets200/errors0, popuphidden | production-readonly-recovery-smoke.mjs / Chromium realHTTPS GET-only | PASS | production-readonly-smoke.json; fivehome screenshots opened |
| PUBLIC-REC-10 | Legalroutes existing | privacy/terms200, heading/stylesvisible | independentreadonlybrowser | PASS | production-readonly-smoke.json; legal screenshots opened |
| ADMIN-REC-11 | Newlist/detail routing404 before | Routeexists/no-store, anonymousredirectlogin, blankfields/no privatedata; nologinattempt | independentguestbrowser + CIguestguard | PASS | production-readonly-smoke.json; list/detail screenshots opened |
| REC-12 | Backend/DB/campaign safety | Metadataunchanged/API-DBdigestsstartshealthy; file/unit hashesunchanged; noSQL/exec/writes/toggle; disabledrevision1 | before/aftermetadata/publicGET/commandscope | PASS (taskscope) | guard-metadata-current vs after-deployment; production-public-config-after.json |

Recovery tests48distinctPASS (22repo +26task), không cộng rerun/CI/postdeploy checks vào757 applicationlocal count. Operational recovery matrix12PASS/0FAIL/0BLOCKED/0NOT_RUN, historicalCIFAIL vẫn giữ. CIpublic acceptance31PASS/25existingbaselineSKIP; SKIP không làPASS, conditionalrollback/artifact N/A theo workflow. Không đo mới appcoverage vì151source/test/config files byte-identical; không giả Pythonhelpers coverage làUIcoverage.

**Rollback caveat:** previous-slot readiness và rollback assets đã xác minh; oldserver archive cóhistoricalbackendIDs (`archiveGuardMatchesActiveBaseline=false`). Không overwriteimmutablearchive/releasemetadata, không productionrollbacktest. Sau một rollback được owner yêu cầu, guardfrontend cần reconcile lại theo liveauthorizedBE metadata/runbook trước verify/deploy tiếp; không thayBE/DB. Không tuyên bố fullautomaticbackendbaselineadoption. Physicaldevices/IME/mobilekeyboard/nativeSafari/AT limits, coveragegaps vàunsupported capabilities từPhase2 vẫn giữ, không sửa thànhPASS.

Localfixture/PostgreSQL chứng minh public/admin contract trướcpublication; production chỉwebsite/guest/config/static/metadatareadonly, không kiểm tra rewardissuance hoặccustomerrecords. Dedicated Vietnamese report/receipt/Git-source/evidence manifest ởH; hai reports workingtree update, no extraMAINcommit/deploy loop.

## Popup Marketing Redesign + 120s Timer — ma trận trước sửa source

Lập 11/10/2026 trước triển khai. FE MAIN/live `5d55b1b842aef09bfe729c69ace8e79d74863bb2`; BE MAIN `233e71562dda9ce3f7776e2fa52f23db3d96be21` đã đối chiếu GitHub. Campaign GET thực hiện tại enabled=true/revision2, không phải disabled của lịch sử. Scope FE-only: giữ DTO/idempotency/Admin/CSRF. Evidence mới `H:/HomeMind/tasks/feedback-popup-fe-redesign/20261011-main-5d55b1b/`. Kết quả lịch sử phía trên không chứng minh candidate mới. Mỗi row chỉ PASS khi toàn bộ thao tác khả dụng ghi trong row có evidence; device thật tách riêng.

| ID | Requirement | Initial / input / thao tác | Expected UI / request | Layer / test file | Result | Evidence / reason |
|---|---|---|---|---|---|---|
| TIMER-01-A | Initial enabled / delayed config | Home mới; GET enabled ngay hoặc trì hoãn | Auto-open sau config hợp lệ, không đợi click/120s; một dialog | Unit invitation.unit; E2E redesign.spec | NOT_RUN | Chưa code |
| TIMER-01-B | Fail closed | Disabled/unknown/error/malformed/403/loading | Không auto-open hoặc POST; retry GET hữu hạn | Unit + adapter.unit + redesign.spec | NOT_RUN | Chưa chạy |
| TIMER-02-A | X/Escape exact boundary | Đóng; 119999ms/120000ms; đóng lần hai | Fresh GET và mở đúng deadline lần đóng, không timer trùng | Unit invitation.unit; virtual-clock E2E redesign.spec | NOT_RUN | Chưa code |
| TIMER-02-B | Manual / repeated config / already open | Mở thủ công khi timer chờ; deadline đến khi đang mở | Cancel lịch cũ; không reset form; close tạo lịch mới | Unit + redesign.spec | NOT_RUN | Chưa code |
| TIMER-03-A | Background / focus | Hidden hơn120s; visible/focus; throttled callback | Không focus tab nền; một fresh check/open lúc hợp lệ | Unit + DOM E2E redesign.spec | NOT_RUN | Chưa chạy |
| TIMER-03-B | Ownership / lifecycle | StrictMode, remount, duplicate owner, unmount, Fast Refresh cleanup | Một scheduler; dispose timer/listener; stale GET không mở | Unit + browser redesign.spec | NOT_RUN | Chưa code |
| TIMER-03-C | Other modal | Dialog/alertdialog website đang mở lúc deadline | Deferred một lần; fresh GET khi dialog kia đóng; không cướp focus | Unit + browser redesign.spec | NOT_RUN | Chưa code |
| TIMER-03-D | Navigation / refresh / reconnect | Legal/login/Admin; về home; reload; online event | Homepage-only; fresh initial; không listener/scroll leak/POST | Browser redesign + landing | NOT_RUN | Chưa chạy |
| TIMER-04-A | Pending/outcomes + repeat | Đóng khi checking/sending/success/rejected/uncertain; deadline | Giữ draft/outcome; chỉ gửi mới/retry khi chủ động; đúng key | Unit session + browser integration/redesign | NOT_RUN | Chưa chạy |
| TIMER-04-B | Disabled while open / before reopening | Config tắt hoặc lỗi sau mở; pre-submit/reopen GET | Không POST khi gate không cho phép; giữ draft; không stale reopen | Unit + browser integration/redesign | NOT_RUN | Chưa chạy |
| UI-01-A | Desktop landscape | 1024/1280/1366/1440/1920; 768-high tablet | Hai cột thực từ breakpoint; form/CTA trong khung, không overflow | Browser redesign.spec + ảnh mở | NOT_RUN | Chưa code |
| UI-01-B | Mobile / low height | 320/360/390/768;390×320;landscape | Stack gọn; internal scroll; close/CTA tiếp cận; inputs16px | Browser redesign/popup + ảnh mở | NOT_RUN | Chưa code |
| UI-01-C | Keyboard / safe area simulation / zoom | visualViewport resize/offset, zoom200% reflow tương đương | Không tràn; controls trong viewport/scroll phù hợp | Browser redesign/popup + ảnh mở | NOT_RUN | Không khẳng định device thật |
| UI-02-A | Copy / required semantics | Đọc heading/subtitle/CTA/4labels/errors | Bỏ câu cũ;4sao đỏ aria-hidden; required; không hứa activated; policy ngắn | Browser redesign/integration + review | NOT_RUN | Chưa code |
| UI-02-B | Hero CTA placement | Home desktop/mobile trước/sau; enabled/disabled | CTA trong hero; bỏ strip rời; không duplicates/CLS vì thêm slot | Browser redesign + screenshot + geometry | NOT_RUN | Chưa code |
| UI-03-A | Keyboard / announcements / focus / scroll | Tab/ShiftTab/X/Escape/backdrop/10cycles | Named dialog; trap/return; backdrop giữ; lỗi liên kết; restore | Browser integration/popup/redesign | NOT_RUN | Chưa chạy |
| UI-03-B | Contrast / motion / performance | Normal/reduced media; input ngay khi entrance | AA; motion200ms không chặn; reduce tắt; bundle/CLS bounded | Browser redesign + build baseline | NOT_RUN | Chưa code |
| LEGAL-01-A | Additive grounded copy | Terms/Privacy old sections + new program anchors | Giữ nội dung cũ;2592000seconds/lifecycle/paid/manual;4fields/purposes/docs-only | Unit legal source preservation + browser redesign | NOT_RUN | Chưa code |
| LEGAL-01-B | Links / direct / back / draft | New-tab legal từ popup, reload anchor, back | URL/anchor thật, noopener; draft/kết quả không mất; focus khi trở lại | Browser redesign/popup/brand-legal | NOT_RUN | Chưa code |
| API-01-A | Validation/request/response | Boundaries/Unicode/IME/autofill/202/error codes | DTO/normalizers/headers/no-store/idempotency không đổi; neutral outcome | Existing210 unit + browser integration | NOT_RUN | Evidence cũ không thay current validation |
| API-01-B | Real isolated public backend | GET/POST/replay/new key/2tab/account/one reward | Real Nest/PostgreSQL local; zero production writes | real-contract + integration live cases | NOT_RUN | Docker vừa được owner mở; fixture riêng đang chuẩn bị |
| API-01-C | Real isolated Admin regression | Auth/logout/CSRF/guest/toggle/list/detail/filter | Existing model không đổi; API permission/guard thực | admin-real-contract + admin-integration | NOT_RUN | Fixture local riêng |
| REGRESSION-01-A | Homepage / menu / legal / assets | Existing browser suite + direct/reload routes | Không page/global-CSS/anchors/hydration regression | tests/browser/*.spec | NOT_RUN | 25 baseline SKIP giữ riêng |
| REGRESSION-01-B | Admin / four engines | Chromium/Firefox/WebKit/Edge existing surfaces | Guest guards/nav/modal/table/mobile preserved | integration/admin-integration/popup/redesign | NOT_RUN | Phạm vi engine, không device Safari thật |
| PRIVACY-01 | Security / XSS / PII | Form HTML/server errors/config; URL/storage/network | React text; không PII log/storage; không autoPOST; origins/cookies intact | Browser integration/redesign + scans/review | NOT_RUN | Chưa chạy |
| COVERAGE-01 | Changed-feature coverage | Unit V8 + current browser maps | Report statement/line/function/branch & gaps, không exclusion mới | Scoped c8 + report-browser-coverage | NOT_RUN | Chưa đo candidate |
| RELEASE-01-A | Final local gates | Exact candidate lint/type/build/unit/E2E/audit/license/secrets/image/controller | All release-blocking local checks PASS, fingerprint | Toolchain + tests/deploy/image-smoke | NOT_RUN | Chưa code |
| RELEASE-01-B | Publication / CI / deploy | Current MAIN/rules, allowlist commit, exact SHA workflow | Non-force; required gates PASS; one trusted deployment | GitHub Actions receipts | NOT_RUN | Chưa publish |
| RELEASE-01-C | Live independent read-only | Health SHA/home/legal/login/Admin guard/config/assets | Exact new SHA; campaign unchanged; no DB/business writes | Safe production browser + public GET | NOT_RUN | Sau trusted deployment |
| DEVICE-REDESIGN-01 | Physical keyboard/IME/notch/AT/native Safari/OS zoom | Thiết bị thật | Xác minh trên hardware/AT thật nếu có | Device manual | BLOCKED | Không thiết bị/AT trong tooling; simulation không thay evidence này |

Scheduling dự kiến: một owner theo Document; initial fresh GET; close tạo timestamp deadline+120000; manual open xóa lịch; deadline/foreground lấy config no-store mới; hidden/another modal defer; lỗi fail closed rồi chỉ GET lại hữu hạn sau120s/foreground; never autoPOST. Backdrop vẫn không đóng. Success không bị reset khi tự mở lại; thao tác lượt mới là chủ động. Đây là planning, kết quả sẽ cập nhật sau test thật.

## Popup Marketing Redesign + 120s Timer — kết quả local cuối

LOCAL_READY.978 distinct PASS / 0 FAIL còn mở / 25 baseline SKIP; DEVICE BLOCKED là giới hạn hardware, publication/live NOT_RUN trước release. Historical failures/timeouts không bị xóa; latest per-case reruns giữ assertions và thay kết quả theo file/title/engine. PUBLIC thật và ADMIN thật dùng task-owned Nest/PostgreSQL local; success/error/timer/config edge fixtures chỉ chứng minh presentation/state, không được gọi là production reward evidence.

| ID | Requirement | Initial / input / thao tác | Expected UI / request | Layer / test file | Result | Evidence / reason |
|---|---|---|---|---|---|---|
| TIMER-01-A | Initial enabled / delayed config | Home mới; GET enabled ngay hoặc trì hoãn | Auto-open sau config hợp lệ, không đợi click/120s; một dialog | Unit invitation.unit; E2E redesign.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-01-B | Fail closed | Disabled/unknown/error/malformed/403/loading | Không auto-open hoặc POST; retry GET hữu hạn | Unit + adapter.unit + redesign.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-02-A | X/Escape exact boundary | Đóng; 119999ms/120000ms; đóng lần hai | Fresh GET và mở đúng deadline lần đóng, không timer trùng | Unit invitation.unit; virtual-clock E2E redesign.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-02-B | Manual / repeated config / already open | Mở thủ công khi timer chờ; deadline đến khi đang mở | Cancel lịch cũ; không reset form; close tạo lịch mới | Unit + redesign.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-03-A | Background / focus | Hidden hơn120s; visible/focus; throttled callback | Không focus tab nền; một fresh check/open lúc hợp lệ | Unit + DOM E2E redesign.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-03-B | Ownership / lifecycle | StrictMode, remount, duplicate owner, unmount, Fast Refresh cleanup | Một scheduler; dispose timer/listener; stale GET không mở | Unit + browser redesign.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-03-C | Other modal | Dialog/alertdialog website đang mở lúc deadline | Deferred một lần; fresh GET khi dialog kia đóng; không cướp focus | Unit + browser redesign.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-03-D | Navigation / refresh / reconnect | Legal/login/Admin; về home; reload; online event | Homepage-only; fresh initial; không listener/scroll leak/POST | Browser redesign + landing | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-04-A | Pending/outcomes + repeat | Đóng khi checking/sending/success/rejected/uncertain; deadline | Giữ draft/outcome; chỉ gửi mới/retry khi chủ động; đúng key | Unit session + browser integration/redesign | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| TIMER-04-B | Disabled while open / before reopening | Config tắt hoặc lỗi sau mở; pre-submit/reopen GET | Không POST khi gate không cho phép; giữ draft; không stale reopen | Unit + browser integration/redesign | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| UI-01-A | Desktop landscape | 1024/1280/1366/1440/1920; 768-high tablet | Hai cột thực từ breakpoint; form/CTA trong khung, không overflow | Browser redesign.spec + ảnh mở | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| UI-01-B | Mobile / low height | 320/360/390/768;390×320;landscape | Stack gọn; internal scroll; close/CTA tiếp cận; inputs16px | Browser redesign/popup + ảnh mở | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| UI-01-C | Keyboard / safe area simulation / zoom | visualViewport resize/offset, zoom200% reflow tương đương | Không tràn; controls trong viewport/scroll phù hợp | Browser redesign/popup + ảnh mở | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| UI-02-A | Copy / required semantics | Đọc heading/subtitle/CTA/4labels/errors | Bỏ câu cũ;4sao đỏ aria-hidden; required; không hứa activated; policy ngắn | Browser redesign/integration + review | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| UI-02-B | Hero CTA placement | Home desktop/mobile trước/sau; enabled/disabled | CTA trong hero; bỏ strip rời; không duplicates/CLS vì thêm slot | Browser redesign + screenshot + geometry | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| UI-03-A | Keyboard / announcements / focus / scroll | Tab/ShiftTab/X/Escape/backdrop/10cycles | Named dialog; trap/return; backdrop giữ; lỗi liên kết; restore | Browser integration/popup/redesign | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| UI-03-B | Contrast / motion / performance | Normal/reduced media; input ngay khi entrance | AA; motion200ms không chặn; reduce tắt; bundle/CLS bounded | Browser redesign + build baseline | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| LEGAL-01-A | Additive grounded copy | Terms/Privacy old sections + new program anchors | Giữ nội dung cũ;2592000seconds/lifecycle/paid/manual;4fields/purposes/docs-only | Unit legal source preservation + browser redesign | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| LEGAL-01-B | Links / direct / back / draft | New-tab legal từ popup, reload anchor, back | URL/anchor thật, noopener; draft/kết quả không mất; focus khi trở lại | Browser redesign/popup/brand-legal | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| API-01-A | Validation/request/response | Boundaries/Unicode/IME/autofill/202/error codes | DTO/normalizers/headers/no-store/idempotency không đổi; neutral outcome | Existing210 unit + browser integration | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| API-01-B | Real isolated public backend | GET/POST/replay/new key/2tab/account/one reward | Real Nest/PostgreSQL local; zero production writes | real-contract + integration live cases | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| API-01-C | Real isolated Admin regression | Auth/logout/CSRF/guest/toggle/list/detail/filter | Existing model không đổi; API permission/guard thực | admin-real-contract + admin-integration | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| REGRESSION-01-A | Homepage / menu / legal / assets | Existing browser suite + direct/reload routes | Không page/global-CSS/anchors/hydration regression | tests/browser/*.spec | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| REGRESSION-01-B | Admin / four engines | Chromium/Firefox/WebKit/Edge existing surfaces | Guest guards/nav/modal/table/mobile preserved | integration/admin-integration/popup/redesign | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| PRIVACY-01 | Security / XSS / PII | Form HTML/server errors/config; URL/storage/network | React text; không PII log/storage; không autoPOST; origins/cookies intact | Browser integration/redesign + scans/review | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| COVERAGE-01 | Changed-feature coverage | Unit V8 + current browser maps | Report statement/line/function/branch & gaps, không exclusion mới | Scoped c8 + report-browser-coverage | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| RELEASE-01-A | Final local gates | Exact candidate lint/type/build/unit/E2E/audit/license/secrets/image/controller | All release-blocking local checks PASS, fingerprint | Toolchain + tests/deploy/image-smoke | PASS | 978 latest distinct local PASS; case/file/engine mapping và JSON receipts bên dưới; screenshots đã OPEN |
| RELEASE-01-B | Publication / CI / deploy | Current MAIN/rules, allowlist commit, exact SHA workflow | Non-force; required gates PASS; one trusted deployment | GitHub Actions receipts | NOT_RUN | Publication/live gate chưa chạy; exact receipts ngoài Git sau release |
| RELEASE-01-C | Live independent read-only | Health SHA/home/legal/login/Admin guard/config/assets | Exact new SHA; campaign unchanged; no DB/business writes | Safe production browser + public GET | NOT_RUN | Publication/live gate chưa chạy; exact receipts ngoài Git sau release |
| DEVICE-REDESIGN-01 | Physical keyboard/IME/notch/AT/native Safari/OS zoom | Thiết bị thật | Xác minh trên hardware/AT thật nếu có | Device manual | BLOCKED | Không hardware/AT; fake-clock/viewport/IME event simulation không thay thiết bị thật |

### Execution ledger — mới / Popup Marketing Redesign + 120s Timer

Mỗi row sau ghi input/thao tác và expected trong tên test, khởi đầu homepage mới với campaign fixture strict enabled trừ trạng thái được ghi rõ. Timer dùng virtual clock; legal đi route/anchor thật. PUBLIC/ADMIN real API tách khỏi fixtures; toàn bộ receipts và từng engine ở `evidence/latest-test-ledger.json`. Không cộng rerun vào số case.

| ID | Requirement / initial / input / expected | Layer / test file | Actual / evidence |
|---|---|---|---|
| RD-CASE-001 | enabled immediately opens after the fresh GET without a timer or POST | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-002 | delayed initial GET is fail closed until verified | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-003 | initial disabled stays closed; bounded GET recovery respects 120s | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-004 | initial unavailable stays closed; bounded GET recovery respects 120s | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-005 | initial unknown stays closed; bounded GET recovery respects 120s | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-006 | failed config request never opens; next GET is bounded | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-007 | every close has exact 119999/120000 boundary and one fresh GET | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-008 | manual open cancels the old deadline and a later close starts a new one | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-009 | a repeated close while already closed does not create an extra timer | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-010 | hidden defers an expired invitation without polling; one foreground open | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-011 | lost focus defers an expired invitation without polling; one foreground open | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-012 | another dialog defers an expired invitation without polling; one foreground open | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-013 | another route defers an expired invitation without polling; one foreground open | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-014 | initial hidden tab reads configuration but waits for a fresh foreground check | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-015 | safety is revalidated at the config check boundary after a due wake | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-016 | eligibility lost during a GET defers, then reads fresh config on wake | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-017 | manual open/close while recheck pending invalidates its late response and preserves new deadline | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-018 | stop cancels timer/subscription; late initial GET cannot open; stopped start is inert | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-019 | stop removes a scheduled timeout; StrictMode replacement opens once with a new owner | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-020 | success and draft operation remain intact after the timed invitation; no automatic submission | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-021 | fresh disabled recheck does not clear success or open using an old enabled value | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-022 | starting with an open session does not fetch or duplicate its modal | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-023 | DOM owner excludes other dialogs, background/route/focus; duplicate mount and cleanup own all listeners | UNIT / `tests/feedback/invitation.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-024 | legal addition preserves every published terms-of-service section byte for byte after newline normalization | UNIT / `tests/feedback/legal.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-025 | legal addition preserves every published privacy-policy section byte for byte after newline normalization | UNIT / `tests/feedback/legal.unit.spec.ts` | :PASS; `logs/unit-coverage-final.log` |
| RD-CASE-026 | TIMER-01 immediate enabled invitation belongs to the actual homepage hero | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-027 | TIMER-01 delayed config opens only once after a strict enabled response | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-028 | UI-03 delayed campaign keeps the homepage hero layout stable at 390px | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-029 | UI-03 delayed campaign keeps the homepage hero layout stable at 1440px | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-030 | TIMER-01 disabled fails closed including the bounded next GET | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-031 | TIMER-01 malformed fails closed including the bounded next GET | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-032 | TIMER-01 unknown fails closed including the bounded next GET | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-033 | TIMER-01 403 fails closed including the bounded next GET | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-034 | TIMER-01 503 fails closed including the bounded next GET | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-035 | TIMER-01 non-json fails closed including the bounded next GET | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-036 | TIMER-02 X: 119999ms closed, 120000ms fresh reopen, next cycle exact | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-037 | TIMER-02 Escape: 119999ms closed, 120000ms fresh reopen, next cycle exact | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-038 | TIMER-02 manual reopen cancels the old timer, keeps draft, and close restarts 120s | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-039 | TIMER-03 simulated hidden visibility waits past deadline and opens once on foreground event | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-040 | TIMER-03 another native dialog retains focus/draft until it closes, then one fresh invitation | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-041 | TIMER-03 mobile website menu defers the due invitation until Escape closes the menu | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-042 | TIMER-03 route unmount clears deadline, legal never invites, returning/reload home is a new initial visit | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-043 | TIMER-03 /terms-of-service has no public timer/config invitation | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-044 | TIMER-03 /privacy-policy has no public timer/config invitation | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-045 | TIMER-03 /dang-nhap has no public timer/config invitation | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-046 | TIMER-04 success survives close and timed reopening; new submission is explicit with a fresh key | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-047 | TIMER-04 timeout while closed stays uncertain after reopening; no autoPOST or false activation | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-048 | TIMER-04 reopen disabled fresh config blocks stale invitation and preserves manual draft | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-049 | TIMER-04 reopen malformed fresh config blocks stale invitation and preserves manual draft | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-050 | TIMER-04 late recheck cannot reopen a form manually opened/closed while config is pending | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-051 | UI-01 layout 320x720 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-052 | UI-01 layout 360x800 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-053 | UI-01 layout 390x844 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-054 | UI-01 layout 768x900 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-055 | UI-01 layout 1024x768 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-056 | UI-01 layout 1280x900 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-057 | UI-01 layout 1366x768 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-058 | UI-01 layout 1440x900 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-059 | UI-01 layout 1920x1080 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-060 | UI-01 layout 390x320 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-061 | UI-01 layout 768x390 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-062 | UI-01 layout 640x450 with actual form, CTA and inspected screenshot | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-063 | UI-02 exact copy, required asterisks/semantics, concise steps and safe legal links | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-064 | UI-03 animation duration is bounded and reduced-motion disables popup/CTA effects | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-065 | UI-03 keyboard trap, field alerts, close focus return and exact scroll restore over repeated cycles | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-066 | UI-03 visualViewport keyboard-like resize keeps close/CTA and internal scroll accessible | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/keyboard-final-results.json` |
| RD-CASE-067 | UI-03 text/required/focus/CTA palette meets AA | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-068 | LEGAL-01 /terms-of-service direct anchor/reload and existing rights/contact preserved | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/legal-after-final-results.json` |
| RD-CASE-069 | LEGAL-01 /privacy-policy direct anchor/reload and existing rights/contact preserved | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/legal-after-final-results.json` |
| RD-CASE-070 | LEGAL-01 new-tab terms/privacy preserve the form draft and safe focus on return | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/legal-after-final-results.json` |
| RD-CASE-071 | PRIVACY-01 user input remains escaped text with no PII in storage, URL, or automatic requests | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/redesign-final-results.json` |
| RD-CASE-072 | TIMER-04 VALIDATION_ERROR survives timed reopening without automatic retry or draft reset | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/rejected-timer-final-results.json` |
| RD-CASE-073 | TIMER-04 RATE_LIMITED survives timed reopening without automatic retry or draft reset | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/rejected-timer-final-results.json` |
| RD-CASE-074 | LEGAL-01 native legal fragments do not inherit homepage smooth-scroll timing | REDESIGN / `tests/feedback/redesign.spec.ts` | chromium:PASS, firefox:PASS, webkit:PASS, edge:PASS; `evidence/legal-after-final-results.json` |

### Execution counts và commands

| Scope | Distinct PASS | FAIL còn mở | SKIP | Evidence |
|---|---:|---:|---:|---|
| UNIT |235|0|0|`logs/unit-coverage-final.log`, scoped c8 summary;23 invitation +2 legal added |
| Real PUBLIC/ADMIN contracts |14|0|0|`logs/real-contract-resumed.log`; actual owned Nest/PostgreSQL after fixture recovery |
| PUBLIC actual production frontend |156|0|0|`evidence/public-final-results.json`;4 engines;2 real local cases perengine, remaining labeled fixtures |
| Redesign homepage/timer/UI/legal |196|0|0|main46×4 +2 rejected×4 +1 nativelegal×4; legal16/keyboard4 targeted replaces same cases |
| ADMIN regression |192|0|0|41 completed before I/O interruption +7 Chromium resumed +144 otherengines; exact mapping JSON |
| Legacy presentation popup |124|0|0|122 initiallyPASS/2FAIL; affected shell4engine rerunPASS, no weakened assertion |
| Production image smoke |31|0|25|`linux-image-smoke-native-legal.json`; local runtime-content fingerprint label, health/privatefiles/guest/failure containment; Git SHA/registry digest do CI xác minh |
| Existing Admin unit |8|0|0|`admin-unit.json` |
| Release controller rehearsal |22|0|0|`deployment-regression.json`, actual repo Python tests unchanged |
| TOTAL latest unique cases |978|0|25|`latest-test-ledger.json`; no coverage/CI/extra rerun double count |

Additional supporting checks PASS: StrictMode3, actual Next dev HMR1, coverage helper synthetic1, lint/typecheck/build/production audit/license+bundle diff/secrets/privatefile checks. These are separate gates/evidence, not added to978. Hardware1 requirementBLOCKED; publication/live2 requirementNOT_RUN until trusted workflow and externalreceipt. Phase1 unavailable-contract BLOCKED rows remain historical, not current candidate blockers. No newly added SKIP; four browser engines are available, physical nativeSafari/AT is not.

Coverage publictenfiles/timer100% statement/line/function/branch; combined instrumented scope88.65%statement/line,88.02%function,97.11%branch. Unchanged Admin use-query0%/shared auth/client partial and static SSR legal render/CSS measurement gaps explicitly retained; no coverage exclusion/threshold reduction. `verification-reuse-scope.json` proves covered logic identical after legalCSS/BOM fix;16 affected legal and4 actual keyboard cases rerun. Source runtime fingerprint35b0f246ca1be01881ea9bf1c42a2be3b670e5bb5782ef965a47e4f6738d592f; full tested file hashes/manifests are external. Final report does not treat coverage as proof of all possible scenarios.

H storage interruption is an environmental failure, not silently SKIP/PASS: Windows disk153/UASPStor129 Disk1 evidence preserved; two Admin assertions timed out while I/O blocked. Task-owned fixture recovered with fresh tmpfs DB after owner openedDocker, and affected/remaining tests plus14 real contract cases PASS. No global restart/prune/owner fixture mutation or production SQL. All final test/build/log/screenshot/cache output remains on H.

Latest inspected visuals: screenshots/current-desktop/mobile/terms/privacy; all required widths+short/keyboard/error/pending/accepted/rejected/uncertain images OPEN. Only fixture data appears in local outcome screenshots. Final source review27allowlistedfiles, no production preview route/source map/new dependency/Admin API/auth/workflow/env change. Pre-release MAIN5d55/live5d55/current digestaa240c91/slots healthy; campaign enabledtrue/revision2 was already admin-authorized at task start. Publish/deploy and postdeploy rows must be filled from actual receipts, never inferred from local PASS.

## Popup Marketing Redesign + 120s Timer — correction sau acceptance rollback

Checkpoint local: **LOCAL_READY**, chưa xác nhận publication/deployment của replacement tại thời điểm commit báo cáo này. Giữ lịch sử candidate `83365785dbd274bdaca159c2f42979331918d42a` và [run 38116098274](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38116098274): build SUCCESS, exact-digest activation SUCCESS, public acceptance FAIL (29 PASS / 2 FAIL / 25 baseline SKIP), trusted conditional rollback SUCCESS về `5d55b1b842aef09bfe729c69ace8e79d74863bb2`. Digest bị rollback `sha256:213efe509c6f7e4d39d8fc895569e5580b6d945a1c556344ce3a9d27a320c375`. Không blind rerun hoặc SSH deploy; phải dùng SHA/image mới qua pipeline nguyên trạng.

Nguyên nhân CI được xác nhận bằng trace/ảnh đã OPEN: handler đóng invitation bằng pointer click, rồi test dùng `focus()` và đòi `:focus-visible`. Diagnostic local xác nhận brand focused=true nhưng focusVisible=false sau pointer; keyboard Tab chuyển focusVisible=true. Hai lỗi CSS được tái hiện với API Nest local campaign enabled trước fix. Không phải Docker timeout hoặc lỗi kích hoạt image. Test sửa để dùng keyboard modality thật, giữ color/outline assertions và thêm focus assertion. Đợi public GET đã xác thực + native initial dialog rồi đóng, tránh race React showModal/native inert tree; handler có ownership rõ khi test đang kiểm tra dialog.

Lượt enabled phát hiện thêm hai lỗi runtime: SPA legal→`/#features` bị khóa body trước khi fragment scroll hoàn tất; Tab đến muộn trên dialog đã close chạy trap với controls đã hidden. Regression fail-before được giữ. `invitation.ts` chuẩn bị fragment trước lần mở đầu (getElementById/decode an toàn), không scroll lại ở chu kỳ sau; `FeedbackPopup.tsx` bỏ qua key trên dialog đã đóng. Cả X/Escape/deadline120000/fresh GET/draft/result/idempotency/other-dialog safety giữ nguyên. Regression mới kiểm anchor rồi chủ động scroll về đầu; chu kỳ sau giữ vị trí đó, không có POST.

Extended WebKit kiểm tra phát hiện footer links có sẵn bị bỏ qua bởi native Tab (source footer trước fix giống baseline). Bổ sung tabIndex=0 cho bốn link liên hệ/pháp lý, không đổi text/layout/API. Before trace và diagnostic chứng minh BODY/FAQ button thay vì link; after WebKit desktop/mobile PASS với Tab thật. Mobile menu test mở bằng Enter để xác minh keyboard opener/focus return đúng, không giả định WebKit pointer click focus button. Firefox navigation-cancel favicon NS_BINDING_ABORTED được phân biệt với resource failure; vẫn kiểm fresh favicon HTTP200, giữ mọi runtime/asset/color assertions. Enabled fixture mới chỉ trong test loopback, không có production mock endpoint/flag/bundle; website smoke vẫn lấy GET thật.

997 distinct scoped PASS / 0 software FAIL còn mở / 25 baseline SKIP: UNIT242, CONTRACT14, PUBLIC156, REDESIGN208, ADMIN192, LEGACY124, IMAGE31, ADMIN_UNIT8, DEPLOY22. Các case real contract/admin không đổi source được giữ bằng chứng cũ; public thực chạy lại bốn engines có owned Nest/PostgreSQL integration. Không cộng reruns/coverage/supporting brand probes vào997. Device/AT/native mobile keyboard/notch/OS zoom vẫn BLOCKED theo giới hạn thiết bị, không gán PASS. New timer/modal logic100% line/statement/function/branch; ten public feature JS/TS100% với fresh data của hai file sửa và chỉ tái dùng coverage khi normalized source hash không đổi. Combined instrumented scope88.78% line/statement,88.27% function,97.10% branch; unchanged Admin use-query/shared auth/client gaps giữ nguyên. CSS wrapper không được gọi là CSS coverage, Footer/static legal SSR không có business branch đo runtime JS.

Full logs/failures giữ trên H. Lượt production build copy thiếu updated test interface bị typecheck từ chối, snapshot được sửa đủ rồi build PASS; local image guard từ chối content revision nhập thiếu40 ký tự, build lại dùng fingerprint[:40] PASS, không nới guard. Khi rebuild final footer, các case đang dùng local3527 bị connection failure; raw logs giữ, đúng9REDESIGN/3PUBLIC cases chạy lại PASS. Một regression-test snapshot chụp focus trước cleanup hoàn tất được sửa bằng đợi focus rời closed dialog, vẫn giữ assertion focus/scroll không thay đổi và runtime errors0; late-Tab4 engines PASS. Không xóa/skip test hoặc nới assertion. Final lint/typecheck/build/image/no-store/guest/failure containment PASS; production audit0, dependency/license/lock không đổi; pinned secret scan0 findings. No .github/deploy/auth/Admin API/backend/production config changes.

Runtime fingerprint cuối `d65ca9f581e1cb3cf01c14c9779fb89c34721c5b3cd49181a173836c4767142c`. Source/full diff hash và exact release SHA sẽ được xác nhận từ external publication receipt, không gán artifact833 cho code mới. Evidence root `H:/HomeMind/tasks/feedback-popup-fe-redesign/20261011-main-5d55b1b/`: `replacement-test-ledger.json`, `replacement-coverage.json`, `source-fingerprint-current.json`, `replacement-preflight-state.json`, `focus-modality-finding.json`, `first-attempt-ci-state-current.json` trong evidence; failure traces ở ci-first-browser-failure/enabled-before/fragment-before/closed-tab-before; screenshots/replacement-desktop/mobile/terms/privacy đã capture và OPEN. Backend233e715 và campaign production enabledtrue/revision2 được giữ baseline;0 production SQL/DB test/feedback/account/reward write/login/toggle. Operational final receipt ngoài Git, không tạo commit success chỉ để redeploy.

| ID | Requirement / initial | Input / thao tác | Expected UI/request | Layer / test file | Actual | Evidence |
|---|---|---|---|---|---|---|
| RC-01 | PUBLIC enabled home; initial popup | X pointer rồi keyboard brand focus | Focus thật + green/outline,0POST; không đòi focus-visible sau pointer thuần | Browser brand-legal.spec.ts | PASS final; CI2FAIL lịch sử giữ | enabled-real-final-acceptance; focus-modality-finding.json |
| RC-02 | PUBLIC legal page; campaign enabled;390/1440 | Link features→home; close; scroll top; virtual120000 | Anchor visible sau close đầu, cycle sau không nhảy lại anchor,0POST | Unit invitation.unit.spec.ts + E2E redesign.spec.ts;4engines | PASS8 browser + unit | fragment-before FAIL2; redesign-final-recovery-webkit-v2/latest ledger |
| RC-03 | PUBLIC closed native dialog | Dispatch queued Tab; reopen; Tab | Không error/focus/scroll mutation; reopened trap close focused | Component/browser redesign.spec.ts;4engines | PASS4 | closed-tab-before FAIL; late-tab-stable-final/result.json |
| RC-04 | Initial fragment absent/encoded/missing/malformed;manual/deferred first open | Start/foreground/manual+cycle | Safe ID lookup only before first auto open; never prepare repeat/manual-first | Unit invitation.unit.spec.ts | PASS7 new | unit-coverage-fragment.log; coverage-unit-fragment |
| RC-05 | PUBLIC/footer + LEGAL native keyboard | Tab/ShiftTab through email/social/legal; mobile Enter/menu/Escape | Tab order/return/contrast/link security remain correct | Browser brand-legal.spec.ts | PASS desktop/mobile4engines; fixture vs real separated | brand-webkit-footer-final; final-firefox/edge and enabled-real-final-acceptance |
| RC-06 | Disabled image / actual enabled owned API;unknown/config delay | Fresh home GET, close, route/reload | Confirm initial response before native modal assertions; no production fixture; fresh icon200 | Browser fixtures.ts/brand-legal.spec.ts + image-smoke.sh | PASS31+25baselineSKIP per run | linux-image-smoke-footer-final; enabled-real-final-acceptance |
| RC-07 | Final source;local3527 interrupted during rebuild | Recover exact failed tests unchanged expectations | All latest PUBLIC156/REDESIGN208/LEGACY124 PASS; preserve failed runs | Browser suites + targeted recovery | PASS; interrupted raw runs FAIL historical | replacement-test-ledger.json; public-final-recovery-firefox; redesign-final-recovery-*-v2 |
| RC-08 | Release candidate | Lint/type/build/security/immutable image/guest/controller | PASS all mandatory checks; SHA final only after commit; no bypass | CLI/repo gates | LOCAL PASS; new CI/VPS NOT_RUN pre-publication | publish-final logs/image-footer-final; later external release receipt |


## Popup Marketing Redesign + 120s Timer — receipt VPS đã xác minh

**FE_POPUP_REDESIGN_RELEASE_COMPLETE_VERIFIED**. Exact MAIN/live `3509f46cad51706c8c02b83520a27c86873703af`; immutable image `sha256:23be317ea2052a8389d048bff6ce4884720b178930e601ff3902391e2d6cf331`. [Trusted workflow](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/38120448111) attempt1/run21: build SUCCESS, deploy SUCCESS, required public/browser acceptance SUCCESS. Candidate833 historical FAIL và automatic rollback giữ nguyên evidence; replacement3509 có gate và image mới, không blind retry/SSH deploy. New source fingerprint `bf28f9664b0c877a22f42de0f2f7d9a3e3cd11ecf63ed9222fabe5d830ce5939`; runtime `d65ca9f581e1cb3cf01c14c9779fb89c34721c5b3cd49181a173836c4767142c`.

Local997 distinct PASS,0 software FAIL còn mở,25 baseline SKIP; physical device/AT/native keyboard/notch/OSzoom BLOCKED và không báo PASS. Unit242, real owned local Nest/PostgreSQL contract14, PUBLIC156, REDESIGN208, ADMIN192, LEGACY124, image31, Admin unit8, deploy22. Timer/modal logic và ten public instrumented files100% line/statement/function/branch; combined88.78% line/statement,88.27% function,97.10% branch. Reused evidence chỉ khi source hash không đổi; static legal/Footer SSR/CSS không được gọi là runtime JS coverage. Supporting reruns không cộng trùng997.

Independent read-only HTTPS health/revision, homepage5widths, actual initial invitation+virtual119999/120000+fresh GET, legal anchors, guest login/dashboard/management guard, assets và runtime PASS; live screenshots capture và OPEN. Currentblue:3100 healthy/restart0/exact SHA+digest; previousgreen:3101 giữ5d55 healthy, archives/proxy rollback snapshot và guard match sẵn; lock không có holder/pending activation. Campaign vẫn enabledtrue/revision2, đã bật trước task bởi admin;0 task toggle. BE233e715 không đổi.0 production database tests/SQL/Prisma/business writes/feedback/account/reward/login. Không sửa .github/deploy/auth/Admin API/production config hoặc shared services.

Operational receipts ngoài Git: `H:/HomeMind/tasks/feedback-popup-fe-redesign/20261011-main-5d55b1b/HOMEMIND_FEEDBACK_POPUP_REDESIGN_RELEASE_REPORT_VI.md` và `HOMEMIND_LANDINGPAGE_VPS_DEPLOY_RECOVERY_REPORT_VI.md`; `evidence/release-complete-state.json`, `production-readonly-redesign-state.json`, replacement-test-ledger/coverage/source manifests/owner-task-sync; operator frontend-after/slot-readiness-after; CI logs/run snapshots; screenshots/live-*. Owner D HEAD/branch/index và unrelated baseline files được giữ; chỉ28 task paths sync để review. Receipt này chỉ ở working tree D và H evidence, không tạo MAIN commit gây deploy thêm. Các dòng NOT_RUN pre-publication/FAIL lịch sử ở trên là lịch sử, không phải trạng thái replacement cuối.


## Popup Alignment & Brand Logo — kế hoạch trước sửa

Baseline MAIN/live3509f46cad51706c8c02b83520a27c86873703af, verified bằng GitHub API/publicGET trước sửa; campaignenabledtrue/revision2 giữ nguyên. Task UI-only: FeedbackPopup.tsx/CSS, tests/config và hai reports; không sửa FeedbackExperience/session/invitation/adapter/DTO/auth/Admin/BE/DB/.github/deploy/package/lock/assets. Logo source chính thức src/app/logo.png, Brand.tsx dùng Next/Image36px trong Navbar. Chỉ thay badge gift16; giữ giftMark/Gift40/stroke1.5/CSS/animation hiện có nguyên vẹn. Suspected alignment cause: content grid tính trên available width sau stable scrollbar gutter, actions margin38% tính trên dialog width; phải đo fail-before rồi sửa shared grid geometry, không pixel offset.

Evidence task-owned `H:/HomeMind/tasks/feedback-popup-fe-alignment/20261011-main-3509f46`; TEMP/TMP/npm/PW cache/build/log/screenshots H. Owner D HEADc114/branchmain/index0ca preserved; all217 owner file hashes và diffs snapshot. Worktree fix/popup-alignment-logo trên H, normal publication chỉ khi local + workflow gates PASS; CI tựdeploy, không SSHdeploy. 0 productionPOST/login/DB/SQL/toggle.


| ID | Requirement / initial state | Input / thao tác | Expected / request | Layer/file | Actual trước code | Evidence |
|---|---|---|---|---|---|---|
| ALIGN-01 | Enabled homepage;320,360,390,768,899,900,1024,1280,1366,1440,1920 | Đo initial,4validation errors,long errors+resized textarea | Top/bottom white left/right delta≤1CSSpx;desktop mint.right=white.left;no gap/unexpected overflow;0POST | Browser alignment.spec.ts;four engines | NOT_RUN | Before/after geometry JSON + screenshots/crops |
| ALIGN-02 | Enabled low/keyboard/reflow | 390×320,768×390,1366×768,390×420,683×384(200%reflow) | Internal scroll;CTA onscreen;scroll end makes textarea/error reachable;no body scroll/overflow;0POST | Browser alignment.spec.ts | NOT_RUN | Geometry/scroll/client rects |
| LOGO-01 | Badge + Navbar real asset | Inspect/load/decode badge image;compareoriginalPNGhash/brand URL | Official mark,empty alt/decorative,20×20reserved box,HomeMind Premium text;no smallGift/wordmarkduplicate | Browser alignment.spec.ts | NOT_RUN | AssetHTTP/bodyhash/rects |
| LOGO-02 | Large Gift desktop/brandbaseline | Inspect SVG/style/source hashes | Gift40/stroke1.5/72box/gradient/shadow unchanged;Navbar/Footer/favicon/asset bytes untouched | Browser + source checks | NOT_RUN | Baseline SVG/style/hash + after |
| LOGO-03 | Delayed image/DPR2 | Hold badgeimage then load;deviceScaleFactor2 | No badge/text/panel layout shift;correctratio/highdensitysrcset/HTTP200 | Browser alignment.spec.ts | NOT_RUN | Before/after reserved geometry |
| REG-01 | Existing feature/mockstates | Run unit + public/redesign/legacycomponentbrowser suites | Focus/trap/Escape/return/scroll/timer119999/120000/configdisabled/error/POST/retry/draft unchanged | Existing test configs/files | NOT_RUN | Fresh logs/report/sourcefingerprint |
| REG-02 | Real owned isolated Nest/PostgreSQL | Contract14 + actual public flows;no productionDB | Endpoints/DTO/idempotency/errors/repeat remain verified;API/auth files hashes unchanged | Existing contract/integration suites | NOT_RUN | Owned fixture labels/manifest/receipts |
| REG-03 | Homepage/legal/Admin | Browserbrand/landing/icon +localAdminregression | Navbar/Footer/favicon/anchors/login/session/guestguard/navigation unchanged | Existing browser/admin suites | NOT_RUN | Fresh applicable tests; unchanged evidence mapped by hash |
| RELEASE-01 | Exact final candidate | lint,typecheck,build,audit/license/secret,image,deploy22 | Mandatory gatesPASS;no fixtures/secret/dependency/config changes;stageallowlistonly | Repo CLIs/tests/deploy | NOT_RUN | Command receipts/build/image/fingerprint |
| RELEASE-02 | Exact main/current campaign | Normalcommit/push;CI+trusteddeploy;liveGET/geometry/images/guest | Requiredbuild/deploy/acceptancePASS;exactSHA/digest;campaignsame;0 productionmutation | Workflow/read-onlybrowser | NOT_RUN | CIURLs/image+revision/production report |
| DEVICE-01 | Physical hardware/AT unavailable | NativeiOS/Androidkeyboard/notch/Retinahardware/screenreader | Recordtool limits;do not claim real devices from emulation | Manual hardware | BLOCKED | Only headless4engines/DPR/viewport/reflow simulation available |


## Popup Alignment & Brand Logo — final local results

Current checkpoint LOCAL_READY; rows NOT_RUN trong pre-code plan phía trên giữ như lịch sử, được cập nhật bằng bảng dưới.1073 unique automated PASS /0 unresolved FAIL /25 baseline SKIP /0 mandatory local BLOCKED /0 mandatory local NOT_RUN. No skip counts as PASS. Duplicate supporting reruns excluded; publication/deploy riêng chưa chạy tại commit.

|ID|Requirement / initial state|Input/thao tác|Expected UI/request|Layer/file|Actual|Evidence|
|---|---|---|---|---|---|---|
|ALIGN-01|Enabled actual home,11 widths320–1920,desktop≥900|Initial,empty submit4 errors,long layout fixture;rectpopup/form/footer/mint|Same left/right≤1;continuous mint boundary;0invalid/autoPOST|alignment.spec.ts four engines|PASS64 geometry tests /192states with ALIGN-02|max0/0;browser-redesign/results/**/geometry.json+PNG/seams|
|ALIGN-02|390×320,768×390,1366×768,390×420,683×384 reflow|Forced textarea800,long errors,scroll end|CTA fullviewport;last content clear footer;nohorizontaloverflow/body fixed|alignment.spec.ts|PASS included geometry64|192 measured states;visual opened representative all shapes|
|LOGO-01|Official Navbar/badge asset|HTTPload/rawPNGhash/sourceURL/alt/reserved20box|Only official mark,smallGift absent;textunchanged;0POST|alignment.spec.ts LOGO-01/02|PASS4 engines|brand.json;assetHTTP/sourcehash|
|LOGO-02|LargeGift and brand baseline|JSX/CSS/hash/SVG/style|Gift40/stroke1.5/72white/shadow/motion retained;Navbar/Footer/favicon untouched|alignment.spec.ts +invariants.py|PASS with LOGO-01|invariants.json:2runtimechanged/136unchanged|
|LOGO-03|Imageheld,DPR2/reducedmotion|Beforeload→release image|20box/badge/panel geometry identical;currentSrcw≥40;200|alignment.spec.ts|PASS4 engines|retina.json,no shift|
|REG-01|All public state/error/timer/keyboard paths|242unit+156public+208oldredesign+124legacy|119999closed/120000freshopen;draft/outcome/trap/scroll;noautoPOST;safeXSS|existing configs/specs +strict trustedimage privacy adaptation|PASS|consolidated-browser-ledger,unit-coverage,preview-legacy;mock/fixture scope explicit|
|REG-02|Released Nest233e/owned isolatedPG|14contract +8real publicbrowser in156;repeat/two tabs/account nomination|Endpoint/DTO/idempotency/origin/CSRF/errors/oneaward;no prod writes|real-contract/admin-real-contract/integration.spec.ts|PASS|real-contract-restored.log,production-public-restored.log;labels/loopback guarded|
|REG-03|Homepage/legal/Admin4engines|196Admin+8authunits+31imagebrowser;local authenticated toggle/list/filter/detail|Routes/nav/session/guard/privacy/CSRF/permissions/states remain correct|admin-integration.spec.ts,tests/admin,tests/browser|PASS,25 unchanged imagebaseline SKIP separate|browser-admin-rsc-corrected/result.json,admin-unit,docker-image-smoke;no prodlogin|
|RSC-01|Authenticated local fixture;existing website mapper|Browser fetch FE dashboard with RSC1/Next-Router-Prefetch1;body consumed|HTTP200 text/x-component;routing headers retained;zero console errors;no credential forwarded by FE mapper|admin-integration.spec.ts|PASS4 new cases included Admin196|admin-rsc-fail-before HTML FAIL;full corrected4engines result.json;production Admin source unchanged|
|RELEASE-01|Exact runtime candidate|lint,type/build/prodaudit/secrets/license/deploy22/image smoke|Required gates unchanged andPASS|repo scripts|PASS at local rehearsal;newSHA image gate next|evidence/*.json/logs;prod audit0;fulldev5HIGH baseline informational|
|RELEASE-02|CurrentMAIN/live/campaign baseline|Commitallowlist10/nonforcepush→officialCI→trusteddeploy→read-onlyhealth/routes/geometry/operator|ExactSHA/digest;requiredPASS;no campaignchange/productionmutation|workflow/externalrelease receipt|NOT_RUN beforepublication|SeparateexternalHreceipt will supersede after real verification;no extraMAINcommit|
|DEVICE-01|Hardware/AT unavailable|Nativekeyboard/notch/retina/screenreader|State limits,not fabricate manual hardwareproof|physical manual|N/A tooling unavailable;not mandatory automatedrelease gate|WindowsheadlessChromium/Firefox/WebKit/Edge +viewport/DPR/visualViewport/reflowemulation|

Failures kept: before geometry/logo2 expectedFAIL; old zero-img privacy3FAIL +invalid hex-token4FAIL; Origin35418FAIL; unavailableDocker/schema/temporaryrolecredentials recovery errors; interruptedunfinished cases. All affected mandatorycases now rerun/verified; no assertion weakened/skip added. Fixture rebuild only owned ephemeral syntheticlocalPG, no production database access. Newcopy expectedname tokens followNextgenerated filename; trustedPNG/hash/XSS assertions remain strict. Admin RSC fixture regression fail-before content-type HTML được sửa chỉ routing headers, no console suppression; full196Admin after fix. Fresh changed TSX coverage100/100/100/100 (98lines,4functions,37branches); CSS coverageN/A with192paintedgeometry states. Broader rawinstrumented83.07line/statement,75.63function,94.96branch; unchangedhooks gaps enumerated HTML. Full/source hash afterdocs is external, runtimehashcc34f800d68172f9f295ce85b394ec47f1bd1d64e2dbfe2315fdcedd78765e7b unchanged.
