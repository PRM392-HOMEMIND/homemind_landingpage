# HOMEMIND — BÁO CÁO KHẮC PHỤC NỘI DUNG PHÁP LÝ LANDING PAGE

Ngày thực hiện: **06/10/2026, Asia/Saigon (UTC+7)**. Source chỉ sửa hai trang pháp lý, metadata/mục lục và browser test cần thiết. Có cập nhật baseline runtime của deployment landing trên VPS để xử lý lỗi hạ tầng đã xác minh, như §16; không đổi source/workflow/controller hoặc runtime backend. Báo cáo sử dụng thư mục `markdowns/` đang chứa các audit/runbook của landing page; không tạo cây `docs/audit/` trùng.

## 1. Repository, branch và HEAD baseline

- Repository: `D:\HomeMind\homemind-landing-page-main\homemind-landingpage`.
- Remote: `PRM392-HOMEMIND/homemind_landingpage`; branch `main`.
- HEAD ban đầu: `ecb4589aef4194bcb104414f8b3c6ab9c5920e6b`.
- GitHub main ban đầu trùng local; `protected:false`, không có ruleset áp dụng cho main. Workflow đang dùng push main trực tiếp và tự deploy.
- Bốn tài liệu deployment có thay đổi từ trước: `HOMEMIND_LANDINGPAGE_DEPLOYMENT_PLAN.md`, `HOMEMIND_LANDINGPAGE_DEPLOYMENT_REPORT_VI.md`, `HOMEMIND_LANDINGPAGE_RUNBOOK_VI.md`, `HOMEMIND_LANDINGPAGE_VPS_AUDIT.md`. `AGENTS.md` và `CLAUDE.md` đã untracked. Giữ nguyên các file này, không stage.
- Đọc hướng dẫn Next.js 16.3.1 tại `node_modules/next/dist/docs/` về pages/layouts, metadata, server/client components và deployment trước khi sửa tương ứng.

## 2. Hai audit đã đọc

