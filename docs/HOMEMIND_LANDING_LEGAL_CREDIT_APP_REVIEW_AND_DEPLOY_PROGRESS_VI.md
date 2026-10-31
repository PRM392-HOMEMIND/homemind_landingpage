# HomeMind — Legal, Credit và phát hành Landing Page

Ngày kiểm chứng: **28/10/2026 (Asia/Saigon)**. Checkpoint source: **PASS_SCOPED**. PR, CI, deploy và đồng bộ gốc chưa được ghi trước là thành công; kết quả sau commit nằm trong receipt vận hành ngoài Git và PR.

## 1. Phạm vi và nguồn nghiệp vụ

Chỉ sửa website `PRM392-HOMEMIND/homemind_landingpage`: `/`, `/privacy-policy`, `/terms-of-service` và test/metadata liên quan. Backend/mobile `PRM392-HOMEMIND/homemind_backend` chỉ đọc. Không đổi flag, logic thanh toán, database, giá Store hoặc binary mobile; không giao dịch, email hay gọi AI thật.

Đã đọc toàn bộ đặc tả owner và audit canonical 23 mục: `HomeMind/docs/audits/HOMEMIND_PAYMENT_SUBSCRIPTION_CREDIT_BUSINESS_LOGIC_AUDIT_VI.md`. Audit gốc chỉ đọc và phần implementation được phân biệt với receipt triển khai sau đó. Backend source `afc6dae` và MAIN `2d83e388` có source liên quan tương đương. Receipt vận hành 27/10/2026 18:07 UTC ghi bốn checkout flag OFF; không dùng default source để giả chứng minh runtime mới. Quan sát mới28/10 bằng root gate hiện hữu xác nhận đúng backend2d83e388, environment match, migrationsMATCH và bốn checkout flag OFF; API/DB healthy, restart0/OOMfalse, protected file hashes match. Docker Env không đặt trực tiếp bốn biến, nên kết luận OFF dựa defaultfalse đã kiểm chứng trong image cùng root gate, không phải giá trị true/false được bịa ra.

## 2. Baseline và thiết kế

Checkout gốc: `D:/HomeMind/homemind-landing-page-main/homemind-landingpage`, main `c1142d937d8dc962d4b090d36457f012e1be9824`; remote đúng repository. MAIN mới nhất sau fetch: `8a199dd8b96f157ea3680b0389ee356282fe4b0b`, trước 9 commit. Candidate dựa chính MAIN này.

Source: `PricingSection.tsx`, hai route `(legal)`, `LegalDocument.tsx`, `legal-document.module.css`, Container, ThemeButton/AppStoreLink, globals, site config, Footer. Đã đọc AGENTS và tài liệu Next16.4.3 tương ứng. Giữ bảng màu emerald/slate, font Geist, container max7xl, card rounded3xl/p8, Premium highlight, banner Micro-POS và shell/mục lục pháp lý. Không thay CSS toàn cục, hero, điều hướng hay footer. Grid dùng breakpoints hiện hữu để 4 card Free/Premium/Family/Credit chia 1/2/4 cột, Micro-POS vẫn là banner riêng.

Ba URL live đã đọc bằng Chromium GET, HTTP200 ở 1440/390/320px, không lỗi trang hoặc tràn ngang. Web fetch tool không truy cập được nhưng trình duyệt thật truy cập được; không ghi UNVERIFIED_LIVE giả. Ảnh/nội dung live trước và local MAIN trước sửa được lưu ngoài Git. Snapshot chặn các phương thức ghi và không submit form; GET cấu hình popup có thể được đọc, không kiểm chứng nghiệp vụ popup ở đây. Local dev ban đầu dùng webpack vì Turbopack không resolve node_modules junction ngoài root; sau khi materialize dependency, build mặc định Turbopack PASS. Không sửa production bundler/config để né lỗi môi trường.

