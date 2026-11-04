# Runbook triển khai HomeMind landing page

## Trạng thái và phạm vi

**RESUMED_FROM_PREVIOUS_SESSION: 2026-10-02 22:08:27 +07:00.** Mục 8 báo cáo là checkpoint lịch sử; mục 9–10 lưu resume/CI, và mục final evidence sau đó là state mới nhất. Current main HEAD **5fa4a970ca93722b2f3d91dbfd7d69e7e5d0a47d**; push run **37036808490** đang chạy tại entry này. Không tạo app root, clone hay releases tree. Source chỉ ở existing local project; VPS dùng Docker và flat OS-managed wrapper/config/state files.

Scoped bootstrap đã thực hiện trên VPS; live image/main-triggered deploy pending tới khi có actual run evidence. Các lệnh Linux dưới đây chỉ áp dụng **sau khi** audit VPS, adapter proxy thực tế, TLS, registry và SSH riêng đã được cài đặt và kiểm chứng. Không chạy file `server.example.json` nguyên trạng: validator sẽ từ chối các giá trị chưa xác định.

Client operator hiện giữ credential **chỉ trong RAM của process đang mở**, reconnect bằng cùng credential/host-key policy, không hỏi lại trong phiên. Script lỗi không đóng phiên và không tự rerun mutation. Mặc định session tiếp tục nhận reviewed JSON requests; gửi `{"close":true}` hoặc explicit `--close-after-script` mới kết thúc và giải phóng credential. Khi process đã kết thúc, credential không tồn tại trong Windows/file store. Không copy từ chat vào argv/script/log. Production pipeline dùng dedicated forced deploy key, không cần root password.

GHCR package private đã được owner kết nối HomeMind_LandingPage trên UI. REST response của job token vẫn có repository null, nên chỉ từ chối một nonempty repository khác; private/name/owner, OCI source/revision/digest và private packages:read pull vẫn bắt buộc. Không đổi visibility, dùng persistent PAT hay bỏ host-key/TLS checks. Public collector dùng Cloudflare DoH trong riêng process, giữ nguyên hostname TLS, để không phụ thuộc resolver workstation bị lỗi.

Repository và GHCR phải giữ private. Backend và mọi hostname, port, mạng, certificate lineage, database, Supabase, auth, billing, webhook hiện hữu được bảo vệ. Không đổi port backend, không restart Docker/proxy dùng chung, không reboot, không dùng global prune hoặc shared Compose down.

## Hoàn tất các điều kiện ban đầu