Đọc đầy đủ **698 dòng** `HOMEMIND_GOOGLE_PLAY_READINESS_AUDIT_VI.md` và **619 dòng** `HOMEMIND_LEGAL_POLICY_ALIGNMENT_AUDIT_VI.md`, tại `D:\HomeMind\HomeMind-GitHub\docs\audit\`.

Dùng các báo cáo như bằng chứng và khuyến nghị tại thời điểm audit, không áp dụng các hạn chế “không sửa/push/deploy” của lượt audit cũ để thay thế yêu cầu remediation hiện tại. Không thay đổi các audit nguồn. Play audit còn ba nhóm P0; legal alignment audit ghi thiếu disclosure, không xác nhận các lời hứa sai tuyệt đối từng tồn tại trên website.

## 3. Trang live trước sửa

Đọc mới toàn bộ text bằng HTTPS GET có kiểm tra TLS mặc định, cả hai URL HTTP **200**, không redirect sang URL khác:

- [Privacy](https://homemind.vn/privacy-policy): title `Chính sách bảo mật | HomeMind`, 12 section, chưa hiển thị effective/update/version.
- [Terms](https://homemind.vn/terms-of-service): title `Điều khoản sử dụng | HomeMind`, 13 section, nội dung gói/thanh toán còn khái quát.

Đã mở cả ba trang `/`, `/privacy-policy`, `/terms-of-service` bằng Chromium ở 390 và 1440 px, lưu baseline ngoài Git để đối chiếu. Web reader không truy cập được domain này; HTTPS GET và Chromium trực tiếp hoạt động. CUA không có browser khả dụng; dùng Playwright của repository cho kiểm tra website.

## 4. Facts sản phẩm đã dùng

Application reference HEAD: `d9981c594c26eed89aa154757c53e6fab2098eb8`. Worktree ứng dụng đang có thay đổi từ công việc riêng; không chạm hoặc stage các thay đổi đó, không suy rằng chúng đã được triển khai.

Đọc read-only source: fixed-period billing và assistant-quota migrations; plan guard; assistant service và planner; PayOS provider và billing service; auth closure và reset-delivery service; native speech recognition; search và notifications services. Kiểm tra support ở `src/config/site.ts` và demo câu mẫu ở `InteractiveShowcase.tsx` của landing page.

| Gói | Không gian | Giá đang cấu hình | Sản phẩm hoạt động | Lượt trợ lý/kỳ | Truy cập |
|---|---|---:|---:|---:|---|
| Free | Hộ gia đình/cửa hàng | 0 | 30 | 15 | Không có paid expiry; quota theo chu kỳ cố định 30 ngày |
| Personal | Hộ gia đình | 29.000 VNĐ | Không giới hạn theo guard hiện tại | 60 | 2.592.000 giây từ kích hoạt |
| Family | Hộ gia đình | 59.000 VNĐ | Không giới hạn theo guard hiện tại | 100 | 2.592.000 giây từ kích hoạt |
| Micro POS | Cửa hàng | 149.000 VNĐ | 500 | 200 | 2.592.000 giây từ kích hoạt |

Quota dùng chung workspace; valid read/draft/clarify/out-of-scope response tính một lượt, failed generation không có valid result không commit lượt. Confirm/cancel không tính lượt nữa; cancel không hoàn lượt đã dùng. Replay cùng yêu cầu không charge thêm. Upgrade thu đủ giá/new period, không prorate/carry; active same-plan và downgrade bị chặn; expiry về Free không tự xóa dữ liệu. Catalog tại lúc mua là nguồn giá áp dụng; giao dịch lịch sử theo điều kiện đã ghi nhận.

## 5. Quyết định tương lai của owner

- Chính sách xóa/ẩn danh là **TARGET**, đang chuẩn bị hoàn thiện. Source closure hiện vẫn chủ yếu đổi trạng thái/revoke; không gọi complete erasure.
- Google Play theo hướng consumption-only cho quyền số thanh toán PayOS bên ngoài; hoàn thiện chặn payment instructions là task mobile/distribution riêng.
- OTP email/SMS chỉ mô tả khi được hỗ trợ/kích hoạt; chưa là tính năng production hoàn chỉnh.

Không viết các quyết định này thành tính năng đã hoàn tất, không sửa app/backend để làm khớp copy.

## 6. Thay đổi Terms

17 section giữ các anchor cũ. Bổ sung plan limits/giá đủ điều kiện/fixed 30 ngày, quota workspace, valid request và cancel/replay/failure, mua/nâng gói/full-price/no carry/no downgrade/no active same-plan, fallback Free, chưa có yearly/auto-renew/automatic refund. Phân tách payment và fulfillment; mô tả kênh phân phối, xác minh máy chủ, manual status refresh. Giữ trách nhiệm tài khoản, content rights, giới hạn AI và quyền bắt buộc người tiêu dùng.

## 7. Thay đổi Privacy

18 section giữ toàn bộ anchor cũ. Cụ thể hóa account/profile/login-contact phone/password một chiều/session/IP/User-Agent; inventory/shopping/shared membership; AI; payment; search; notifications; support; retention groups. Tách microphone, OS speech service, transcript, HomeMind backend và Gemini. Thêm OTP tương lai và deactivate/delete target.

## 8. OTP dự kiến

Terms §3 và Privacy §9 nêu conditional email/SMS cho đăng ký, reset/recovery, xác minh email/phone, đổi login identifier và sensitive security action. Khi bật có thể xử lý contact, thông tin mã, lần thử/trạng thái và anti-abuse metadata. Không xác nhận vendor, delivery guarantee hoặc OTP ở mọi đăng ký. **OTP_IMPLEMENTED: NO.**

## 9. Gemini disclosure

Privacy §4 mô tả Google Gemini nhận typed/recognized text, bounded product identifiers/name/unit/date context; text do user nhập có thể chứa PII. Không chủ động gửi password/auth token/raw microphone payload qua flow hiện tại. HomeMind có thể lưu input/structured output/draft/message/quota/confirmed actions; cần user review và confirmation trước write.

Đã đọc [Gemini API terms](https://ai.google.dev/gemini-api/terms) ngày 06/10/2026. Điều kiện Google khác theo dịch vụ/cấu hình; chưa xác minh tier/contract riêng của HomeMind. Không cam kết no-training, zero retention, Vietnam-only, ephemeral hoặc DPA/data residency riêng. Điều kiện tuổi/audience/provider vẫn cần owner/legal đánh giá; task này không đổi target audience hoặc thêm age verification.

## 10. PayOS disclosure

Terms §11, Privacy §6 mô tả outbound order code/amount/description/return-cancel URL/expiry và dữ liệu nhận/lưu link/QR/recipient bank/payment state/amount/reference/timestamps/entitlement. Buyer email/phone/profile không được thêm trong create flow đã đọc. Merchant recipient bank không tự là bank của user. Provider/browser áp dụng điều kiện riêng.

Tạo đơn/quét QR/browser return không chứng minh paid; phải verified payment và valid fulfillment. Pending/cancelled/expired/review/paid khác nhau. Unpaid window và cancel không phải refund. Server verification có thể tiếp tục; client có thể cần manual refresh. Không nêu secrets hoặc nội bộ xác minh. Google Play wording dựa owner target và [Payments FAQ](https://support.google.com/googleplay/android-developer/answer/10281818), không tuyên bố bản Play hiện hỗ trợ PayOS in-app hoặc mọi hạn chế đã hoàn tất.

## 11. Retention và xóa mục tiêu

Privacy §§12–15 và Terms §15 phân biệt vô hiệu hóa giữ dữ liệu với permanent closure/xóa-ẩn danh mục tiêu. Khi target deletion hoàn tất: terminate access/revoke sessions, erase/anonymize identifiers/profile/private unneeded data/assistant-activity; shared data có thể giữ cho members và anonymize attribution. Retained payment/fraud/dispute/accounting/security/legal records được minimize/separate identity khi hợp lý. Encrypted backup cũ có thể tạm còn đến normal rotation. Không hứa tức thì mọi byte hoặc invent ngày retention. Xóa không tự hoàn tiền. Nêu rõ closure hiện tại chưa chứng minh full erasure.

Source backup có rotation cấu hình nhưng chưa xác minh operational execution trong task này; không đưa con số source thành cam kết công khai. Không triển khai deletion hoặc đọc/sửa DB.

## 12. Search và notifications

Search query đến backend, results theo quyền, indexes/projections phục vụ authorized data; chưa có persistent personal search-history feature, không nói query never logged. Notifications gồm account/login/security/profile/inventory/shopping/payment/expiry/quota; title/summary/detail/type/recipient/reference/timing/read state theo recipient rights. In-app bell không được gọi là Android push/FCM.

## 13. Effective date/version và kiểm tra nội dung

Cả hai trang: ngày hiệu lực **06/10/2026**, cập nhật **06/10/2026**, phiên bản **2026.10.06.1**. `policyDate` hiện cũng cập nhật lastModified của legal URLs qua sitemap đang có.

Đọc lại đầy đủ text hai trang local (18/17 section) sau render, so với cả hai audit, current source facts và owner decisions. PASS nghĩa copy đáp ứng task alignment, không chứng nhận luật sư hoặc Google Play approval.

| Nội dung | Kết quả | Vị trí/bằng chứng |
|---|---|---|
| PLAN RULES | PASS | Terms §§9–10; 30 ngày = 2.592.000 giây, đủ limits/prices/eligibility |
| QUOTA RULES | PASS | Terms §7; workspace, typed/voice, valid response, cancel/replay/errors/no carry |
| PAYMENT/PAYOS | PASS | Terms §11, Privacy §6; verify/fulfillment/status/cancel-refund/data |
| GOOGLE PLAY CHANNEL | PASS | Terms §12; kênh/nền tảng/khu vực/version và target chưa hoàn thiện |
| OTP FUTURE WORDING | PASS | Terms §3, Privacy §9; chỉ future/conditional |
| GEMINI | PASS | Privacy §4; text/context/persistence và provider unknowns |
| MICROPHONE/STT | PASS | Privacy §3; OS audio vs backend/Gemini transcript |
| SEARCH | PASS | Privacy §7; authorized index, không invent history/never-log |
| NOTIFICATIONS | PASS | Privacy §8; durable in-app recipients/read-state, không push claim |
| ACCOUNT DELETION TARGET POLICY | PASS | Privacy §14, Terms §15; current vs target được phân biệt |
| RETENTION | PASS | Privacy §12; đủ categories/necessary exceptions/backups, không invented days |
| SUPPORT | PASS | `homemind.support@gmail.com` trùng config, không SLA/auto-refund promise |
| EFFECTIVE DATE/VERSION | PASS | Metadata đầu cả hai trang và semantic time elements |

## 14. File thay đổi và thiết kế

- `src/app/(legal)/privacy-policy/page.tsx`.
- `src/app/(legal)/terms-of-service/page.tsx`.
- `src/components/legal/LegalDocument.tsx`: metadata và tái sử dụng mục lục.
- `src/components/legal/LegalContents.tsx`: cùng markup/classes mục lục; dùng điều hướng fragment native trong capture phase để tránh sai vị trí cuộn trên trang dài ở mobile.
- `tests/browser/brand-legal.spec.ts`: cập nhật expectations metadata và kiểm fragment deletion URL.
- `markdowns/HOMEMIND_LEGAL_CONTENT_REMEDIATION_REPORT_VI.md`: báo cáo duy nhất.

Không đổi source homepage/navbar/footer/global CSS/provider/config/workflow/assets. Giữ green/mint/navy, typography, container/max-width, section/card classes, spacing và responsive layout. Các URL pháp lý và `#xoa-tai-khoan`, cũng như mọi anchor cũ, được giữ.