Baseline có giá năm quy đổi và “tiết kiệm20%” chưa có căn cứ, CTA trả phí có vẻ khả dụng, Privacy còn mô tả PayOS/OTP cũ. Legal version cũ2026.10.11.1, ngày hiệu lực06/10/2026. Bản mới dùng28/10/2026, version2026.10.28.1. Support đã tồn tại: `homemind.support@gmail.com` và Facebook trong siteConfig; không tự tạo pháp nhân/địa chỉ/SLA.

## 3. Catalog, giá và availability

Nguồn: backend `src/iap/iap.domain.ts:7–14`, `iap.config.ts:4–7`; mobile terminal CTA `billing_catalog_page.dart:1008–1010` không gọi buy. Store console/quote/purchase: **EXTERNAL_STORE_UNVERIFIED**.

|SKU|Phạm vi/loại|Chu kỳ|Giá tham khảo VND|Giá Store|
|---|---|---|---:|---|
|personal_month|Premium, household Subscription|Tháng|29.000|Chưa xác minh|
|personal_year|Premium, household Subscription|Năm|Chưa công bố|Chưa xác minh|
|family_month|Family, household Subscription|Tháng|59.000|Chưa xác minh|
|family_year|Family, household Subscription|Năm|Chưa công bố|Chưa xác minh|
|micro_pos_month|Micro-POS, store Subscription|Tháng|149.000|Chưa xác minh|
|micro_pos_year|Micro-POS, store Subscription|Năm|Chưa công bố|Chưa xác minh|
|voice_credit_100|Credit cá nhân, tiêu hao một lần|Không gia hạn|50.000/100|Chưa xác minh|

Free được giữ. Giá tháng được gắn nhãn tham khảo; năm không bịa số hoặc giảm giá. Giá Apple/Google phải được cửa hàng hiển thị/xác nhận khi mở mua. Credit độc lập toggle, không có hậu tố tháng/năm. Mọi CTA trả phí không khởi tạo thanh toán; không thêm PayOS/QR/web checkout/steering.

## 4. Privacy — thay đổi và nguồn kiểm chứng

Giữ điều khoản đúng về hồ sơ, xác thực, kho, AI, tìm kiếm, hoạt động, trẻ em và contact. Bổ sung giao dịch Apple/Google, dữ liệu xác minh, quyền gói, Credit/reservation/revocation, giữ dữ liệu cần đối soát. Tách phương thức thanh toán do Store xử lý khỏi metadata HomeMind lưu; không nói không có dữ liệu tài chính. `iap.crypto.ts:3–5` xác nhận mã hóa proof, không suy mọi DB đều mã hóa.

Nguồn AI: `assistant/planner.ts:79–82,160–179` gửi văn bản/ngày/candidate sản phẩm tới Gemini; `assistant.service.ts:153–163` lưu transcript/kết quả. Speech-to-text dùng OS; không cam kết âm thanh luôn on-device. Không tìm thấy Firebase/Drive/Google Sign-in/advertising SDK trong source hiện hành, không đưa vào danh sách processor. Infobip provider thực ở `src/email/infobip.provider.ts:34–43`, email mode tùy cấu hình; không thử gửi thư. Admin cookie Secure/HttpOnly/SameSite ở `admin.auth.ts:14`; không có cam kết “không cookie/tracking”.

Xóa trong app: `account_settings_page.dart:149–166` → `DELETE /auth/account` → `auth.service.ts:311–328`: đóng tài khoản/thu hồi phiên, chưa purge/ẩn danh PII. SQL close workspace chỉ archive/điều phối ownership. Copy phải nói rõ giới hạn, không bảo đảm xóa toàn bộ tức thì. Kênh ngoài app là mục `#xoa-tai-khoan` + email hỗ trợ hiện hữu; không tạo form giả hoặc gửi email kiểm thử. Thực thi xóa hoàn chỉnh và xử lý request thực tế còn UNVERIFIED, cần task backend/mobile và vận hành riêng. Không công bố thời hạn lưu giữ/SLA pháp lý chưa xác minh.

## 5. Terms — quyền lợi và giới hạn