1. Đã xác minh username root và SSH ED25519 fingerprint qua VPS console. **User yêu cầu không lưu root password; không dùng helper capture/DPAPI hay file mật khẩu.** Helper capture cũ giữ nguyên để không xóa công việc nhưng đã superseded. Sau khi user cho resume, client workstation `deploy/ssh-audit-client.py` dùng `getpass` no-echo trong terminal tương tác, mật khẩu chỉ trong bộ nhớ và không đưa vào argv/file/log. Phiên chờ cuối đã đóng trước xác thực khi pause. Không gửi lại password/token trong chat hoặc tự đổi password VPS.
2. Audit qua SSH bằng client workstation đã kiểm tra fingerprint trước xác thực. `deploy/audit.py` chỉ là bước khởi đầu: phải kiểm tra thêm toàn bộ manager/backend, file Compose, socket IPv4/IPv6, proxy/control panel, ACME, firewall và health endpoint thực tế. Không dùng 404 bất kỳ làm chứng minh backend khỏe.
3. User báo apex và www đã cấu hình DNS Vietnix. Sau resume kiểm tra authoritative/public A/AAAA/CAA; www A đã có một lần xác minh trên hai resolvers nhưng cache về sau chưa nhất quán, apex update mới chưa kiểm chứng. Không yêu cầu edit chỉ từ evidence cũ; giữ API/mail/TXT, không thêm AAAA nếu chưa có IPv6 hoạt động. Cấp SAN www chỉ sau kiểm chứng DNS/challenge/proxy thực tế.
4. Chọn đúng transport theo audit. Scaffold hiện hỗ trợ host proxy với hai port loopback; nếu proxy chạy trong container, phải triển khai network/adapter được proxy hỗ trợ. Không dùng 127.0.0.1 của proxy container để gọi loopback VPS và không tạo proxy cạnh tranh :80/:443.
5. Điền JSON root-only: architecture, hai port, CPU/memory/free-memory/disk budgets và backend baseline. Viết đúng một adapter proxy root-owned với `check`, `snapshot PATH`, `switch SLOT PORT`, `restore PATH`. Snapshot phải giữ đầy đủ cấu hình landing trước/sau, bao gồm trường hợp deploy đầu tiên. Validate trước mọi graceful reload; kiểm tra backend ngay sau reload.
6. Backup cấu hình ảnh hưởng vào thư mục root-only ngoài repo. `bootstrap.sh` yêu cầu audited JSON, adapter được root bảo vệ và public key Ed25519 riêng; nó không tự sửa proxy/TLS/firewall hay cài/upgrade Docker. Không tạo app root hoặc releases tree. User homemind đã audit collision trước khi tạo; state/backup dùng flat OS files.
7. Automatic deploy dùng GITHUB_TOKEN ngắn hạn của deploy job với packages:read, package private linked repository. Token đi qua SSH stdin, root Docker login password-stdin với temporary auth directory trong /run, cleanup sau pull. Không lưu PAT lâu dài hoặc đụng registry config backend. Private pull phải pass sau publish và trước candidate. Manual new-image deploy cần credential read:packages mới qua secure stdin; không gửi token trong chat.
8. Cài SSH forced-command riêng, wrapper/sudoers root-owned; user homemind không thuộc Docker group hay unrestricted sudo. Wrapper có quyền root/Docker bên trong, bị giới hạn bằng fixed path/config, image repository, digest/revision/source và argument validation; đây không phải Docker privilege isolation.
9. Cài TLS bằng manager đang có; giữ riêng landing lineage và mọi SAN backend. Không tham chiếu cert chưa tồn tại, không dừng edge để chạy standalone HTTP-01, không pin R13, không HSTS includeSubDomains/preload. Kiểm tra timer/storage/hook thực tế và renewal an toàn trước khi khai báo ready.

## Secrets và variables GitHub

Đã cấu hình đầy đủ tên secrets `VPS_HOST`, `VPS_SSH_PORT`, `VPS_DEPLOY_USER`, `VPS_SSH_PRIVATE_KEY` và `VPS_KNOWN_HOSTS`. Key riêng ngoài Git được dùng lại; host key khớp fingerprint console đã xác minh. Public key đã cài trên VPS, verified SSH identity đã pass và forced command đã từ chối lệnh ngoài phạm vi. Khi rotate, đọc private key qua stdin/secure file, không đưa nội dung vào `--body`, command/log hay YAML. Port khác 22 phải dùng `[host]:port` trong known_hosts.

Variables đã có `LANDING_PUBLIC_URL`, `LANDING_GHCR_IMAGE`, `LANDING_IMAGE_PLATFORM` và `LANDING_BOOTSTRAP_READY`. Platform là linux/amd64 sau audit; legacy LANDING_DEPLOY_ROOT đã bỏ vì không có project root trên VPS. READY chỉ true sau bootstrap/SSH/DNS/TLS/renewal/backend gates. Private pull thực tế xảy ra sau first CI publish, phải pass trước candidate/routing; không giả claim đã pull image chưa tồn tại. Không thay plan/quota/visibility/protection để bypass lỗi.

## Deploy thường lệ từ main

Push main của repo tin cậy kích hoạt workflow. CI checkout exact SHA, npm ci, lint/type/build, secret scan, controller tests, production image/browser tests và isolated failed candidate. Image dùng tag commit-SHA; tag đã tồn tại được pull/test lại, không ghi đè. Sau publish phải xác minh package private, liên kết đúng source repo và registry digest. Các official actions đều pinned full commit SHA, version được ghi comment.

Job deploy dùng concurrency riêng, không cancel deployment đang chạy. Trước SSH, CI so SHA với main hiện tại; server có app-only lock và high-watermark run number để từ chối workflow cũ. Retry đúng release đang chạy chỉ verify, không thay container. Manual dispatch branch khác main không deploy. PR workflow không publish/deploy và không dùng production secrets.

Server pull digest trước khi đụng inactive landing slot, validate provenance/resource/port, rồi khởi động candidate. Kiểm tra readiness/page/static assets trước khi switch; chỉ đổi landing upstream và graceful reload. Sau switch verify public HTTPS, release SHA và backend baseline/runtime. Slot trước giữ chạy qua drain tối thiểu 120 giây. Public browser acceptance ở Actions có conditional rollback: chỉ restore nếu chính SHA/digest/run đó vẫn đang current. Không rollback đè release mới hơn.