## 15. Local checks/build

| Kiểm tra trên batch nội dung cuối | Kết quả |
|---|---|
| `npm ci --no-audit --no-fund` | PASS; package/lock không thay đổi |
| `npm run lint` | PASS; 0 errors, 5 cảnh báo `img` sẵn có tại Hero/Testimonials |
| `npm run typecheck` | PASS; Next type generation và TypeScript |
| `npm run test:deploy` | PASS; 22 bài kiểm tra hiện có |
| `npm run build` | PASS; production standalone, 8 routes tạo thành công |
| `bash deploy/secret-scan.sh` | PASS; history/worktree, 0 leak |
| `npm run test:smoke -- --reporter=list --output <TEMP>` | PASS; 31 passed, 25 skipped có chủ đích trong cấu hình mobile trùng viewport/landscape; không có failed test |
| Full-content/layout verification bổ sung | PASS; `/`, Privacy, Terms ở 390/1440 px, 6 cases HTTP200; 0 overflow/JS errors, title/version/metadata/links/anchors đúng |

Bộ smoke hiện có kiểm tra responsive tại 320, 360, 390, 768, 1024, 1280, 1440 và 1920 px; desktop/mobile navigation, keyboard menu, assets/favicon, simulator và FAQ. So sánh toàn bộ homepage main/header/footer với baseline cho thấy nội dung không đổi; mọi anchor cũ còn tồn tại. Mở trực tiếp URL local `privacy-policy#xoa-tai-khoan` và canonical hai trang cũng PASS ở 390/1440 px. Kiểm tra SHA256 các file từ baseline xác nhận ngoài bốn file existing legal/test được chủ ý sửa, các file có sẵn khác (kể cả tài liệu owner đang sửa) giữ nguyên bytes. Đọc lại đầy đủ hai trang legal sau render và kiểm tra ảnh metadata/plan/deletion trên desktop/mobile.