Subscription tháng/năm theo Store; không cộng30/365ngày, không bịa annual price/discount. Hủy auto-renew, gỡ app và xóa account là ba việc riêng. Hướng dẫn Apple/Google quản lý/hủy và hoàn tiền dùng link chính thức; xóa account không bị điều kiện phải hủy billing trước. Không cấm hoàn mọi trường hợp, không tước quyền người tiêu dùng; không hứa HomeMind tự hoàn tiền hoặc đổi thời gian dư thành Credit.

Credit100, cá nhân, một lần, không gia hạn/hết hạn; không chuyển/rút/đổi thành tiền/trả Subscription. Hạn mức định kỳ đủ điều kiện trước Credit; chỉ dùng theo completion hợp lệ của chức năng. Provider refund/revocation/hold tách khỏi hết hạn subscription. Restore/received/pending không đồng nghĩa đã cấp quyền. Đổi tier/chu kỳ phụ thuộc ma trận nguồn và Store, không hứa immediate mọi trường hợp, không household↔store.

Giữ nguyên điều kiện quà góp ý Premium30ngày và các điều khoản IP, sử dụng hợp lệ, AI, trách nhiệm; không làm lại business logic. Điều khoản OTP cũ được sửa theo email flow đã có, không bảo đảm live delivery.

## 6. Chính sách Apple/Google và submission readiness

Đã đọc ngày28/10/2026, nguồn chính thức:

