# Báo cáo triển khai HomeMind landing page

**RESUMED_FROM_PREVIOUS_SESSION: 2026-10-02 22:08:27 +07:00**, múi giờ Asia/Saigon. User đã cho resume. **Mục 9 là trạng thái hiện tại; mục 1–8 giữ evidence/checkpoint lịch sử trước và lúc pause.** Không restart/clone/tạo project khác. Source/build/tests/key/secrets hợp lệ được dùng lại. Đã audit SSH, scoped system bootstrap, HTTP-01, landing HTTPS và renewal; actual first CI image/deploy vẫn pending tới khi ghi actual run evidence. Không coi generated files là live deployment.

## 1. Những việc đã thực hiện và xác minh

Đã đọc repo và yêu cầu triển khai, kiểm tra working tree/remotes/permissions, fetch và fast-forward thay đổi README có sẵn trên main tới `0249925f02e516901d2daff23a3b3d11c86b480b`. Repository private, gh CLI đăng nhập đúng owner, Actions enabled, main không protected và không có rulesets. Không reset/clean hay ghi đè công việc khác.

Đã chuẩn bị Next.js standalone production image, Compose transport scaffold, controller hai slot/rollback/lock/freshness, wrapper root-owned/forced SSH command, bộ audit chỉ đọc, workflow main và PR checks, smoke desktop/mobile, deployment plan và runbook. Adapter cho proxy thực tế **chưa triển khai** vì chưa có audit SSH; nếu edge containerized thì cần thay transport bằng network model thực tế. Không tạo Nginx/Caddy/Traefik cạnh tranh.

Đã tạo key deploy Ed25519 riêng ngoài Git trong thư mục Windows chỉ account hiện tại có quyền truy cập; upload private key vào GitHub qua stdin, không đưa nội dung vào command arguments/log/YAML. Đã cấu hình known_hosts khớp fingerprint mà user xác nhận qua VPS console. Chưa cài public key/user/wrapper lên VPS, nên chưa chứng minh SSH deployment hoạt động.

## 2. Kiến trúc và port/routing trước–sau

**Kiến trúc VPS thực tế vẫn chưa được xác định.** HTTP trả nginx header không chứng minh proxy host-level hay quyền thay default/apex route. CPU/RAM/disk, firewall, Docker/Compose trên VPS, manager backend, internal/published ports, networks, mọi hostname, renewal manager và provider firewall đều chưa audit.

| Dịch vụ | Runtime/owner | Container port | Host bind/IP:port | Domain | Proxy/upstream | Health observation | Bảo vệ/thay đổi |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backend hiện hữu | User mô tả NestJS; actual PID/container/manager chưa biết | Chưa biết | Origin public :443; backend internal/host publication chưa biết | api.homemind.vn; hostname khác chưa biết | nginx header; upstream/manager chưa biết | Trusted TLS, GET / và health probes 404; chưa xác nhận health | Bảo vệ; không thay đổi |
| Edge HTTP hiện hữu | Owner chưa biết | Chưa biết | 103.200.22.211:80; bind IPv6 chưa biết | API 308 HTTPS; apex/www trả 200 nhỏ | Actual default/vhost chưa biết | Quan sát lúc 20:31:55 +07:00 | Không thay đổi |
| Edge HTTPS hiện hữu | Owner chưa biết | Chưa biết | 103.200.22.211:443; bind IPv6 chưa biết | API TLS đúng; apex/www hostname mismatch | Actual TLS manager chưa biết | API trusted YE2 | Không thay đổi |
| Landing VPS mới | Chưa tạo | Dự kiến app internal 3000 | Chưa chọn/reserve port hoặc network | homemind.vn; www DNS nay hợp lệ | Chưa chọn/cài adapter | BLOCKED | Chỉ triển khai sau audit |
| Ứng dụng/VPS service khác | Chưa audit | Chưa biết | Chưa biết | Chưa biết | Chưa biết | NOT RUN | Bảo vệ tất cả |
| Container kiểm thử local | Docker Desktop; node UID 1000 | 3000 | 127.0.0.1:3300; rehearsal tạm 3310 | localhost | Direct local container | Healthy; smoke pass | Chỉ local, không production |

VPS trước/sau hoàn toàn chưa bị thay đổi bởi tác vụ. Không có landing production port/resource budget nào đã được chọn. Không suy ra VPS architecture từ workstation linux/amd64.

## 3. Files, runtime, backup