Evidence/raw logs/screenshots chỉ lưu ngoài Git tại `C:\Users\phuck\AppData\Local\Temp\homemind-legal-remediation-kirgv05q`. Không thêm test cho Flutter/backend. Không gọi 25 tests skipped là passed.

Sự cố kiểm tra đã ghi nhận: script bằng chứng tạm trong `test-results/` bị Playwright dọn, khiến giá trị đường dẫn rỗng; một lệnh stop-process khớp quá rộng đã dừng các tiến trình Node cục bộ và ngắt lượt test. Riêng sự cố cục bộ này không có thao tác VPS hoặc thay đổi source app/backend/database. Đã chuyển evidence/script ra TEMP, dùng kiểm tra identity/PID chính xác cho landing server và chạy lại verification. Các tiến trình Node ngoài landing nếu đã chạy cần được chủ tiến trình khởi động lại bằng quy trình riêng; không tự khởi động backend trong task này.

Lượt lint ban đầu thấy script tạm rồi artifacts Playwright vì cấu hình ESLint hiện không ignore output folders; đã chuyển artifacts ra ngoài repo, không đổi lint/workflow để bỏ lỗi. Một build trong lúc standalone local server đang chạy gặp EBUSY; dừng đúng server trước rebuild giải quyết. Lượt browser giữa sửa anchor/build bị gián đoạn không được tính PASS. Lỗi mobile anchor trên nội dung dài đã tái hiện; regression được xử lý riêng trong legal contents, không tắt assertion.