## Lệnh vận hành app-scoped sau bootstrap

```bash
# Status: current/previous digest, slot, release và freshness guard
sudo /usr/bin/python3 -I /usr/local/sbin/homemind-landingpage-release status

# Log tối đa 100 dòng của đúng service landing/current project
sudo /usr/bin/python3 -I /usr/local/sbin/homemind-landingpage-release logs

# Kiểm tra release HTTPS, assets và protected backend
sudo /usr/local/sbin/homemind-landingpage-verify

# Rollback về slot khỏe trước, chỉ nếu thực sự tồn tại
sudo /usr/local/sbin/homemind-landingpage-rollback

# Chỉ cleanup release RECORDS của app; không xóa images/networks/volumes
sudo /usr/bin/python3 -I /usr/local/sbin/homemind-landingpage-release cleanup-records
```

Deploy thủ công một release đã được CI duyệt: gọi `sudo /usr/local/sbin/homemind-landingpage-deploy COMMIT_SHA sha256:DIGEST RUN_NUMBER` sau khi thay cả ba bằng SHA 40 hex, digest 64 hex từ GHCR và workflow run number mới hợp lệ; wrapper từ chối placeholder/invalid values. Ưu tiên workflow main; không rebuild trên VPS hoặc dùng latest. Không bypass freshness để deploy commit cũ: dùng rollback đã ghi nhận.

Nếu deployment fails, đọc `/var/lib/homemind-landingpage-last-outcome.json` root-only và Actions summary. Candidate lỗi trước switch giữ current; lỗi switch/post-switch restore snapshot và verify cả hai dịch vụ nhưng workflow vẫn FAILED. Deploy đầu tiên không có previous release: không được báo rollback về version không tồn tại. Rollback thủ công kiểm tra slot retained, restore upstream/archived configuration, giữ high-watermark; replaced/failed release được giữ để điều tra và không coi là previous khỏe.

Giữ hai slot, ba successful records, newest failed/candidate và mọi record đang current/previous. Cleanup chỉ exact app-owned record directories đã kiểm tra resolved path. Không xóa dữ liệu persistent hay shared Docker resources.

## Chứng chỉ và renewal

Các lệnh read-only sau kiểm tra hostname/chain theo trust bình thường, không dùng -k:

```bash
curl --fail --show-error --max-time 15 https://homemind.vn/healthz
curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code} %{redirect_url}\n' http://homemind.vn/
openssl s_client -connect homemind.vn:443 -servername homemind.vn -verify_hostname homemind.vn -verify_return_error </dev/null
openssl s_client -connect homemind.vn:443 -servername homemind.vn </dev/null 2>/dev/null | openssl x509 -noout -issuer -subject -dates -ext subjectAltName
```