Production image dùng **Node 24.21.0**, Debian bookworm-slim pinned index digest, npm ci theo package-lock, **Next 16.3.1 / React 19.2.8** giữ nguyên. Node 24 là LTS theo [Node official releases](https://nodejs.org/en/about/previous-releases); installed Next engine yêu cầu >=20.9.0. Local source lint/type/build chạy Node 22.20.0; Docker build/runtime xác minh Node 24.21.0. Không upgrade framework hay shared VPS tooling.

Image validation local platform **linux/amd64**, image ID `sha256:ed2600c4b051d8099dcf11c4c92cf4aa8c235ef4bb810e70cbe79f1631214a1b`, khoảng 273 MiB. Đây là **local image ID, không phải GHCR release digest**. Label validation dùng SHA upstream trên working tree chưa commit; không coi image local đó là production release của commit upstream.

Standalone đóng gói public và .next/static đúng theo [Next standalone documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/output). `markdowns` là tài liệu, không có runtime read/import nên không bake audit/report vào image. Source không có application secrets/NEXT_PUBLIC variables, backend API calls hoặc persistent uploads. Docker context loại .env/.git/keys/docs; chỉ copy source/build inputs cần thiết.

Files mới/chỉnh: Dockerfile, .dockerignore, .gitattributes, .gitignore, compose.production.yml, .env.example, next.config.ts, package.json/lock, site URL, healthz route, hai sửa JSX/lifecycle nhỏ để lint pass; deploy scripts/controller/audit/secure credential helpers, main/PR workflows, Playwright config/smoke, controller tests và bốn tài liệu markdown yêu cầu. Giao diện/content/luồng backend không redesign. OG image path thiếu từ trước vẫn thiếu; năm img optimization warnings được ghi nhận, không tắt rule để bỏ qua.

Không có VPS backup nào đã được tạo. Bootstrap code có backup scoped bin/config/sudoers/authorized_keys vào root-only `/opt/homemind-landingpage/backups/...`; actual proxy backup/snapshot path và restoration command chỉ được chốt sau audit. Registry credential/root environment files sẽ ngoài Git với quyền hạn chế. **User yêu cầu không lưu root password, kể cả encrypted file.** Không có file mật khẩu được tạo; helper capture cũ giữ nguyên theo yêu cầu không xóa file nhưng không được sử dụng. Client getpass chỉ đọc mật khẩu trong bộ nhớ; phiên chờ đã đóng trước khi nhập mật khẩu khi user yêu cầu pause.

## 4. DNS, HTTPS và renewal

Lúc 20:09:52 +07:00 apex không có A/AAAA và www NXDOMAIN; API A=103.200.22.211. Nameservers Vietnix: ns1/ns2/nsbak.vietnix.net. Sau cập nhật của user, **www A=103.200.22.211, TTL 3600** đã được xác minh độc lập qua Google DoH và 1.1.1.1. Các truy vấn cache sau đó chưa nhất quán; apex chưa có A answer ở lần quan sát trước cập nhật mới nhất. **User sau đó xác nhận cả apex và www đã cấu hình DNS; chưa kiểm chứng authoritative/public lại sau thông báo apex.** Không coi kết quả cache cũ là yêu cầu user sửa lại record. Chưa có positive IPv6 được quan sát. Không sửa DNS qua provider API.

Khi user cho resume, kiểm tra authoritative và public A/AAAA/CAA trước ACME; chỉ yêu cầu chỉnh DNS nếu kết quả mới chứng minh cần thiết. Giữ API/mail/TXT/verification records. Không thêm AAAA trước khi IPv6 được kiểm chứng. Không thực hiện DNS/ACME trong lúc pause.

API certificate hiện hữu: **Let's Encrypt YE2**, SAN **api.homemind.vn**, notBefore **2026-10-02 16:35:55 +07:00**, expiry **2026-12-31 16:35:54 +07:00**. TLSv1.3, normal hostname/chain trust passed bằng curl/Python SSL, recheck certificate không đổi lúc 20:31:55. Không dùng -k. Đây là API certificate, **chưa có landing issuer/expiry**. Direct origin SNI apex/www fail hostname mismatch; HTTP apex/www origin trả 200, chưa redirect HTTPS. API HTTP trả 308 tới HTTPS.

[Let's Encrypt hierarchy](https://letsencrypt.org/certificates/) hiện xếp R13 vào retired issuance. Không pin hay cài R13. TLS manager/storage/timer/renewal hook chưa xác định; landing issuance và renewal rehearsal **NOT RUN/BLOCKED**. Không đổi SAN/lineage API.

## 5. GitHub Actions và registry

Đã chuẩn bị `.github/workflows/deploy-landingpage.yml` cho push main/workflow_dispatch, guard trusted repo+main, exact checkout, reproducible checks, Docker/platform/browser tests, private GHCR SHA tag/digest, verified SSH, candidate deploy, public HTTPS/browser acceptance và conditional rollback. PR checks không publish/deploy/secrets và không có pull_request_target. Official actions pinned full SHA từ API của official repositories, có version comments; local actionlint passed.

Production concurrency group stable, cancel-in-progress=false; server app-only lock, monotonic run-number guard, workflow main-head comparison; idempotent verify cho release đã current. Controller giữ current/previous digest/config/snapshot và app-scoped records. ROOT_CODE/manifest/adapter không lấy từ SSH workflow upload. Root Docker privilege trong wrapper được giới hạn bằng fixed path/config/repo/digest; không Docker-group/unrestricted sudo.

**Secret names đã cấu hình:** VPS_HOST, VPS_SSH_PORT, VPS_DEPLOY_USER, VPS_SSH_PRIVATE_KEY, VPS_KNOWN_HOSTS. Không có secret values trong báo cáo.

**Variables đã cấu hình:** LANDING_PUBLIC_URL, LANDING_DEPLOY_ROOT, LANDING_GHCR_IMAGE, LANDING_BOOTSTRAP_READY=false. LANDING_IMAGE_PLATFORM chưa đặt vì chưa audit VPS. Không tạo production environment/manual approval mới cho mỗi push.

**Actual Actions run reference: NONE. Production deployed commit/digest: NONE.** Remote chưa có workflow commit; chưa push vì bootstrap prerequisites chưa đạt. Hosted runner capacity/billing chưa xác minh được bằng token hiện có; billing read endpoint trả 404 và yêu cầu scope user. Không tăng spending/đổi plan/visibility/protections.

GHCR package existence/access inheritance chưa chứng minh: current gh OAuth thiếu read:packages, API 404 không phân biệt absence/access. Chưa có classic PAT secure source cho VPS và **private pull under deployment identity NOT RUN**. Workflow GITHUB_TOKEN chỉ dùng publish trong job packages:write; không dùng làm long-term VPS pull credential.

## 6. Kết quả kiểm thử và giới hạn

| Check | Kết quả | Evidence / giới hạn |
| --- | --- | --- |
| npm ci | PASSED | 371 packages ban đầu; sau bổ sung Playwright lockfile build cài reproducible |
| Lint | PASSED | Sửa 7 pre-existing errors; còn 5 existing no-img-element warnings |
| Type check | PASSED | next typegen rồi tsc --noEmit; không skip checks |
| Local production build | PASSED | Next routes /, healthz, robots, sitemap, not-found |
| Production Docker build | PASSED | Multi-stage Node 24.21.0, linux/amd64; actual image build/run |
| Runtime/readiness/assets | PASSED LOCAL | node user; read-only root; loopback bind; health healthy; static/favicon/temp/google-verification/fonts |
| Desktop/mobile browser | PASSED LOCAL | 2 tests, latest image rehearsal 13.1s; navigation Lenis, simulator, FAQ, health/release, CSS/JS/fonts, no same-origin/page errors or mixed HTTP assets; không gửi real forms |
| Docker failed-candidate containment | PASSED ISOLATED | Candidate network none, forced unhealthy; existing healthy test container và release response giữ nguyên; temp candidates cleanup scoped |
| Controller rollback/state/freshness/cleanup | PASSED ISOLATED | 17 unit rehearsals: pull/port/stale/candidate/switch/post-check failures, prior restoration, manual config restore, conditional rollback, first deployment no prior, scoped retention; proxy operations mocked |
| Shell syntax / shellcheck | PASSED | Linux shellcheck 0.11.0; scripts bounded and quoted |
| Workflow syntax | PASSED | Checksum-verified actionlint 1.7.12, cả hai workflow |
| Compose schema | PASSED LOCAL | Explicit local test budgets, 127.0.0.1 bind, restart unless-stopped, init, pids/log/memory/CPU limits; không phải audited VPS values |
| SSH fingerprint policy | PASSED LOCAL | Exact console-confirmed key accepted; mismatch rejected; actual password authentication chưa chạy |
| Secret scan history | PASSED | Redacted gitleaks 8.30.1, 2 original commits, không phát hiện secret |
| Final working-source secret scan | PENDING | Phải chạy sau hoàn tất report/helper updates và trước bất kỳ push nào |
| Backend baseline external TLS | PASSED OBSERVATION | API trusted YE2; arbitrary 404 probes chỉ baseline, không health proof |
| Backend full non-regression | BLOCKED | Chưa có actual runtime/port/network/health baseline từ SSH; không có production mutations |
| Public apex/www landing, redirect, TLS | PAUSED / NOT RUN | User báo apex/www DNS đã có, verification mới còn pending; origin landing TLS/routing chưa cài |
| VPS app port external IPv4/IPv6 isolation | NOT RUN | Chưa chọn/bind production app ports; local loopback alone không chứng minh VPS isolation |
| Renewal/timer/dry-run | NOT RUN | Actual manager chưa audit; không vận hành certificate backend |
| Private GHCR pull | BLOCKED | Chưa có secure classic read:packages source và provisioned pull identity |
| Main-triggered real deploy + digest match | NOT RUN | Chưa commit/push hoặc bootstrap |
| Production rollback/persistence | NOT RUN | Không cố tình gây lỗi backend hay reboot VPS; isolated tests không phải real production rollback |

Các lỗi rehearsal đã được sửa: smoke test ban đầu giả định Lenis cập nhật URL hash và selector mobile quá rộng; sửa test theo hành vi thật, không sửa navigation để chiều test. Failed candidate ban đầu thừa hưởng start-period khi dùng giá trị 0; chuyển sang explicit 1s, bounded rehearsal sau đó pass. Đây là local test/harness failures đã xử lý, không phải production incidents.

## 7. Lệnh vận hành sau bootstrap và bước còn thiếu

Các lệnh app-scoped chuẩn được ghi tại [runbook](HOMEMIND_LANDINGPAGE_RUNBOOK_VI.md): `release.py status`, `release.py logs`, `verify.sh`, `deploy.sh SHA DIGEST RUN_NUMBER`, `rollback.sh`, `release.py cleanup-records`. **Hiện scripts chưa được cài trên VPS.** Các command đầu vào placeholder bị validator từ chối; digest phải lấy từ release CI approved, không latest/rebuild. Certificate inspection dùng curl/openssl normal trust; renewal command thực tế chỉ ghi sau xác định TLS manager.

External blockers và next actions chính xác:

1. **SSH audit đang PAUSED:** user đã cung cấp root và console-verified fingerprint. Không cần yêu cầu gửi lại password hay lưu file. Sau resume, dùng client getpass no-echo với mật khẩu chỉ trong bộ nhớ. Chưa xác thực SSH; không có topology host thực tế.
2. **DNS verification pending:** user báo apex/www đã cấu hình. Sau resume kiểm tra public/authoritative DNS và CAA; không tự sửa DNS từ kết quả cache cũ.
3. **GHCR private pull token:** classic PAT chỉ read:packages, package access, secure local file/secret store; không gửi token trong chat. Không làm package public hoặc cấp write/admin cho VPS.
4. **Sau SSH:** audit đủ topology/health/resources, chọn đúng adapter/ports/network, backup/provision/issue/renewal, test actual private pull/SSH wrappers/rollback/certificate/port isolation. Những việc phụ thuộc audit chưa thể coi hoàn tất.
5. **Sau bootstrap:** set audited platform/READY, final redacted secret scan + complete diff/staged review, commit/push main theo authorization đã có, quan sát real run và sửa lỗi trong phạm vi, verify deployed digest/HTTPS/browser/backend. Không bypass protection/quota hay sửa backend.

Tất cả thay đổi triển khai vẫn nằm ở local working tree, chưa commit/stage/push; không chỉ documentation-only. Không có report-only recurring commit hay CI commit report. Khi tiếp tục, đọc plan/audit/report và kiểm tra state trước khi lặp provisioning.

## 8. Checkpoint tạm dừng — PAUSED SAFELY

Mục này là trạng thái handoff có hiệu lực cao nhất của báo cáo. **Tạm dừng theo user, không cancellation/rollback. Không thực hiện thêm deployment work cho tới chỉ thị resume.** Không xóa file, reset/clean Git, checkout ép, tạo project khác, commit để pause, push/merge, provision, thay certificate/DNS/firewall/user/SSH, restart/reload hoặc cleanup. Không có production mutation đang dang dở cần hoàn thành.

### 1–6. Thời gian, workspace và Git

1. **Thời điểm checkpoint:** `2026-10-02T20:56:27+07:00` (Asia/Saigon), tương đương `2026-10-02T13:56:27Z`. Phase: local implementation/validation hoàn tất phần lớn; chuẩn bị phiên SSH audit chỉ đọc, **chưa xác thực**. Phiên terminal chờ getpass đã nhận Ctrl+C và kết thúc an toàn; không có remote command chạy dở.
2. **Existing local project:** `D:\HomeMind\homemind-landing-page-main\homemind-landingpage`. Chỉ tiếp tục trong directory này; không tạo project/deployment directory mới.
3. **Repository:** `QuangVMZu/HomeMind_LandingPage`, private; gh account `QuangVMZu` qua existing keyring authentication.
4. **Branch:** `main`.
5. **HEAD:** `0249925f02e516901d2daff23a3b3d11c86b480b`. Trước task HEAD là `f34f7e0` và tree sạch; trước pause đã fetch + fast-forward README-only upstream commit. Không có deployment commit mới.
6. **`git status --short` tại pause:** 7 tracked files modified và 28 untracked files, tổng 35 files. Không staged file. Output giữ nguyên:

```text
 M .gitignore
 M next.config.ts
 M package-lock.json
 M package.json
 M src/components/sections/InteractiveShowcase.tsx
 M src/components/sections/TestimonialsSection.tsx
 M src/config/site.ts
?? .dockerignore
?? .env.example
?? .gitattributes
?? .github/
?? Dockerfile
?? compose.production.yml
?? deploy/
?? markdowns/HOMEMIND_LANDINGPAGE_DEPLOYMENT_PLAN.md
?? markdowns/HOMEMIND_LANDINGPAGE_DEPLOYMENT_REPORT_VI.md
?? markdowns/HOMEMIND_LANDINGPAGE_RUNBOOK_VI.md
?? markdowns/HOMEMIND_LANDINGPAGE_VPS_AUDIT.md
?? playwright.config.ts
?? src/app/healthz/
?? tests/
```

Tracked diff trước cập nhật pause: 7 files, 73 insertions, 11 deletions. New files không nằm trong `git diff --stat` khi chưa add. Giữ nguyên toàn bộ uncommitted work; không tự stage/commit chỉ vì pause.

### 7–8. Danh mục files và mục đích

M = modified tracked, A = new untracked. Tất cả paths tương đối với existing project ở trên.

| File | State | Mục đích / giới hạn hiện tại |
| --- | --- | --- |
| `.gitignore` | M | Loại secret/key, báo cáo test và Python cache khỏi Git; cho phép sanitized `.env.example`. |
| `next.config.ts` | M | Bật Next standalone, giữ cấu hình ứng dụng hiện hữu. |
| `package.json` | M | Thêm typecheck, browser smoke và isolated deployment test scripts; Playwright dependency. |
| `package-lock.json` | M | Reproducible npm lock cho Playwright, không upgrade framework. |
| `src/components/sections/InteractiveShowcase.tsx` | M | Sửa lint/lifecycle setState và unused import, giữ tương tác simulator. |
| `src/components/sections/TestimonialsSection.tsx` | M | Escape JSX quotes để lint pass. |
| `src/config/site.ts` | M | Đổi existing canonical/OG URL sang requested apex. |
| `.dockerignore` | A | Loại credentials, Git, docs và artifacts khỏi build context. |
| `.env.example` | A | Public runtime comments/example; không chứa app secret. |
| `.gitattributes` | A | LF cho shell, Docker, YAML và Python portability. |
| `Dockerfile` | A | Pinned Node 24.21.0 multi-stage standalone image, node user, readiness healthcheck và revision/source labels. |
| `compose.production.yml` | A | Host-proxy loopback scaffold, audited-value gates, two scoped projects, limits/read-only/log rotation; chưa phải actual VPS architecture. |
| `.github/workflows/check-landingpage.yml` | A | PR validation: lint/type/tests, production image/browser; không publish/deploy hoặc dùng production secrets. |
| `.github/workflows/deploy-landingpage.yml` | A | Main build/test/private GHCR/verified SSH/public acceptance/conditional rollback; READY guard false, chưa push/run. |
| `deploy/README.md` | A | Gates, lifecycle, root trust và proxy adapter contract. |
| `deploy/audit.py` | A | Linux read-only collector, selected fields/sanitized directives; không dump env/full inspect hay khởi động PM2. |
| `deploy/bootstrap.sh` | A | Scoped root-owned install/user/forced key/sudoers và backup sau actual audit; chưa chạy trên VPS. |
| `deploy/capture-bootstrap-credential.ps1` | A | Helper encrypted capture đã tạo trước đây; **superseded, KHÔNG SỬ DỤNG** theo user no-password-storage. Giữ file nguyên trạng vì pause cấm xóa. |
| `deploy/deploy.sh` | A | Fixed-root privileged deploy wrapper với SHA/digest/run validation, env cleared. |
| `deploy/image-smoke.sh` | A | Run production image, desktop/mobile smoke và isolated unhealthy candidate; cleanup chỉ exact local test containers khi harness chạy. Không chạy thêm trong pause. |
| `deploy/release.py` | A | Root controller: candidate/current/previous, lock, monotonic run guard, trusted files, protected-backend checks, rollback và scoped metadata retention. Actual proxy adapter chưa có. |
| `deploy/rollback.sh` | A | Root manual/conditional rollback wrapper với identity guard. |
| `deploy/secret-scan.sh` | A | Pinned/checksum-verified gitleaks, redacted history + source scan. |
| `deploy/server.example.json` | A | Audit/config schema example cố ý unresolved; validator từ chối deploy nguyên trạng. |
| `deploy/ssh-audit-client.py` | A | Workstation Paramiko, exact console-verified ED25519 policy, no-echo ephemeral getpass, remote collector + protected sanitized output. Latest getpass transport chưa qua successful authentication. |
| `deploy/ssh-entry.sh` | A | Forced SSH command parser, chỉ fixed deploy/conditional rollback commands, narrow sudo. |
| `deploy/verify.sh` | A | Fixed-root release/backend verification wrapper. |
| `playwright.config.ts` | A | Desktop Chrome + iPhone 13 Chromium, bounded one-worker smoke, failure artifacts. |
| `src/app/healthz/route.ts` | A | No-store readiness/release SHA endpoint, không lộ secret. |
| `tests/browser/landing.spec.ts` | A | Navigation/simulator/FAQ, release/assets/fonts, browser/same-origin errors, mobile; không submit customer forms. |
| `tests/deploy/test_release.py` | A | 17 isolated controller failure/rollback/freshness/retention tests; không tác động production. |
| `markdowns/HOMEMIND_LANDINGPAGE_DEPLOYMENT_PLAN.md` | A | Sequencing, gates, pause authority và resume pointer. |
| `markdowns/HOMEMIND_LANDINGPAGE_DEPLOYMENT_REPORT_VI.md` | A | Findings, test evidence, limitations và checkpoint đầy đủ này. |
| `markdowns/HOMEMIND_LANDINGPAGE_RUNBOOK_VI.md` | A | Future app-scoped operations, credential handling, rollback/TLS; commands chưa cài trên VPS. |
| `markdowns/HOMEMIND_LANDINGPAGE_VPS_AUDIT.md` | A | Sanitized historical DNS/TLS/HTTP evidence, unknown host topology và remaining audit. |

Ignored npm/Next/test artifacts sinh trong validation, local Docker image/container và dedicated SSH key ngoài Git được giữ nguyên; không cleanup ở pause. Đây không phải backup production.

### 9–10. Commands/checks đã chạy và lỗi đã ghi nhận

**Đã pass, không cần chạy lại chỉ để resume:** repo identity/permission audit; `git fetch origin main` rồi `git merge --ff-only origin/main` trước pause; `npm ci`; `npm run lint` (0 errors, 5 existing warnings); `npm run typecheck` (`next typegen && tsc --noEmit`); `npm run build`; actual production Docker build/run; desktop + mobile Playwright 2 tests; isolated Docker unhealthy candidate containment; controller 17 unit tests; `bash -n` shell syntax; shellcheck 0.11.0; actionlint 1.7.12 cho cả hai workflows; local Compose schema with explicit test-only values; gitleaks 8.30.1 redacted original 2-commit history; isolated SSH fingerprint match/rejection; trusted public API TLS and bounded GET observations. Xem mục 6 cho giới hạn từng check.

Validation identifiers giữ để không rebuild/discover tốn kém:

- Local image: `homemind-landingpage:local-validation`.
- Local image ID: `sha256:ed2600c4b051d8099dcf11c4c92cf4aa8c235ef4bb810e70cbe79f1631214a1b`, size 286395835 bytes. **Không phải registry digest hay committed release.**
- Base official Node index digest: `sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6` (24.21.0-bookworm-slim).
- Local container: `homemind-landingpage-local-smoke-20261002`, ID prefix `770674d48e45`, started `2026-10-02T13:17:30.620357528Z`, node user, read-only filesystem, `127.0.0.1:3300->3000/tcp`. Read-only local check at pause reported **Up 39 minutes (healthy)**. Giữ chạy; không stop/remove trong pause.
- Official workflow action versions/full SHAs đã pin trong YAML; không cần resolve lại API trừ khi thực sự thay version.
- Checksum-verified Windows tools: `%TEMP%\homemind-deploy-tools\actionlint.exe` (1.7.12) và `gitleaks.exe` (8.30.1). WSL Ubuntu có Python/bash, Docker integration chưa bật; Docker Desktop Linux engine 29.6.1 có thể dùng qua direct `D:\Git\bin\bash.exe` với `MSYS_NO_PATHCONV=1` cho harness.

**Đã fail / nguyên nhân / disposition:**

- Typecheck ban đầu chạy tsc thiếu generated Next LayoutProps; script đã đổi sang `next typegen` trước tsc và pass.
- Browser smoke ban đầu giả định Lenis đổi URL hash và dùng selector mobile quá rộng; sửa test theo behavior thật, desktop/mobile pass.
- Failed-candidate harness ban đầu dùng start-period 0, Docker thừa hưởng image start-period; đổi explicit 1s và containment rehearsal pass.
- Plain-pipe SSH helper stdin kết thúc EOF nên JSONDecodeError **trước authentication**, không remote command. Đổi sang `getpass` trên interactive tty; tới no-echo prompt nhưng pause trước password input, chưa xác minh authentication/remote audit.
- Ctrl+C phiên getpass cuối trả `KeyboardInterrupt`, process exit 1: **intentional safe pause, không SSH failure hay production incident**.
- GH package/billing API 404 do thiếu read:packages/user scopes nên không chứng minh package absent/capacity unavailable; không xin thêm OAuth quyền hoặc thay billing.
- Direct origin HTTPS apex/www hostname mismatch, observed trước pause; chưa cài landing certificate. API trust pass. Arbitrary API health probes 404 là observation, không health proof.
- Docker Desktop engine ban đầu stopped, đã start installed Desktop; không install/upgrade. WSL Docker command không dùng được vì integration disabled; harness chạy direct Git Bash pass. Các vấn đề này không nói gì về VPS Docker.

**Còn pending:** final working-source secret scan sau các cập nhật cuối, final full/staged diff review và mọi VPS/public release acceptance. Không đánh dấu latest helper/docs changes là production-tested. Không chạy lại test/build/deploy trong pause.

### 11–14. Verified, partial, not started, blockers

11. **VERIFIED complete:** repo/source audit; local production build/non-root/read-only readiness/assets; desktop/mobile app checks; isolated controller/harness failures; YAML/shell/Compose validation; original Git history secret scan; console fingerprint confirmation and local match/reject policy; dedicated deployment key created and SSH secrets uploaded; nonsecret GitHub vars configured with READY=false; historical API DNS/TLS observations.
12. **PARTIAL:** Docker/Compose/release implementation chưa integrated với actual proxy; latest ephemeral SSH helper chưa authenticated; public DNS propagation verification sau user apex update pending; backend baseline mới public responses, chưa runtime/health; GitHub CI files local only; source secret scan/diff final pending. Metadata OG image pre-existing absent vẫn chưa có.
13. **NOT STARTED:** full SSH host audit; actual proxy adapter/port/network/budgets; backend identity+true health baseline; VPS backups; deploy user/key/wrappers install; root GHCR login/private pull; landing routing/certificate/renewal; image publish; task commit/push; real main Actions run; candidate switch/public acceptance/production rollback proof; external VPS app-port isolation. Không có certificate/firewall/backend changes.
14. **Current blockers:** explicit pause (primary stop condition); full VPS audit chưa chạy; long-term private GHCR classic `read:packages` secure token source chưa cung cấp; current DNS chưa verified sau thông báo apex. Không coi root password là missing: user đã cung cấp và cấm lưu; không cần yêu cầu gửi lại. Runner billing/capacity và package visibility/access chưa chứng minh bằng available scopes. Không tự resume vì đã có credential.

### 15–17. VPS topology, DNS và SSH state

15. **VPS topology discovered:** chỉ có public evidence, **chưa SSH login**. HTTP origin trả `nginx/1.24.0 (Ubuntu)` header; host/container/control-panel ownership unknown. :80/:443 externally respond nhưng socket owner/bind IPv6 unknown. User mô tả NestJS; actual PID/container/systemd/PM2, internal/published port, restart policy, networks và hostname khác **unknown**. VPS Docker/Compose/CPU/RAM/disk/firewall unknown. Backend api.homemind.vn HTTPS root và ba health probes trả 404, trusted TLS pass; không kết luận khỏe. Landing chưa có container/service/network/port trên VPS; 3100–3199 chỉ candidate range chưa kiểm tra, 3000 là app internal port validated local. Không có running VPS container/service identifier được discover. Xem inventory mục 2 và audit cho exact baseline hashes.
16. **DNS:** historical API A=103.200.22.211, TTL 3600; NS `ns1.vietnix.net`, `ns2.vietnix.net`, `nsbak.vietnix.net`. Historical apex no A/AAAA, www NXDOMAIN; later www A=103.200.22.211 verified Google/Cloudflare, rồi cache inconsistent. User báo cả www và apex đã configured; authoritative/public verification mới pending. No positive AAAA observed, no relevant CAA answer ở historical checks. DNS provider account chưa access, không đổi DNS. Không yêu cầu user sửa lại apex từ old cached result.
17. **SSH:** target root@103.200.22.211:22; console-confirmed ED25519 `SHA256:PCSf/TeTiQPldznzJdSYfayLBzhZH6EsR+kHm2f3gVU`. Root password **không lưu vào file/repo/argv/log/report**, không nhập vào phiên getpass cuối do pause. No successful SSH authentication/remote collector. Dedicated planned user `homemind` chưa provision. Public host known_hosts và deploy key pair ngoài Git ở `C:\Users\phuck\AppData\Local\HomeMindDeployment` (user-only ACL); không chứa bootstrap password. Paths dùng lại, không regenerate key:

```text
C:\Users\phuck\AppData\Local\HomeMindDeployment\github-actions-homemind-landingpage-20261002
C:\Users\phuck\AppData\Local\HomeMindDeployment\github-actions-homemind-landingpage-20261002.pub
C:\Users\phuck\AppData\Local\HomeMindDeployment\vps-verified-known_hosts
```

Paths là references, **không ghi/read-print private key contents**. Expected sanitized audit output `...\vps-readonly-audit-20261002.jsonl` **chưa tồn tại**, collector chưa chạy. Encrypted root credential file không tồn tại; không tạo nó khi resume. Capture helper cũ không còn được dùng.

### 18–24. GitHub, CI, production và backups

18. **GitHub/GHCR configuration done:** repository private; existing gh admin/push auth, Actions enabled. Dedicated deploy SSH secrets populated through stdin; public key chưa install VPS. Vars configured; readiness false. GHCR expected private package `ghcr.io/quangvmzu/homemind-landingpage`, chưa publish/create/verify access. Existing OAuth scopes repo/workflow/read:org/gist không đủ private GHCR pull. Không đổi visibility/protection/spending, không lưu GITHUB_TOKEN làm registry credential.
19. **Secrets/variables BY NAME ONLY:**

| Kind | Names configured |
| --- | --- |
| GitHub repository secrets | `VPS_HOST`, `VPS_SSH_PORT`, `VPS_DEPLOY_USER`, `VPS_SSH_PRIVATE_KEY`, `VPS_KNOWN_HOSTS` |
| GitHub repository variables | `LANDING_PUBLIC_URL`, `LANDING_DEPLOY_ROOT`, `LANDING_GHCR_IMAGE`, `LANDING_BOOTSTRAP_READY` |
| Deliberately not yet configured variable | `LANDING_IMAGE_PLATFORM` |

Nonsecret readiness gate đang false; không thay trong pause. Không có secret values trong checkpoint.

20. **Current CI/CD status:** hai local untracked YAMLs đã actionlint pass; remote last observation chưa có workflow/runs và task chưa push. Actual run URL/ID: **NONE**. Hosted runner capacity chưa verify; no self-hosted runners observed. Không trigger workflow trong pause.
21. **Committed:** **NONE by this task**; upstream README fast-forward đã có trước pause, không phải deployment commit.
22. **Pushed:** **NONE by this task**; tất cả 35 files ở local working tree, chưa stage.
23. **Production modified:** **NO**. Không login VPS; không user/SSH/proxy/Docker/backend/TLS/DNS/firewall mutation. GitHub secrets/vars là preparation đã thực hiện trước pause, không production deployment. Workstation Docker Desktop/image/container đã thay local, giữ nguyên.
24. **Backups:** **không có VPS backup nào tạo** và không có actual restoration snapshot. `/opt/homemind-landingpage/backups/...` mới là planned bootstrap path, chưa provision. Dedicated local key/known_hosts là preparation, không phải backup. Existing unrelated keys không dùng. Test-failure temporary Docker candidates đã được harness cleanup scoped **trước pause**; không cleanup mới sau pause. Local healthy smoke container vẫn giữ chạy.

Existing API TLS observation: issuer **Let's Encrypt YE2**, SAN api.homemind.vn, valid `2026-10-02 16:35:55+07:00` đến `2026-12-31 16:35:54+07:00`, TLSv1.3 normal trust pass. Actual SSL/ACME manager/lineage/timer/reload hook unknown. Landing cert/issuer/expiry/renewal **NONE / NOT RUN**; không claim đã cài R13.

### 25. Exact safest next action khi resume

**Bây giờ STOP và chờ user.** Chỉ sau explicit resume:

1. Đọc plan, audit, runbook và checkpoint này trong **existing project**; đối chiếu `git branch --show-current`, `git rev-parse HEAD`, `git status --short` với recorded state, bảo toàn thay đổi và kiểm tra xem người khác có thay đổi gì không. Không reset/clean, không tạo project mới, không regenerate/re-upload dedicated key hoặc lặp build đã pass chỉ vì phiên mới.
2. Tiếp tục **read-only SSH audit** bằng reviewed client ở interactive tty (password no-echo, chỉ trong bộ nhớ). Lệnh không chứa secret, chạy trong existing project:

```powershell
python -u deploy/ssh-audit-client.py --console-verified-fingerprint SHA256:PCSf/TeTiQPldznzJdSYfayLBzhZH6EsR+kHm2f3gVU --output "$env:LOCALAPPDATA\HomeMindDeployment\vps-readonly-audit-20261002.jsonl"
```

Không pipe plaintext password từ command string/file, không dùng obsolete capture helper. Chỉ truyền qua no-echo secure terminal input. Verify collector succeeded rồi đọc sanitized evidence; bổ sung read-only full socket/manifests/backend/proxy/ACME/firewall audit còn thiếu. Không production mutation cho tới khi audit đã đủ.
3. Verify authoritative Vietnix/public DNS sau reported apex update; lấy actual backend read-only health/identity; chọn topology/ports/budgets dựa evidence. Resolve GHCR secure classic read:packages source bằng protected input, không yêu cầu token trong chat. Sau đó mới actual adapter/backup/bootstrap/TLS gates, source secret scan/diff review và initial commit/push theo authorized scope, nếu user đã cho resume. Khi gate chưa đạt, không bypass READY hoặc deploy.

**State documents updated for this pause:** existing plan, this report, existing VPS audit và existing runbook. Không có file/state project directory mới, không xóa generated deployment files. Phiên sau phải resume từ checkpoint này, không bắt đầu lại.

## 9. RESUMED_FROM_PREVIOUS_SESSION — trạng thái hiện tại

Khôi phục state lúc **22:08:27 +07:00 ngày 2026-10-02**. Existing project `D:\HomeMind\homemind-landing-page-main\homemind-landingpage`, private `QuangVMZu/HomeMind_LandingPage`, branch main. Previous/current HEAD tại recovery **0249925f02e516901d2daff23a3b3d11c86b480b**; remote main nhẹ kiểm tra cũng khớp, 35 files task vẫn chưa stage/commit/push. Không có Actions run. Đọc bốn existing documents, tracked diff và deployment files trước changes. Không reset/clean/move/clone.

**Reused:** source audit, unchanged Next standalone Docker/app source, local build/non-root/read-only image/browser evidence, dedicated Ed25519 key/known_hosts và năm GitHub SSH secrets, official pinned actions/tool checksums. Không regenerate key/re-upload secrets/rebuild image vì resume. **Revalidated:** Git/remotes/remote main (một transient TLS handshake timeout, retry pass), secret/variable names, public/authoritative DNS, external HTTP/TLS/backend baseline, actual SSH host key. Local Docker Desktop engine đã stop trong lúc pause; không reinstall/start chỉ để repeat passed build. Host Docker 29.8.2/Compose 5.5.1 đã có sẵn, không upgrade.

**FIRST_INCOMPLETE_SAFE_STEP = first trusted SSH/VPS audit**, vì checkpoint trước chưa có actual runtime/port inventory. Credential label/file thực tế không tồn tại trong Windows Credential Manager/protected folder; user đã nhập masked GUI. Không lưu mật khẩu, không hỏi lại fingerprint. Audit collector + targeted follow-up hoàn tất, JSONL selected fields outside Git tại existing user-only `C:\Users\phuck\AppData\Local\HomeMindDeployment`.

**Actual architecture and baseline:** Ubuntu 24.04.3 amd64, 16 CPUs/32,140 MiB RAM/129G available disk, host Nginx. Existing NestJS Docker `homemind-api-1` host **127.0.0.1:3000**, restart unless-stopped, protected full ID/start timestamp/bindings/networks; PostgreSQL healthy/no published port. Actual backend readiness **https://api.homemind.vn/v1/health/ready = 200**, 18 bytes, deterministic SHA256 `31bf75f4c0a97cc1f7b60df824fa390b3be9ba014f29b63c87c698ba63d9a9fd`. API/root behavior retains original 404/hash. API/DB identities, networks, restart policies, backend Compose/API/default vhost/deploy-hook hashes were checked before/after every scoped operation. Full table/IDs/hashes in updated audit.

**New directory constraint implemented:** read-only search found no existing landing checkout on VPS. No `/opt/homemind-landingpage`, alternative application root, clone or releases tree created. Source exists only in current local repo; app ships inside Docker. Root-reviewed operational files use the allowed OS locations: fixed `/usr/local/sbin/homemind-landingpage-*`, `/etc/homemind-landingpage.json`, `/etc/homemind-landingpage-compose.yml`; flat `/var/lib/homemind-landingpage-*` records/state; `/run/lock/homemind-landingpage.lock`. Compose project directory is existing `/`, no source/build on VPS. Dedicated SSH home/authorized_keys are standard OS identity files. Generated operator transport payloads stay ignored in existing local deploy directory and never execute through Actions.

**Production preparation completed:** scoped system wrappers/config, user homemind without Docker group, root-owned forced key and narrow sudoers; dedicated SSH key authentication passed and unauthorized `status` command rejected. Host Nginx adapter writes only new landing vhost; preserves all prior API/default configurations, validates nginx, graceful reloads only. Audited new loopback slots **3100/3101**, each 512 MiB/1 CPU, non-root/read-only/tmpfs/pids/log rotation; min available RAM/disk 2048 MiB. No backend/container/network/service restart, firewall or DNS change. Landing slot has not yet started at this pre-push checkpoint.

**DNS/HTTPS/renewal VERIFIED:** apex and www A=103.200.22.211 across all 3 authoritative Vietnix NS and Google/Cloudflare; no positive AAAA; raw authoritative CAA NOERROR/no answers, nameservers unchanged. Windows CAA unsupported; raw type257 fallback verified, not skipped. Both public HTTP-01 probes passed on existing **/var/www/homemind-acme**. Existing **Certbot 2.9.0** reused, own lineage **homemind.vn**, SAN apex/www, browser-trusted **Let's Encrypt YE1**, TLSv1.3; notBefore **2026-10-02 21:40:05 +07:00**, expiry **2026-12-31 21:40:04 +07:00**. API stays YE2/SAN api.homemind.vn, old dates and identical certificate bytes. No R13 pinning.

First TLS step reported failure after completing certificate/vhost; old client had suppressed raw failure detail and closed. Read-only diagnostics found cert/vhost present, nginx -t pass, no ACME error or active Certbot. Revalidation reused lineage without another issuance, all trust/backend checks passed. Precise original cause unconfirmed; graceful worker timing is only a possible explanation. Client now preserves selected failure output and connection. Controller acceptance retries full normally verified checks five times with 0.5s delays to accommodate graceful route activation; no trust/check bypass.

**Renewal command actually passed:** `certbot renew --cert-name homemind.vn --dry-run --run-deploy-hooks --non-interactive`, exit 0 at **22:49:12 +07:00**, staging rehearsal scoped only landing and existing hook exercised. Certbot timer active/enabled; next scheduled **2026-10-03 03:10:52 +07:00** at observation. Backend non-regression passed afterward. No API renewal/lineage changes. Ordinary landing HTTP 308→apex HTTPS; www HTTPS 308→apex; apex HTTPS maintenance 503 until first tested CI release, not yet landing acceptance success.

**Registry/CI design updated:** build job packages:write publishes private package linked source repo; deploy job packages:read sends short-lived GITHUB_TOKEN via SSH stdin. Root Docker login password-stdin in dedicated root-only temporary /run directory, removed after pull; no persistent PAT, shared root Docker auth, argument/log/token source file. Supported by [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry). Actual private pull is validated after first publish and before candidate/routing; cannot honestly claim a pre-publish pull of a nonexistent package. Permanent read PAT blocker is resolved by this short-lived workflow authentication design.

**GitHub configuration reused, names only:** secrets VPS_HOST, VPS_SSH_PORT, VPS_DEPLOY_USER, VPS_SSH_PRIVATE_KEY, VPS_KNOWN_HOSTS. Variables LANDING_PUBLIC_URL, LANDING_GHCR_IMAGE, LANDING_IMAGE_PLATFORM, LANDING_BOOTSTRAP_READY. Platform now audited linux/amd64. Legacy LANDING_DEPLOY_ROOT removed because workflow/controller no longer use an application root. READY remains false until final checks, then true for first authorized main push. No visibility/protection/quota/spending changes.

**Validation since resumption:** 17 controller rehearsals passed after flat-state/rollback changes; actionlint both workflows and bash syntax pass; reviewed-source gitleaks stdin scan over 75 files (~693,792 bytes) found no leaks before first system install. Later source/doc changes require final scan again before staging. Unchanged Next/image/browser checks reused; real CI will validate its exact final SHA/image. Backend actual health/identity/network/config/TLS checks passed after HTTP bootstrap, TLS revalidation and renewal. Dedicated SSH positive auth and forced-command rejection verified. Provider firewall account not accessed; OS firewall/binds audited.

**Actual backups/records:** `/var/lib/homemind-landingpage-bootstrap-20261002-proxy-snapshot` records initial no-landing-vhost baseline. Controller update backup `/var/backups/homemind-landingpage-release-before-reload-retry-20261002` (root-only), original controller SHA `f9cc5e5089d9f0f822eda19c4187fac1e1369caaef513bef47104cd1fcfa2253`; tested updated SHA `1efc067c5808ece0f79334b1f947f51f7a4f5703ad177535b93b457e1ff523db`. Initial user/sudoers had no prior files, so no previous authorized_keys/sudoers backup existed. No app root or releases tree created; public key stored only in standard root-owned config/authorized_keys. No TLS private keys or password values copied to repo/report.

**Pre-push remaining:** final current diff/source/staged secret review, activate readiness, authorized initial commit/push main, observe actual Actions build/private publish/deploy/public browser, verify live digest/commit and backend/external IPv4/IPv6 isolation. Actual Actions run/production image digest remains **NONE at this checkpoint**. Isolated rollback tests pass; no deliberate real production rollback yet and first release has no previous healthy landing. Later evidence must be appended here; do not assume this pre-push state remains current after a run.

## 10. Actual main push and CI — supersedes pre-push checkpoint

Readiness was enabled after verified TLS/renewal/bootstrap checks. Source secret scan passed over 79 files (720,333 bytes); staged secret scan passed over 42 files (459,184 bytes), and staged diff whitespace check passed. Deployment commit **0548fce8924f2889791a7179e6f5ad14949983b1** was created on main. First HTTPS push returned HTTP 408; remote HEAD was checked and still old. Retrying with per-command HTTP/1.1 succeeded, without changing remote history or persistent Git settings.

Actual push-triggered run: [37031410366](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37031410366). Secret scan, 17 controller tests, shell checks, npm ci/lint/typecheck/build and production Docker build passed. Desktop image smoke passed. Mobile smoke failed because the test required the section top to be within 130px; observed offset was 188.671875px. It stopped **before registry publication or VPS deployment**; deploy job was skipped. Production remained HTTPS maintenance, backend unaffected by this run.

Navigation assertion now checks the pricing heading starts outside the viewport and enters it after the click; mobile drawer must close. This validates navigation without assuming an exact offset while dynamic sections settle. Simulator, FAQ, same-origin assets, fonts, release identity and error checks remain enforced. Both local desktop/mobile smoke tests passed against the previously validated production build; no unchanged source/image build was repeated locally. CI must still validate the exact next commit/image.

Added reviewed read-only final evidence collectors in the existing deploy directory: `vps-production-verify.py` checks live image/digest/container constraints, protected backend, listeners and trusted TLS; `public-production-verify.py` checks fresh public A/AAAA, trusted TLS, canonical redirects, release/ready endpoint and external IPv4 slot-port denial. Neither reads secret values or mutates production. Admin SSH transport was disconnected by the peer; masked GUI authentication was reopened and user entered it. Host key remained the previously console-verified key; no password storage or repeated fingerprint request.

Current incomplete step: push the reviewed smoke correction, observe the new real main workflow, then collect final public/VPS evidence. Initial image/private GHCR pull/deployment are still unverified at this entry.

Second deployment commit **2beea14953f22047359b200807cbb39d9d38f4fc** pushed successfully. [Actual run 37032668153](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37032668153) passed all source/controller/production image/desktop/mobile/isolated failure tests. Image was published and pulled at **23:18:59 +07:00**, digest **sha256:f4804e5e23525cb39045e5277e1e9822689c8c78a4bceabbbb1569f92b2c7577**. Publication step then failed a silent assertion; deploy was skipped. No landing container was started. Revision/private-package/repository-association assertions now report their individual outcome without printing credentials, so the exact failing gate can be resolved rather than guessed.

Workstation DNS resolver intermittently failed even for GitHub/Google; explicit public DoH resolution plus normal hostname-verified HTTPS recovered read-only GitHub metadata/log access. The reviewed `github-run-evidence.py` uses existing gh keyring authentication in memory only, never token arguments/files/prints, never forwards GitHub credentials to signed log storage, and suppresses signed URLs on errors. System DNS and production DNS are unchanged. First optional artifact download was interrupted after network stalls; failed-step logs were recovered instead. A helper path typo briefly created only empty directories plus this helper outside the intended root; the sole file was moved into the existing repository, and only verified empty typo directories were removed. No legitimate work was deleted, no checkout/clone/alternative deployment root remains.

Third commit/main push **9f653c45e7c62237f2bab3917254800fc96369d9**, [push run 37034821204](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37034821204), identified the precise failure: **private package, matching revision, but REST repository field null**. Tested image digest **sha256:a19db73fc6b3620d8be70ad96a2c2f9c6b739d5680acb2675dcd53a14435f596** was published. Owner then connected the repository and supplied a GitHub UI screenshot showing Private, correct HomeMind_LandingPage association and 9f653c4 tag. Browser automation inventory was empty and IAB unavailable; no UI permission or credential change was attempted by the agent.

Rerun attempt 2 reused the immutable image (Docker build skipped; same digest), passed smoke, but job-token REST still returned null repository. This proves the mandatory field assertion causes a false stop in this environment; the underlying REST omission/cache/auth cause remains unconfirmed. Verification now enforces package private/name/owner, exact image OCI source and tested revision/digest; a nonempty wrong REST repository still fails. The separate repo-scoped packages:read deploy token must pull/verify the exact private digest before any candidate. No public registry exposure or credential/host-key/TLS check is relaxed.

At **23:43:31 +07:00**, fresh public A for apex/www/API remained 103.200.22.211; normal TLS/SAN validation passed (landing YE1 DER hash ca79010c4af076f70faba959004b005ebcc6f921a5b4de7205c818fa7c7ae18d; API YE2 DER hash bae2620cca619d1c20a769889dce3b5b957761bc5a56a1c92461a1ffca7aae5f). Backend ready returned 200 and identical 18-byte stable hash; landing still maintenance 503. Sanitized evidence: existing protected folder `public-predeploy-checkpoint-20261002.jsonl`.

User instructed retaining root credential only in session RAM and not asking repeatedly. Previous client had already cleared its credential and peer-disconnected transports were closed; that erased credential cannot be reconstructed. Revised workstation client keeps one RAM-only credential until explicit close, verifies the same approved host key on reconnect, and reconnects without another password request. It keeps the session on script failure and never automatically repeats a possibly interrupted mutation. **20 local unit tests passed**, including three isolated credential-lifetime/reconnect/no-replay tests (no network or real credential). Public final collector now uses explicit public DoH resolution within its process while preserving original TLS hostname checks, so it can operate despite the workstation resolver failure. No password store/file was created.


## 11. Current CI recovery ? 2026-10-03 00:15 +07:00

Existing project/branch are unchanged. Current committed HEAD is `5fa4a970ca93722b2f3d91dbfd7d69e7e5d0a47d`, already pushed to main. [Push run 37036808490](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37036808490) passed 20 unit tests, source checks, production image build, two browser smoke tests, isolated candidate failure containment and private publication. Tested digest: `sha256:3b0c5ad30723cbc5f97f267a290cdf5e19a1ce068a843725cf1aa3fb56c37cf6`.

Deploy attempts 1?2 failed SSH preparation. Existing secret metadata and verified known_hosts were reconciled using exact bytes over stdin. Attempt 3 passed preparation but SSH reported `error in libcrypto` while loading the private key, then authentication failed. No remote deployment command ran. The SSH-to-tee pipeline lacked pipefail, so its step and the conditional rollback step incorrectly reported success; public acceptance correctly failed on maintenance 503. **There was no actual release and no actual rollback.** Backend public readiness still matched the baseline at the last recorded public check; fresh post-release verification remains required.

The existing protected deployment key was validated locally against its public key and the same key was re-uploaded to `VPS_SSH_PRIVATE_KEY` through stdin with normalized encoding/newlines. No key pair was regenerated. The exact cause of the earlier malformed secret is not proven. No secret content was printed or saved into the repository. All five SSH secret names remain unchanged.

Workflow now explicitly selects `defaults.run.shell: bash`. GitHub uses `bash --noprofile --norc -eo pipefail` for explicit bash; unspecified shell uses `bash -e`. This makes SSH/pipeline failures fail the step and prevents a false-success rollback condition. [Official workflow shell documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#defaultsrun).

**FIRST_INCOMPLETE_SAFE_STEP:** validate and push this shell fix, observe the new actual main workflow, then collect production/public/backend evidence. Production currently remains landing maintenance 503; certificate and renewal preparation remain verified. Reuse installed root controller, protected backend inventory, certificate, SSH key and GHCR package. Do not rerun the old workflow with its known pipeline bug. No root credential is stored locally; the dedicated forced-command deploy key supplies the necessary CI access without another root password prompt.


### Controller token input fix ? 2026-10-03 00:23 +07:00

Commit `57c1f2fa1f52fef6c9b518a5144eb6a04b53dc7f` was pushed and [run 37039385165](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37039385165), number 5, built/tested/published private digest `sha256:854bc5d687f543c91a32520b19a2da2fb3daae057950557ba111e69eca986e6a`. SSH key authentication now succeeded. Root controller rejected registry stdin before login/pull with `Invalid registry credential input`; no candidate or route switch occurred. Explicit pipefail correctly failed deploy, skipped public acceptance and skipped conditional rollback.

The controller previously assumed only alphanumerics/underscore in a registry token. Credentials are opaque; the revised parser accepts 20?4096 printable ASCII characters, rejects whitespace/control/non-ASCII/oversize input, and passes the value only to Docker login stdin without shell evaluation. Actual token contents were never inspected or logged. Two regression tests cover punctuation-bearing formats and invalid/bounded input; all **22 unit tests passed**. Initial non-ASCII fixture was mangled by the workstation shell encoding; an explicit Python Unicode escape fixed the fixture, then all cases passed.

The owner supplied masked root input once for this new session. Current client retains it only in RAM, keeps transport open and can reconnect with the verified fingerprint; no password file/store was created. Read-only precheck confirmed original installed controller hash and no current landing release, with all protected backend checks passing. A locked scoped update backed up the controller to `/var/backups/homemind-landingpage-release-before-token-format-fix-20261003` and atomically replaced only `/usr/local/sbin/homemind-landingpage-release`. Old SHA256 `1efc067c5808ece0f79334b1f947f51f7a4f5703ad177535b93b457e1ff523db`; new SHA256 `f0cae86edce3e3f69e292edea344b71b3e8f87a38c400cf58b2de8f6afa643ed`. Protected backend/config/runtime checks and nginx validation passed before/after; no service reload/restart, backend modification or certificate change for this update.

Sanitized selected outputs remain in the existing protected local folder: `vps-controller-before-token-fix-20261003.jsonl` and `vps-controller-token-update-20261003.jsonl`. Reviewed operator payloads stay ignored inside the existing deploy directory. Next: secret-scan/commit/push the controller correction plus evidence, observe its actual main run, and collect final production verification using the retained root session.


## 12. First production release VERIFIED ? 2026-10-03 00:33 +07:00

[Actual push-triggered run 37040398669](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37040398669), number 6, attempt 1, completed **SUCCESS** for main commit `1c6c337463aea78f9cde79e3c2237cf302350ceb`. Build and deploy jobs succeeded. Secret scan, 22 unit tests, lint/typecheck/build, production Docker image, two pre-publication browser tests, isolated failed candidate, private GHCR publication/source/revision checks, root private pull, rollout and two real public desktop/mobile browser tests all passed. Conditional rollback was skipped because acceptance succeeded. This is actual automatic main deployment, not only a manual SSH run.

Tested/published/running image: `ghcr.io/quangvmzu/homemind-landingpage@sha256:4aafb7ec622f869956764bc20d09d4c98d191356a573d75006624e6a79482eec`. Root controller returned PASSED at **00:28:07 +07:00**. Release `6-1c6c337463ae-1790962080456603941`, high-watermark 6, healthy blue slot, no previous release. Container full ID `ce2952426558f9f66ca827d2d752fbcdb079e090314336b8d3a5ced26e3369f4`, StartedAt `2026-10-02T17:28:00.9683592Z`. Direct image inspection matched source/revision/digest; linux/amd64, 383,231,264 bytes. Node user, read-only root, 512 MiB/1 CPU, pids128, rotated 10m x3 logs, unless-stopped. **Only 127.0.0.1:3100 ? 3000**, separate blue network; 3101 remains reserved/free.

**Backend non-regression VERIFIED:** API and DB full IDs/StartedAt/bindings/networks/restart policies/health match original audit. Both remain running/healthy; NestJS port stays 127.0.0.1:3000 and DB has no host publication. Protected Compose/API/default vhost/hook hashes match. Nginx master remains PID2360/start-monotonic9085214578, nginx -t exit0. API readiness200, same 18-byte hash `31bf75f4c0a97cc1f7b60df824fa390b3be9ba014f29b63c87c698ba63d9a9fd`; API TLS certificate bytes unchanged.

**Public production VERIFIED at 00:28:38 +07:00:** apex/www A=103.200.22.211, AAAA empty; apex page200 and /healthz200 with expected commit/statusok. HTTP apex/www and HTTPS www all308 to https://homemind.vn/. All three hostnames pass normal TLS trust/SAN checks, TLSv1.3; landing YE1 expiry2026-12-31 21:40:04+07, API YE2 unchanged. External IPv4 3100/3101 connections denied; host has no global IPv6 address and ss shows no IPv6 landing listeners. This makes an external global IPv6 probe inapplicable at this observed topology; no IPv6 public exposure claimed from an unperformed probe. Certbot timer active/enabled; previous successful scoped renewal dry-run retained, not repeated.

Existing protected local folder retains selected evidence: `github-main-production-success-20261003.json`, `github-production-selected-lines-20261003.json`, `public-production-verified-20261003.jsonl`, `vps-production-verified-20261003.jsonl` (partial), `vps-production-completion-20261003.jsonl`, `vps-production-verified-complete-20261003.jsonl`. No secrets/env/private key/TLS key values. GitHub secret/variable names were rechecked; remote main matched exact deployed SHA.

Initial final collector stopped after container/listener evidence: ip JSON contained addr_info items without family and indexing raised KeyError. Remaining fields were independently collected read-only via /proc/net/if_inet6 plus normal TLS/runtime checks. One-line collector correction uses optional family lookup; full corrected read-only collector then completed PASSED. Production rollout had already succeeded; this was evidence tooling only. **Next safe step:** commit/push this verified collector correction and first-release evidence, then observe/verify the automatic update to the final main SHA. Root RAM-only session remains open and reconnects without another credential prompt.

Registry token compatibility change follows GitHub's advice to accept opaque tokens rather than legacy hardcoded patterns. [Official April 2026 token-format notice](https://github.blog/changelog/2026-04-24-notice-about-upcoming-new-format-for-github-app-installation-tokens/). Actual credential contents were not inspected.


## 13. Automatic update and two healthy slots VERIFIED ? 2026-10-03 00:40 +07:00

[Actual main run 37041534776](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37041534776), number7, attempt1, completed SUCCESS for `472c0f5ac6c203fc4b67a9b21c847be300159d8d`. All build, image tests, private publication, root deployment and public browser acceptance passed again. Current healthy green/127.0.0.1:3101 digest `sha256:0cf5453c8b38a24ceaa7ca08f13b03ca907fb488b3bbb0b5f7f50510cf864736`, release `7-472c0f5ac6c2-1790962662081558217`; previous healthy blue/127.0.0.1:3100 retains `1c6c337` and digest `sha256:4aafb7ec622f869956764bc20d09d4c98d191356a573d75006624e6a79482eec`. High-watermark7. Backend preservation, trusted TLS, timer and same source controller hash passed again. This proves normal update/switch while keeping the healthy previous slot; no deliberate rollback was performed.

Review found evidence collector compared every landing container against the current digest, which is wrong when the previous slot intentionally has an older image. It now matches each known slot against its own current/previous release record. The corrected full collector completed PASSED against both real healthy slots; output `vps-production-two-slot-20261003.jsonl` is preserved outside Git. No production mutation was required for this evidence tooling correction. Next: commit/push the final collector correction and observe the final main SHA; then append final local evidence without another report-only release.