## 16. Git và CI

Commit nội dung: `d07777d4c1159af5dd9c0348b740a064563e60cb`, thông điệp `fix(legal): align HomeMind terms and privacy with product policies`. Push bình thường từ baseline lên `main`, không thay protection. Đã review staged names/diff và `git diff --cached --check`; batch chứa đúng 5 file source/component/browser test.

[Pipeline nội dung 37443341771](https://github.com/PRM392-HOMEMIND/homemind_landingpage/actions/runs/37443341771): **Kết quả cuối: PASS**, attempt 3 completed/success, cả build và deploy success. Lịch sử: build PASS, deploy FAIL ở attempt 1 và attempt 2 (rerun failed job bằng quy trình Actions bình thường). Remote step trả `docker operation failed or timed out` sau khoảng 3 giây; public acceptance skipped vì deploy failed, không gọi skipped là PASS. Chẩn đoán SSH read-only xác nhận baseline landing giữ hai container ID cũ ngày 04/10 đã không còn. Backend API/DB được workflow ứng dụng riêng [37411366701](https://github.com/PRM392-HOMEMIND/homemind_backend/actions/runs/37411366701) deploy thành công ở revision `d9981c594c26eed89aa154757c53e6fab2098eb8` ngày 06/10; cả hai healthy, image provenance đúng. Không tính release backend riêng đó là thao tác của task này.

Sửa hạ tầng tối thiểu theo runbook: khóa deployment landing, verify revision/runtime/network/restart policy cùng toàn bộ protected files/systemd/HTTP observations, backup `/var/backups/homemind-landingpage-baseline-before-backend-d9981c5-20261006.json`, atomic update đúng bốn trường ID/StartedAt trong `/etc/homemind-landingpage.json`. Không bỏ guard, không sửa controller, không deploy/restart backend hoặc DB. Hash config trước `5f7b076a4f4f8d108e4704d13df150e29bc311e4a8962cf911a8a11b58ad2c6a`, sau `2874e2b39579172f903f0f65b501e04c830c6c193db10978ddf6e773e2c84988`; tất cả guard kiểm chứng PASS với candidate baseline trước ghi và baseline mới sau ghi; current landing smoke PASS. Controller hash giữ `f0cae86edce3e3f69e292edea344b71b3e8f87a38c400cf58b2de8f6afa643ed`. Chạy deploy ở attempt 3 (lần rerun failed job thứ hai), cùng image đã được build/test/publish; **attempt 3 PASS**: remote rollout và Public HTTPS release/browser acceptance success; 31 browser tests passed, 25 intentional skips. Rollback public acceptance không cần chạy (conditional skipped, không gọi là PASS).

Root credential đi qua masked stdin, chỉ nằm trong RAM phiên SSH; không ghi vào script/file/log/argv. Raw evidence đã lưu ngoài Git.

Báo cáo được chốt sau khi release nội dung được kiểm chứng, rồi xuất bản bằng commit chỉ tài liệu tiếp theo. Commit tài liệu không đổi source/test của ứng dụng landing page; workflow vẫn xây artifact và gắn release SHA tương ứng. CI/CD của HEAD cuối phải được theo dõi đến hết trước khi kết thúc task. SHA tự tham chiếu của commit chứa báo cáo không được điền đoán trước; tra `git log -- markdowns/HOMEMIND_LEGAL_CONTENT_REMEDIATION_REPORT_VI.md` để lấy chính xác.

Chỉ stage explicit landing legal files/tests và báo cáo này; không stage `.env`, owner changes, screenshots/raw logs hoặc application reference source. Không force push, admin override, sửa protection, disable CI hoặc thay workflow.

## 17. Deployment

**PASS** qua workflow tự động của main, sau build/source/image gates đã success. Commit nội dung `d07777d4c1159af5dd9c0348b740a064563e60cb`; exact image `ghcr.io/prm392-homemind/homemind-landingpage@sha256:d800af4774c0df3efb605e56b3bd1be3e091049e40c26e577fd5271d4d7bb11d`, active slot blue/3100. Controller trả PASSED, public health cùng SHA và Actions public browser acceptance success. Không cần rollback. Các retry là retry failed job bình thường để giải quyết lỗi đã xác minh, không phải thêm manual deployment sau lần automatic success.

So sánh evidence SSH trước và sau rollout: toàn bộ selected backend runtime API/DB (ID/StartedAt/image/network/health) bằng nhau; protected guards/capacity/proxy check PASS. Runtime/backend source/DB/config của ứng dụng không bị thay đổi bởi task này. Sửa baseline landing đã mô tả rõ ở §16; không sửa file audit/runbook của owner đang dirty.

Dùng workflow `Deploy HomeMind landing page`: build/source tests/secret scan/controller/image browser checks phải success trước deploy exact private image digest. Job deploy tự chạy và có public acceptance/conditional rollback. Không deploy thủ công lần hai, không SSH hot-edit HTML, không deploy API/mobile, restart API, chạy migrations hoặc đổi PayOS/Gemini env.

## 18. Live verification

PASS sau rollout nội dung: HTTPS GET `/healthz` lúc `2026-10-06T09:45:54Z` trả 200, `release=d07777d4c1159af5dd9c0348b740a064563e60cb`. Đã mở mới `/`, `/privacy-policy`, `/terms-of-service` bằng Chromium tại 390/1440 px, đủ 6 cases HTTP200 và không JS errors/overflow. Privacy có 18 section, Terms 17; title và canonical đúng, hai ngày `06/10/2026` cùng version `2026.10.06.1` hiển thị đúng.

Đã **đọc lại toàn bộ** text Privacy và Terms lấy từ live sau deploy; toàn bộ article của cả hai viewport bằng chính xác bản local đã re-audit. Ma trận §13 vẫn PASS cho plan/fixed 30 ngày/quota/PayOS/kênh/OTP future/Gemini/mic/search/notifications/delete target/retention/support. Mọi anchor cũ và TOC hợp lệ. Mở trực tiếp `https://homemind.vn/privacy-policy#xoa-tai-khoan` ở hai viewport PASS, heading hiển thị; canonical của cả hai legal URL đúng.

So toàn bộ homepage main/header/footer với baseline: bằng nhau. Đã kiểm tra ảnh live đầu trang mobile Privacy/desktop Terms và section xóa mobile: metadata đọc được, green/mint/navy/type/container/menu và section styling giữ nguyên. Không dùng kết luận CI thay cho đọc live. Evidence ngoài Git: `live-verification.json`, `live-direct-anchor.json`, full text và screenshots.

Yêu cầu chốt: HTTPS200/title/canonical, metadata mới, toàn bộ text trùng local đã review, content matrix, deletion anchor, desktop/mobile no overflow, navigation và homepage/header/footer không regression. Không dùng CI xanh thay cho đọc live.

## 19. Việc app/backend riêng còn lại

| Mục | Trạng thái của task landing này |
|---|---|
| GP-P0-01 | PARTIALLY_FIXED từ legal content; mobile links còn task riêng |
| MOBILE_LEGAL_LINKS | SEPARATE_APP_TASK_REQUIRED |
| GP-P0-02 | SEPARATE_BACKEND_MOBILE_TASK_REQUIRED: implement/test erase-anonymize thật và operational retention |
| GP-P0-03 | SEPARATE_FLUTTER_DISTRIBUTION_TASK_REQUIRED: chặn toàn bộ PayOS instructions/QR/browser/copy/CTA kể cả pending orders cũ trong Play build |
| OTP email/SMS | FUTURE_SEPARATE_TASK; chưa implemented trong task này |
| Google Play P1/Console | Recovery delivery, backup/restore boundary, 16 KB runtime/ARM evidence, listing assets, reviewer access, Data Safety/provider contracts/age audience và Console declarations/testing/access còn cần xử lý riêng |

Các thay đổi đang diễn ra trong worktree ứng dụng không được tính là fix do task landing này hoặc evidence release đã chốt. Nội dung pháp lý không phải luật sư phê duyệt; enforceability/compliance và provider/retention/operator facts còn cần legal/owner review phù hợp.

## 20. Trạng thái cuối cùng và scope

**COMPLETE cho batch nội dung landing page đã kiểm chứng ở commit `d07777d4c1159af5dd9c0348b740a064563e60cb`:** legal content trên main, local checks/build PASS, CI build/deploy PASS sau sửa lỗi baseline hạ tầng có bằng chứng, landing VPS rollout PASS và full live verification PASS. Báo cáo này được publish bằng commit chỉ tài liệu tiếp theo; không đổi legal source. Task chỉ kết thúc sau khi CI/CD HEAD chứa báo cáo chạy xong và health/live phản ánh HEAD đó. Evidence release nội dung trên đây không dựa vào một SHA tài liệu chưa tồn tại tại lúc viết báo cáo.

GP-P0-01 chỉ PARTIALLY_FIXED phía legal content; các app/backend blockers và OTP chưa được triển khai bởi task này. Ma trận PASS xác nhận copy alignment, không phải mọi ứng dụng/Play/compliance đã hoàn tất.

| Scope | Thay đổi do task này |
|---|---|
| Landing page / Privacy / Terms / legal content | YES |
| Legal design redesigned | NO |
| Landing workflow / deployment controller source | NO |
| VPS landing protected-runtime baseline metadata | YES; đúng 4 trường ở §16 |
| Flutter mobile source / assets / Play build | NO |
| NestJS backend source | NO |
| PostgreSQL / database | NO |
| Prisma / migrations | NO |
| Billing business logic | NO |
| PayOS logic | NO |
| Gemini logic | NO |
| Account-delete implementation | NO |
| OTP implementation | NO |
| Google Play payment gate | NO |
| VPS API deployed | NO |
| Landing page deployed | YES; PASS §17–18 |