Actual manager là Certbot 2.9.0, webroot /var/www/homemind-acme, separate lineage homemind.vn; existing timer/hook retained. Operator check: sudo certbot renew --cert-name homemind.vn --dry-run --run-deploy-hooks --non-interactive. Xem actual rehearsal result trong báo cáo trước khi chạy lại. Nếu audit xác nhận host Nginx + Certbot, dùng webroot challenge riêng qua edge đang chạy, independent landing lineage, timer hiện hữu và safe reload hook; dry-run phải target đúng landing cert-name. Nếu manager khác/control panel/containerized proxy thì dùng cơ chế chính thức của manager đó, không cài Certbot cạnh tranh. [Certbot renewal guidance](https://eff-certbot.readthedocs.io/en/stable/using.html) chỉ áp dụng khi Certbot là manager đã được xác minh.

Khi renewal lỗi: kiểm tra A/AAAA/CAA, challenge response, CDN/proxy mode, firewall/provider, timer/storage trước khi retry; không retry issuance production vô hạn. Nếu CDN được phát hiện, kiểm tra cả edge và origin TLS với trusted HTTPS tới origin. Không đổi API certificate SAN list. Báo actual issuer/expiry; [R13 đã retired khỏi issuance](https://letsencrypt.org/certificates/).

## Credential rotation và recovery

Automatic registry token do GitHub rotate mỗi job, không có token registry persistent trên VPS. Manual PAT nếu cần chỉ đi qua secure stdin với quyền read:packages. Rotate deploy key: tạo key riêng trong thư mục bảo vệ, cập nhật authorized_keys forced-command qua operator root, cập nhật GitHub secret bằng stdin, test verified SSH, rồi bỏ key cũ; không in private key. Known_hosts chỉ cập nhật sau xác minh console khi host key đổi.

Root config /etc/homemind-landingpage.json, manifest /etc/homemind-landingpage-compose.yml; fixed wrappers /usr/local/sbin/homemind-landingpage-*; state /var/lib/homemind-landingpage-state.json và flat snapshots/records cùng prefix. Không có releases tree. Initial route snapshot /var/lib/homemind-landingpage-bootstrap-20261002-proxy-snapshot ghi baseline chưa có landing vhost. Operator restore riêng route: sudo /usr/local/sbin/homemind-landingpage-proxy restore /var/lib/homemind-landingpage-bootstrap-20261002-proxy-snapshot, chỉ khi thực sự cần, rồi verify nginx/backend. Không chạy chỉ vì resume. Bootstrap backup prior authorized_keys/sudoers nếu có bằng flat files với prefix /var/backups/homemind-landingpage-bootstrap-TIMESTAMP-PID-*; initial install không có prior files. Code/config update root phải compare old hash, backup đúng file, atomic replace và validate. Không dùng workflow-uploaded root code, restart backend hoặc xóa shared volumes.


### Current checkpoint ? 2026-10-03 00:15 +07:00

HEAD `5fa4a970ca93722b2f3d91dbfd7d69e7e5d0a47d` is pushed. Run 37036808490 build/private image checks passed, but SSH authentication failed before any release (invalid key format in the GitHub secret). Pipeline-to-tee without pipefail incorrectly labeled remote/rollback steps successful; no deployment or rollback actually occurred. Same verified key/known_hosts and metadata were reconciled through stdin; no new key pair. Explicit workflow bash now enables pipefail. Next: validate/push the fix, observe actual main run and verify live release plus protected backend. Certificate/renewal/bootstrap remain complete; landing still maintenance 503. Report section 11 is authoritative.


Current update at 00:23 +07:00 2026-10-03: run 37039385165 authenticated SSH but rejected opaque registry stdin before pull; no landing release/switch. Controller parser fix passed 22 tests and was installed atomically under the app lock, with protected backend/nginx checks passing. New controller SHA256 `f0cae86edce3e3f69e292edea344b71b3e8f87a38c400cf58b2de8f6afa643ed`; backup `/var/backups/homemind-landingpage-release-before-token-format-fix-20261003`. Root session is now retained with RAM-only credential; no password storage. Next safe step: scan/commit/push the correction, observe main CI and collect production evidence. Detailed evidence in report section 11.


### First production release verified ? 2026-10-03 00:33 +07:00

Actual main run [37040398669](https://github.com/PRM392-HOMEMIND/homemind_landingpage/actions/runs/37040398669) completed SUCCESS for `1c6c337463aea78f9cde79e3c2237cf302350ceb`, exact private digest `sha256:4aafb7ec622f869956764bc20d09d4c98d191356a573d75006624e6a79482eec`. Healthy blue container binds only127.0.0.1:3100. Source/unit/image/private pull/rollout and public desktop/mobile acceptance passed; API/DB IDs/start/binds/networks/health/config hashes and API certificate unchanged. Apex200, healthz expected SHA, HTTP/www308, normal TLS trust, Certbot timer active/enabled. External IPv4 slots denied; no global IPv6 or IPv6 landing listener. Full selected evidence in protected local folder; report section12 has IDs/hashes/timestamps. Collector missing-family compatibility fix was verified on VPS. Next: push that one-line operational fix and evidence, observe final main automatic update. No root password stored; session remains open in RAM.


### Automatic update verified ? 2026-10-03 00:40 +07:00

Run [37041534776](https://github.com/PRM392-HOMEMIND/homemind_landingpage/actions/runs/37041534776) SUCCESS, main `472c0f5ac6c203fc4b67a9b21c847be300159d8d`, current healthy green digest `sha256:0cf5453c8b38a24ceaa7ca08f13b03ca907fb488b3bbb0b5f7f50510cf864736`, previous healthy blue retained. Backend/config/TLS/timer unchanged. Collector now verifies each slot against its own release SHA/digest and completed PASSED with both real slots. Next: push that final tooling correction, observe final main automatic update, append final evidence locally. Report section13 is authoritative.