|Nguồn|Yêu cầu|Disposition|
|---|---|---|
|[Apple Guidelines3.1.1/3.1.2/5.1.1](https://developer.apple.com/app-store/review/guidelines/)|Credit không hết hạn, IAP/ongoing value, privacy/xóa|WEB_COPY_FIXED; app/console chưa chứng nhận|
|[Apple subscription disclosures](https://developer.apple.com/app-store/subscriptions/#clearly-describing-subscriptions)|Tên/kỳ/giá localized/renewal/restore/legal links|Copy khớp; binary paywall UNVERIFIED|
|[Apple subscription groups/levels](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/auto-renewable-subscription-information/)|Chuyển gói phụ thuộc sản phẩm/group|REQUIRES_PRODUCT_CONFIGURATION|
|[Apple account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)|Xóa trong app, đóng băng chưa đủ; billing riêng|SOURCE_CONFIRMED initiation; complete erasure cần backend/mobile follow-up|
|[Google Payments](https://support.google.com/googleplay/android-developer/answer/9858738)|Play Billing, giá thật, không steering trái phép|Không thêm alternative checkout|
|[Google Payments FAQ](https://support.google.com/googleplay/android-developer/answer/10281818)|Help/legal links không thành vòng checkout|WEB_COPY_FIXED|
|[Google subscriptions](https://support.google.com/googleplay/android-developer/answer/9900533)|Ongoing value, minh bạch gia hạn/hủy, one-time không giả recurring|WEB_COPY_FIXED|
|[Google subscription/base-plan FAQ](https://support.google.com/googleplay/android-developer/answer/12154973)|Giá/kỳ/vùng/base-plan|REQUIRES_STORE_CONSOLE|
|[Google User Data](https://support.google.com/googleplay/android-developer/answer/10144311)|Privacy công khaiHTML, data/sharing/retention/deletion|WEB_COPY_FIXED; Data safety console UNVERIFIED|
|[Google deletion FAQ](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)|Trong app + external resource, có thể email support với anchor nổi bật|Web request entry có thật; fulfillment UNVERIFIED|

Apple3.1.1(a) có ngoại lệ US storefront và các chương trình entitlement; Google8–9 có chương trình alternative billing/external offers theo vùng/đăng ký. Không viết lệnh cấm toàn cầu giả; mission vẫn không triển khai đường thanh toán thay thế. Không thay Store console/App Privacy/Data safety.

Checklist độc lập: Credit model SOURCE_CONFIRMED; copy WEB_COPY_FIXED; giá/product/group/basePlan REQUIRES_STORE_CONSOLE/REQUIRES_PRODUCT_CONFIGURATION; actual mobile sign-up disclosures/restore UNVERIFIED; complete deletion REQUIRES_MOBILE_CHANGE + backend follow-up; tên pháp nhân/chính sách retention/đáp ứng yêu cầu dữ liệu cần LEGAL_REVIEW_RECOMMENDED. Điều kiện xử lý của bên thứ ba, bảo vệ dữ liệu tương đương theo Apple5.1.1(i) và thông báo/consent AI cần thiết trong app: UNVERIFIED, cần review cấu hình/hợp đồng và binary riêng. Đây không phải App Review approval. Các gap console không ngăn website thông tin trung thực với checkoutOFF; mọi câu khẳng định sai về live payment/xóa dữ liệu phải sửa trước publish.

## 7. Checklist hữu hạn và QA

Chốt trước sửa: L01Privacy public; L02Terms đúng; L03đúng5offer trong pricing cũ; L04Credit độc lập tháng/năm; L05reference/Store/OFF; L06quyền Credit; L07cancel/refund; L08privacy source; L09links/keyboard/SEO; L10visual1440/390/320 +200%text và dark preference; L11lint/typecheck/build/focused tests; L12bảo toànsource; L13mộtdeploy/exactSHA/public3URL; L14originalzeroentries.

Đã thu thập lỗi độc lập, sửa theo nhóm rồi chỉ chạy lại phần lỗi hoặc bị thay đổi tác động. Batch đầu có 2 unit test chương trình PASS; browser có 7 PASS, 3 FAIL và 4 SKIP. Ba lỗi cùng do expectation harness: Next chuẩn hóa canonical homepage thành `https://homemind.vn` không có dấu `/` cuối. Delta đầu có 7 PASS, 1 FAIL và 4 SKIP: ký tự `đ` trong assertion mới bị PowerShell pipe chuyển thành `?`. Đã sửa file UTF-8 bằng patch, không sửa giá sản phẩm. Một lệnh npx grep cũng lỗi quoting trước khi test chạy; gọi trực tiếp Node CLI giải quyết lỗi harness. Mọi log/trace lỗi được giữ ngoài Git.

Review độc lập đã làm rõ cách gửi yêu cầu xóa và phân biệt mua thêm Credit với khôi phục. Kiểm tra chữ 200% cuối cùng PASS, gồm assertion giá vẫn nằm trong card. Regression brand có 2 lỗi trên dev do các request RSC prefetch bị hủy khi điều hướng; 9 viewport test khác PASS. Không nới assertion: chạy lại đúng hai case trên bản production build đều PASS.

| Kiểm tra local cuối | Kết quả | Evidence ngoài Git |
|---|---|---|
| Credit, toggle, disabled CTA, nội dung Privacy/Terms, SEO, keyboard, 1440/390/320, chữ200%/dark preference | 10 case duy nhất PASS; 4 duplicate matrix mobile SKIP có chủ đích | browser-initial.log, browser-delta-corrected.log, browser-delta-final.log |
| Brand/legal navigation và responsive giữ thiết kế cũ | 11 case PASS; 9 viewport duplicate mobile SKIP | brand-legal-regression.log và brand-production-delta.log |
| Điều kiện quà góp ý giữ nguyên | 2 PASS, hash section lấy độc lập từ MAIN trước sửa | legal-unit-initial.log |
| Admin legal regression theo cách diễn đạt mới | 1 PASS local, giữ và mở rộng7assertion; không chạy lại11case admin không đổi | admin-legal-delta.log; tổng local24case duy nhất PASS |
| ESLint | Exit0; 0 lỗi, 5 cảnh báo img có sẵn ngoài phạm vi | lint-initial.log, lint-delta.log |
| Next typegen + TypeScript | Exit0 | typecheck.log |
| Next16.4.3 production build mặc định Turbopack | Exit0, 19,88 giây; ba route public được prerender | production-build.log |
| Gitleaks8.30.1 lịch sử | Exit0, 30 commit, không phát hiện leak | gitleaks-history-before.log |
| Bảo toàn local và diff | Ledger70 file/checksum, diff check PASS | baseline.json, reconciliation-ledger.json |

Ảnh trước/sau đã mở xem: pricing desktop và mobile, legal desktop/narrow; ảnh 1440/390/320 và toàn bộ nội dung text được lưu trong `live-before`, `local-before`, `local-after`. Bản light theme hiện hữu được giữ cả khi browser đặt dark preference. Không đổi CSS toàn cục. Node_modules đã được materialize bằng hardlink cùng ổ D từ bộ dependency đúng lockfile để build mặc định không còn lỗi junction ngoài root; không nâng dependency. Production build và test trên server local không phải signed mobile build hay sandbox Store.

Không chạy toàn bộ HomeMind, Native, Gemini, Store sandbox hoặc giao dịch thật. Web tests không chứng minh Store approval hoặc việc xóa dữ liệu trong mobile đã hoàn chỉnh.

## 8. Git reconciliation và bảo toàn local

Recovery private ngoài Git: `D:/HomeMind_Recovery/landing-legal-credit-20261028T030619Z/private`. Snapshot70file/checksum, index, staged/unstaged binary patches, branch/refs/status/worktree được giữ trước fetch. Original71porcelainentries; một file chỉ stat/index freshness,70file có nội dung cần đối chiếu.

55 file là `ALREADY_REMOTE` sau chuẩn hóa newline; 7 file đã publish nhưng được main mới thay thế (Next16.3.8→16.4.3, Terms, Hero/AppStoreLink, admin Store nav/client, tests). Mỗi file trong nhóm7 có commit tổ tiên khớp nội dung, được ghi trong ledger; không replay bản cũ đè main. 8 file chỉ có instruction/receipt lịch sử local được `RETAINED_SEPARATELY_WITH_OWNER` trong snapshot nguyên byte: CLAUDE.md; CodeX popup receipt; hai feedback implementation/test reports có appendix local; bốn markdowns deployment receipts. Không publish tài liệu lịch sử không liên quan. Không có runtime hunk chưa publish bị loại bỏ. Original giữ nguyên tới bước đồng bộ cuối có kiểm chứng.

Thủ tục sync đã review: kiểm lại toàn bộ hash/index; chuyển đúng52 file untracked ban đầu vào thư mục bảo toàn ngoài Git có manifest; khôi phục base chỉ với18 file tracked đã đối chiếu từng path, rồi fast-forward main theo Git. Không reset/clean/stash/force hoặc ghi đè file chưa xác minh. Những receipt riêng tiếp tục được giữ ngoài release thay vì đưa tài liệu lịch sử vào MAIN.

Branch protection API404, rulesets/environments rỗng tại discovery; vẫn dùng featurebranch→PR→checks→merge thường, không directmain/admin/force. Không PR active/không release đang chạy. MAIN push tựdeploy, concurrency không cancel; không dispatch bổ sung. Ngoại lệ local-only PR3 cũ không áp dụng release mới; giữ mọi normal CI/security/smoke/rollback.

## 9. Build/deploy và vận hành

Next standalone, legal/pricing prerender; metadata/canonical/robots/sitemap được kiểm. Không sửa runtime env/infra/backendmigration. Local build và CI phải PASS trước main publication. VPS controller dùng immutable digest, stale-main guard, blue/green, protected backend/files, public acceptance và rollback; không tắt gate.

Candidate đầu `c215df5a7cb699d04c30b94f56430ebbb5ceb616` đã push, staged/outgoing Gitleaks PASS. [PR4](https://github.com/PRM392-HOMEMIND/homemind_landingpage/pull/4), branch `feat/landing-legal-credit-20261028`, đúng base MAIN8a199dd. [PR CI đầu40628171738](https://github.com/PRM392-HOMEMIND/homemind_landingpage/actions/runs/40628171738) FAIL ở một admin legal unit test yêu cầu nguyên văn câu cũ. npmci/audit0vulnerability/contract và11admin tests trước đó PASS. Nội dung mới vẫn có các bất biến nhưng cách diễn đạt thay đổi theo yêu cầu legal copy. Sửa đúng test liên quan:7assertion giữ no-wallet/no-time-to-Credit, Store/statutory refunds, paid-unfulfilled support, checkoutOFF và không khôi phục lại Credit đã dùng; không tắt gate hoặc đổi sản phẩm để ép câu cũ. Log lỗi đầy đủ được giữ ngoàiGit. Chỉ test và báo cáo đổi sau candidate đầu; build/runtime QA hợp lệ được giữ. Legal test mới PASS2,06giây và ESLint file đó exit0. Không gọi CI cũ là PASS; revision sửa vẫn phải đạt normal CI.

PR4 revision `2e1e7dfcdfae8cb3d20b6495c62815a962b5f5a7` đạt normal CI40628598667:12admin unit PASS,28deployment tests PASS,73browser PASS/29duplicate SKIP. Merge thường thành MAIN `31911e89cee97433a39dbe70e87ea3a2ed5e1d3b` lúc03:53:30UTC28/10. Không admin/force/bypass hoặc gia hạn ngoại lệ PR3.

**Lượt deploy đầu không hoàn tất.** [MAIN run40629230983](https://github.com/PRM392-HOMEMIND/homemind_landingpage/actions/runs/40629230983) build/security/image checks PASS; VPS đã chạy candidate31911e8, nhưng public browser acceptance có68PASS/5FAIL/29SKIP. Cả5FAIL là assertion focus trong test mới: dùng `.focus()` rồi đòi `:focus-visible` sau khi popup thật được đóng bằng chuột. Workflow tự rollback thành công lúc04:09:47UTC về `8a199dd8b96f157ea3680b0389ee356282fe4b0b`, digest `sha256:2c844324af48eb68bf300fd3d9c3d8f8a73debe1e9d04f6543597e247969d16c`. Root observation xác nhận bản cũ healthy, backend/config bảo vệ không đổi. Các ảnh/HTTP200 của31911e8 trước rollback là evidence tạm thời, không phải production final.

Đã tái hiện đúng lỗi trên local production build với fixture bật popup: case cũ FAIL, không gọi provider. Probe độc lập ghi nhận sau pointer + programmatic focus: focused=true, focusVisible=false, outline=none; sau Shift+Tab/Tab: focused=true, focusVisible=true, outline=solid. Đây là khác biệt modality của harness, không phải thiếu CSS. Sửa test dùng bàn phím thật, bổ sung `toBeFocused`, giữ nguyên mọi assertion viền và nghiệp vụ. Không sửa CSS/runtime hoặc bỏ accessibility gate. Evidence: `focus-repro-red.log`, `focus-modality-proof.json`, full MAIN log/artifact. Delta local:5case PASS với popup enabled(20,24giây), cùng5case PASS với popup disabled(19,49giây); mỗi lượt có3matrix mobile duplicate SKIP. ESLint file và TypeScript exit0. Các test/runtime build không bị thay đổi được giữ bằng chứng, không chạy lại toàn nền tảng. Independent QA APPROVED_SCOPED; helper kiểm focus bằng bàn phím tại control cần xét, không tự nhận đã audit toàn bộ tab-order của trang.

Correction branch từ MAIN31911e8: `fix/landing-keyboard-acceptance-20261028`. Chỉ test và báo cáo thay đổi. Cần PR/checks bình thường rồi mới release correction; không dispatch deploy trùng với MAIN auto-deploy. Không được ghi lượt đầu là SUCCESS hoặc nói không có rollback. Kết quả cuối phải nêu số lần thử thực tế, gồm lượt lỗi/rollback này; receipt sau correction không được tái sử dụng ảnh/health tạm thời làm final proof.

Sau publish, cập nhật receipt trong thư mục recovery nói trên: `RELEASE_RECEIPT.json`, snapshot live, kết quả VPS và sync original. Receipt được liên kết từ PR/final response; không có report-only source push kích hoạt deploy lần hai. Báo cáo tracked này là checkpoint đã kiểm chứng trước merge, còn receipt là phần vận hành sau merge.

## 10. Đồng bộ gốc và giới hạn cuối

Original main phải FF tới MAIN đã publish sau khi mọi legitimate local work được đối chiếu/bảo toàn. Kiểm cuối bắt buộc porcelainv2/alluntracked zeroentries, nothingtocommit, upstreamuptodate và taskblob khớpmain. Tại checkpoint này bước cuối chưa thực hiện, không claim LOCAL_SYNC_COMPLETE. Store approval/purchase/refund/mobile release không thuộc scope; toàn bộ checkout vẫnOFF.

## 11. Bổ sung giá tham khảo năm theo xác nhận owner — 28/10/2026

Đây là release riêng của `PRM392-HOMEMIND/homemind_landingpage`, không mang source AI quản gia đang phát triển ở repository HomeMind. Original checkout trước sửa sạch tại MAIN `25117b9fec5bc76a7e59703ec6dbbb1bd35a9c8a`, trùng origin/main sau fetch. Branch protection API trả404 và rulesets rỗng; vẫn dùng PR checks thông thường trước merge, không mở rộng ngoại lệ local-only của PR3. MAIN push tự chạy build/deploy hiện có, không dispatch trùng.

| Gói | Tháng giữ nguyên | Năm owner xác nhận |
|---|---:|---:|
| Premium | 29.000đ | 299.000đ |
| Family | 59.000đ | 649.000đ |
| Micro-POS | 149.000đ | 1.499.000đ |

Giá năm hiển thị là tổng tham khảo cho một năm, không quy đổi theo tháng hoặc cam kết giảm20%. Free0đ và Credit50.000đ/100Credit mua một lần giữ nguyên trong cả hai lựa chọn. Mọi CTA trả phí tiếp tục disabled; không thay Store console, checkout, quota, payment logic hoặc backend. Điều khoản thay đúng câu giá năm chưa công bố bằng các mức đã xác nhận và giải thích tổng phí năm; điều kiện Store/gia hạn/hủy/quyền lợi cũ giữ nguyên. Privacy không có mâu thuẫn về giá nên không sửa.

Đã đọc hướng dẫn Next16.4.3 trong dependency đang dùng. Prerequisite local ban đầu thiếu đúng ba dependency đã khóa; chỉ khôi phục bản cùng version từ ổD vào node_modules thật của Landing, không sửa package/lock/AGENTS. Browser500 ban đầu và pricing RED sau phục hồi đều giữ ngoàiGit. Không gọi API mutation, email, Gemini hoặc payment khi kiểm UI.

Focused browser qualification:9 ca duy nhất PASS (2 tương tác giá/Credit,2 Terms,5 mẫu responsive1440/390/320 và390/320 chữ200%);5 lượt matrix mobile trùng được SKIP có lý do, không tính PASS. TypeScript và ESLint file liên quan exit0. Phát hiện tràn giá ở320px/chữ200%, rồi phát hiện generic wrap cắt giữa nhóm chữ số; đã sửa chỉ price container và dùng điểm ngắt giữa nhóm hàng nghìn. Giữ exact accessible amount string. Root đã mở ảnh desktop và hai card320/chữ200%; giá nằm trong card. Đây là browser evidence, không Store purchase hoặc mobile binary proof.

Đã đối chiếu lại Apple App Review3.1.2(c), Google Payments và Subscriptions về mô tả đúng giá/kỳ/quyền lợi; website tiếp tục ghi giá tham khảo khác giá cửa hàng thực tế khi mở mua. Không có cam kết App Review approval.

Nguồn policy: https://developer.apple.com/app-store/review/guidelines/ ; https://support.google.com/googleplay/android-developer/answer/9858738 ; https://support.google.com/googleplay/android-developer/answer/9900533 .

Tại checkpoint trước commit này, staged/outgoing scans, PR CI, MAIN CI/deploy và final original sync còn PENDING. Sau merge, ghi receipt vận hành ngoàiGit tại `D:/HomeMind_Recovery/landing-annual-pricing-20261028` để không tạo report-only push/deploy thứ hai. Evidence code/tests ở `D:/HomeMind_Recovery/ai-household-20261028T050518Z/private/resume-20261028T120207Z/landing-annual-pricing/qualified-receipt.json`.
