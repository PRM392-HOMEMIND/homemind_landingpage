# HomeMind — audit evidence and outstanding VPS discovery

**RESUMED_FROM_PREVIOUS_SESSION at 2026-10-02 22:08:27 +07:00, Asia/Saigon.** The pause inventory below is historical. Appended resume audit and report sections 9–10 record actual preparation/CI; any final production evidence appended later is authoritative. Current main HEAD **5fa4a970ca93722b2f3d91dbfd7d69e7e5d0a47d**; actual push run **37036808490** is in progress. No alternative app/deployment root remains; source uses the existing project only.

## Repository and workstation

- Workspace: `D:\HomeMind\homemind-landing-page-main\homemind-landingpage`; no AGENTS.md found in workspace or ancestor paths.
- Private repository: `QuangVMZu/HomeMind_LandingPage`; authenticated GitHub CLI account matches owner, permissions admin/maintain/push/read. No visibility/protection/billing changes.
- Initial working tree clean at `f34f7e0`; fetched main and fast-forwarded the README-only upstream commit to `0249925f02e516901d2daff23a3b3d11c86b480b`. No local deployment commit or push.
- Remote main unprotected; rulesets empty; Actions enabled with all actions allowed. Initially zero workflow runs, no secrets/variables. No self-hosted runners. Hosted capacity/billing cannot be confirmed: current gh OAuth token lacks user scope; billing API returns 404. Package API also returns 404, but token lacks read:packages; this does not prove package absence.
- Next 16.3.1 (engine >=20.9.0), React/ReactDOM 19.2.8, npm package-lock v3; original scripts dev/build/start/lint; no existing tests, workflows or deployment definitions.
- App Router routes originally `/`, generated robots/sitemap and not-found. No middleware, next/image, runtime filesystem reads, markdown imports, backend API requests, auth/billing code, real forms, persistent uploads or application env usage found. `markdowns` contains docs only and is excluded from the image. Existing Unsplash avatars are ordinary HTTPS img elements. Geist fonts download during build and are packaged into static output.
- Existing metadata pointed to `homemind.myftp.biz`; updated existing URL fields to requested apex. `public/og-image.png` was already absent and remains absent; do not interpret this pre-existing social-preview issue as image deployment success.
- Local Node 22.20.0/npm 10.9.3. Docker CLI 29.1.4; installed Docker Desktop started without installing/upgrading it. Actual local Linux engine 29.6.1, x86_64. Production image validated with Node 24.21.0 on linux/amd64; this is **not VPS architecture evidence**.

## Public DNS evidence

At **20:09:52 +07:00** (13:09:52 UTC), independent 1.1.1.1 queries and Google DoH agreed on relevant records:

| Name | A | AAAA | CAA | Observation |
| --- | --- | --- | --- | --- |
| homemind.vn | NOERROR, no answer | no answer | no answer | Apex cannot resolve publicly |
| www.homemind.vn | NXDOMAIN | NXDOMAIN | NXDOMAIN | Optional www disabled |
| api.homemind.vn | 103.200.22.211, TTL 3600 | no answer | no answer | API resolves directly to requested VPS |

Authoritative nameservers: `ns1.vietnix.net`, `ns2.vietnix.net`, `nsbak.vietnix.net`. No apex CDN routing can be inferred with absent apex address records. No API CDN is evident from the matching origin IP; full host/provider audit remains pending. DNS provider account has not been accessed.

Historical proposed manual record was Vietnix **A, host @, value 103.200.22.211**. Subsequent user update: **www A=103.200.22.211 was verified** through both Google DoH and 1.1.1.1, TTL 3600; CNAME/CAA had no answers. Later cache responses were inconsistent (including cached www NXDOMAIN); no positive IPv6 address was observed. Apex had no A answer at the earlier checks. **User then reported apex DNS also configured. Verification after that apex update is PENDING, not evidence that a DNS edit is still required.** On explicit resumption, check authoritative Vietnix nameservers plus public resolvers for A/AAAA/CAA before ACME. Do not change API/mail/MX/TXT/verification records or add unverified IPv6. Neither apex nor www was enabled by this deployment, and no DNS action is allowed during pause.

## Read-only public/backend baseline

At **20:09:52 +07:00**, GET requests with normal trust validation and 10-second bounds:

| API HTTPS path | Status | Bytes | SHA256 of deterministic public error response |
| --- | --- | --- | --- |
| / | 404 | 70 | 30bdd64b1e13f2bf7026cc2cac5f23e493aa0707c21e5bf96cfab058b5f6c9b0 |
| /health | 404 | 76 | 8a5b9c567b0972dbf63f746d2d7d4b400c7519e147653e8cc6ffd84ac5ab4cdd |
| /healthz | 404 | 77 | 8130249e2832ac56f8b626d144f9a6ab2c342ef4712e61b7ea7665e2e7ee8484 |
| /api/health | 404 | 80 | cc7bcacc454b6ecb32de9eb47ab1beb4e38bce492714b3b7eba6693ece92110b |

These are limited observations, **not healthy endpoint proof**. No customer mutations, billing requests, webhooks or forms were sent. Discover actual safe health/routes from the running backend after SSH access.

At **20:31:55 +07:00**, direct origin HTTP requests to 103.200.22.211 with explicit Host headers and verified TLS SNI probes:

| Host | Origin HTTP / | Origin HTTPS normal trust |
| --- | --- | --- |
| homemind.vn | 200, nginx/1.24.0 (Ubuntu), 615-byte body | FAILED: hostname mismatch |
| www.homemind.vn | 200, same 615-byte body | FAILED: hostname mismatch |
| api.homemind.vn | 308 → https://api.homemind.vn/ | PASSED: TLSv1.3, hostname/chain trusted |

Apex/www origin HTTP body SHA256: `fb47468a2cd3953c7131431991afcc6a2703f14640520102eea0a685a7e8d6de`. The small body and nginx header are observations; they do not establish host-level proxy ownership or permission to replace an apex workload. Host routing and owners require inspection. No TLS trust bypass was used.

API certificate: issuer **Let's Encrypt YE2**, SAN **api.homemind.vn** only. Not before **2026-10-02 16:35:55 +07:00**, expires **2026-12-31 16:35:54 +07:00**. Normal Python SSL and curl trust/hostname validation passed; trusted origin certificate rechecked unchanged at 20:31:55. Actual renewal client, lineage/storage, timer and reload hook are UNKNOWN.

R13 is retired from subscriber issuance according to the current [Let's Encrypt hierarchy](https://letsencrypt.org/certificates/). No landing certificate was issued; YE2 is the existing API issuer, not a landing issuer.

## Explicit port/routing inventory — before and after this work

| Service | Runtime/owner | Container port | Host bind/IP:port | Domain | Proxy/upstream | Health observation | Protected/changeable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Existing backend | User reports NestJS; actual manager/PID/container UNKNOWN | UNKNOWN | Public origin answers :443; internal/published port UNKNOWN | api.homemind.vn; other domains UNKNOWN | nginx response observed; host/container/control panel/upstream UNKNOWN | Trusted TLS; root/probed health paths 404; true health UNKNOWN | PROTECTED; no changes |
| Existing public HTTP edge | Actual process/owner UNKNOWN | UNKNOWN | 103.200.22.211:80 externally responds; bind IPv4/IPv6 UNKNOWN | API redirects; apex/www 615-byte page | nginx headers observed; default vhost/route ownership UNKNOWN | Public HTTP observations above | PROTECTED until topology understood |
| Existing public HTTPS edge | Actual process/owner UNKNOWN | UNKNOWN | 103.200.22.211:443 externally responds; bind IPv4/IPv6 UNKNOWN | API valid TLS; apex/www mismatch | Edge config/ACME UNKNOWN | API trusted; apex absent usable TLS | PROTECTED; no changes |
| New landing on VPS | NOT CREATED | Planned 3000 | NONE selected or reserved | User reports apex/www DNS configured; fresh verification pending | NONE selected or installed | PAUSED / NOT RUN | Changeable only after resumption and audit |
| Other shared services | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT RUN | PROTECTED |
| Local validation only | Docker Desktop, node UID 1000 | 3000 | 127.0.0.1:3300; prior temporary smoke 3310 | localhost, not production | direct container access | healthy, desktop/mobile tests pass; local container retained at pause | Preserve during pause; no cleanup started |

Before/after VPS port/routing values are identical: **no SSH login, VPS provisioning, proxy edits, certificate issuance, restart or reload occurred**.

## Exact remaining read-only audit

1. User supplied bootstrap username **root** and explicitly confirmed via VPS console the ED25519 fingerprint `SHA256:PCSf/TeTiQPldznzJdSYfayLBzhZH6EsR+kHm2f3gVU`. No alternate project's key was reused. User's latest instruction prohibits saving the password, including encrypted storage. Windows capture dialog was already closed, and protected local folder contains only the dedicated deployment key pair and verified public known_hosts file, no password file. Latest getpass prompt was safely interrupted on pause before entering the password; SSH authentication has not occurred. Local fingerprint policy matched the verified key and rejected a mismatch in an isolated test. Actual host topology remains unknown.
2. Run reviewed `deploy/audit.py` with appropriate read-only sudo and redirect results to a root-only path outside Git. It selects Docker fields and proxy directives rather than printing env/full inspect/raw proxy config. It does not invoke PM2 jlist, which could spawn a daemon. Persisted PM2 hints are not live status.
3. Inspect OS/CPU/RAM/disk, ALL IPv4/IPv6 TCP/UDP sockets/owners, stopped Docker bindings, manifests outside standard paths, network memberships and daemon direct-routing behavior. Collector is a starting point, not complete audit proof.
4. Identify backend process/container/PM2/systemd runtime, actual internal/publication ports, every domain/upstream, restart policy and real read-only health endpoint; capture runtime identity, stable observations, published bindings and network names.
5. Identify exact proxy/control-panel management and supported safe config updates, port 80/443 owners, current default/apex routing, TLS manager, all cron/systemd renewal jobs, certificate storage, firewall/provider rules and preservation requirements.
6. Audit `/opt/homemind-landingpage` contents/ownership and `homemind` identity before use. Select and recheck two safe ports or approved existing proxy network, platform and budgets. Back up only affected files to a root-only location before mutation; record actual paths and restore commands.

Host firewall, provider firewall, all service identities, full networking, backup paths, production ports and production resource allocations remain **BLOCKED**, not passed.

## Resume audit — current evidence, 2026-10-02

Previous/current Git HEAD at recovery: `0249925f02e516901d2daff23a3b3d11c86b480b`, branch main, same 35 task files unstaged, origin unchanged. Existing documents and diff reviewed. Remote main matched HEAD after one transient GitHub TLS handshake timeout; no Actions runs. Five SSH secrets and prior variables still existed. Dedicated key reused. Windows protected directory and Credential Manager had no HomeMind root password credential, consistent with previous no-storage instruction. User entered masked ephemeral GUI input; actual verified-key SSH authentication succeeded. Password was not saved.

First full SSH inventory timestamp **22:10:30 +07:00**, targeted missing-fields follow-up **22:22:04 +07:00**. This was the first host audit, not a repeated completed audit. Protected selected-field JSONL evidence remains in `C:\Users\phuck\AppData\Local\HomeMindDeployment` (`vps-readonly-audit-20261002.jsonl`, `vps-followup-audit-20261002.jsonl`). No env/full inspect/raw proxy config printed.

- Ubuntu 24.04.3 LTS, x86_64; 16 CPUs; RAM 32,140 MiB, available 30,716 MiB at audit; swap 0. Disk 145G total/129G available.
- Docker 29.8.2 amd64, Compose v5.5.1, both already installed; no reinstall/upgrade. Compose project `homemind` uses `/opt/homemind/compose.yaml`; protected file SHA256 `f27730780431e8b25de08c77ef70b1118bd6ff686bec02839e4486007b5c4451`.
- ALL listening TCP/UDP sockets captured: sshd IPv4/IPv6 :22; host nginx IPv4/IPv6 :80 and IPv4 :443; docker-proxy 127.0.0.1:3000; systemd DNS loopback :53. Nginx master PID 2360, start-monotonic 9085214578. No other app listener or stopped container found; all Docker bindings include API 3000 only.
- UFW active, default deny incoming/routed, allows only 22/80/443 IPv4/IPv6. Docker NAT/filter and private networks recorded. Provider firewall account unavailable; no provider/firewall change performed. No positive public AAAA, no Docker network IPv6. Existing bridge CIDRs retained.
- Actual host Nginx (`nginx.service`) owns public edge. Only existing API vhost and default welcome route were present; default body hash matched `/var/www/html/index.nginx-debian.html`, so no intentional apex app was replaced. API upstream is **http://127.0.0.1:3000**. Actual ACME: Certbot **2.9.0**, webroot **/var/www/homemind-acme**, certbot.timer active/enabled. Existing deploy hook `homemind-nginx-reload` tests nginx then gracefully reloads; SHA256 `b5a7f31fd872911a109cf29c15ade753b44c11557adb0f481ef78056d851ddd6` retained.
- Search existing `/root`, `/home`, `/srv`, `/opt`, `/var/www`, `/www`, `/data` where present, depth 8 excluding node_modules/.git: **no landing project directory**. `/opt/homemind-landingpage` absent. No duplicate checkout or application directory created. OS-managed flat config/wrapper/state files are used per user's explicit directory exceptions.

| Service | Runtime/owner | Container port | Host bind/IP:port | Domain | Proxy/upstream | Health | Protection |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NestJS API | Docker `homemind-api-1`, node UID 1000; project homemind | 3000 | **127.0.0.1:3000** | api.homemind.vn | host Nginx → same loopback | Docker healthy; **/v1/health/ready 200** | Protected, unchanged |
| PostgreSQL | Docker `homemind-db-1`; project homemind | No host publication; actual DB listener kept private | **NONE published** | No public domain | internal homemind_database | Docker healthy | Protected, unchanged |
| Existing edge | nginx.service, root master PID 2360 | N/A | 0.0.0.0:80, [::]:80, 0.0.0.0:443 | API/default, then added landing only | separate new landing vhost | nginx -t pass | API/default configs preserved; graceful reload only |
| New landing slots | Unique Compose projects homemind-landingpage-blue/green | 3000 | Selected **127.0.0.1:3100 / 3101**, recheck before bind | apex; www canonical redirect | host Nginx | App image validated local; live candidate pending first CI | Changeable within landing scope |

Protected API full ID `04a00beefcc29b784a82bfd2466db3012f43d93fca279546247e7071339281d1`, StartedAt `2026-10-02T13:12:59.01289637Z`, image digest `sha256:8ae5d24c32e1951885e968bef07d0a241cf55239d8d82f547820fa2cf151489b`, restart unless-stopped, networks homemind_database + homemind_egress. Protected DB full ID `5c91b2699e466c7d2b717db2397cdab4b9d2dc17154b5016596c2c19acc8738f`, StartedAt `2026-10-02T13:12:41.456529181Z`, restart unless-stopped, network homemind_database only. Internal DB network 172.28.43.0/24; API egress network 172.28.42.0/24. All memberships/bindings/restart policies retained.

Actual ready endpoint `https://api.homemind.vn/v1/health/ready`: 200, 18 bytes, SHA256 `31bf75f4c0a97cc1f7b60df824fa390b3be9ba014f29b63c87c698ba63d9a9fd`. Public root 404/hash remains original observation. No payment/auth/database mutations, forms or webhooks were sent.

Fresh DNS: all three authoritative Vietnix servers plus Google/Cloudflare report apex and www **A=103.200.22.211**. AAAA: NOERROR/no address (SOA only); no IPv6 published. Raw authoritative CAA queries (type 257, AA=true) for both names: NOERROR/0 answers on all three servers; Google CAA same. Windows Resolve-DnsName/nslookup CAA unsupported; raw DNS fallback verified, not skipped. NS unchanged. No DNS edits.

Landing resource budget: each slot **512 MiB / 1 CPU**, pids 128, read-only/non-root, tmpfs, rotated logs, 30s graceful stop. Two slots together <=1 GiB/2 CPUs on audited 32 GiB/16 CPU host; min memory/disk gate 2048 MiB. Ports 3100/3101 no configured Docker bindings/manifests and no IPv4/IPv6 listeners at audit. Recheck occurs immediately before each candidate bind. No backend port/network changed.

Scoped production preparation now performed: fixed root-owned wrappers/config at `/usr/local/sbin/homemind-landingpage-*`, `/etc/homemind-landingpage.json` and `/etc/homemind-landingpage-compose.yml`; isolated homemind user with root-owned authorized_keys forced command, no Docker group/unrestricted sudo. Dedicated SSH key authenticated, unauthorized command rejected. Initial route restoration snapshot **/var/lib/homemind-landingpage-bootstrap-20261002-proxy-snapshot** (root-only flat file, initial landing vhost absent). Default/API vhost hashes preserved. Both public HTTP-01 probes passed. No application root/release directory tree created.

Landing HTTPS: separate lineage **homemind.vn**, SAN apex + www, normal trust/hostname TLSv1.3 passed on VPS and workstation, actual issuer **Let's Encrypt YE1**, notBefore **2026-10-02 21:40:05 +07:00**, expiry **2026-12-31 21:40:04 +07:00**. API remains YE2 with original SAN/dates and unchanged certificate bytes. Initial post-issuance client step reported failure without preserved detail; read-only diagnosis found certificate/vhost present, nginx -t pass, no active Certbot/no ACME error. Revalidation reused existing lineage and passed all TLS/backend checks without another issuance. Initial precise failure cause is unconfirmed; do not invent it. Renewal dry-run is the next gate. Ordinary landing HTTP redirects 308 to apex HTTPS; until first tested CI image, landing HTTPS returns maintenance 503.

Later evidence supersedes that renewal-pending entry: scoped renewal dry-run with deploy hook passed exit 0 at **22:49:12 +07:00**; timer active/enabled and API/backend retained. First three main runs published/tested immutable private images but skipped deploy; metadata gate remediation preserved private/source/revision checks. Owner linked package on GitHub UI. Fresh public A/TLS/backend readiness at **23:43:31 +07:00** passed; backend body hash matched baseline and landing was still maintenance 503. Evidence is `C:\Users\phuck\AppData\Local\HomeMindDeployment\public-predeploy-checkpoint-20261002.jsonl`. Runtime IDs/start/binds/networks/config hashes remain the protected baseline enforced before and after the actual CI deployment. Do not rerun a full audit or create another application root to finish the pending release.


### Current checkpoint ? 2026-10-03 00:15 +07:00

HEAD `5fa4a970ca93722b2f3d91dbfd7d69e7e5d0a47d` is pushed. Run 37036808490 build/private image checks passed, but SSH authentication failed before any release (invalid key format in the GitHub secret). Pipeline-to-tee without pipefail incorrectly labeled remote/rollback steps successful; no deployment or rollback actually occurred. Same verified key/known_hosts and metadata were reconciled through stdin; no new key pair. Explicit workflow bash now enables pipefail. Next: validate/push the fix, observe actual main run and verify live release plus protected backend. Certificate/renewal/bootstrap remain complete; landing still maintenance 503. Report section 11 is authoritative.


Current update at 00:23 +07:00 2026-10-03: run 37039385165 authenticated SSH but rejected opaque registry stdin before pull; no landing release/switch. Controller parser fix passed 22 tests and was installed atomically under the app lock, with protected backend/nginx checks passing. New controller SHA256 `f0cae86edce3e3f69e292edea344b71b3e8f87a38c400cf58b2de8f6afa643ed`; backup `/var/backups/homemind-landingpage-release-before-token-format-fix-20261003`. Root session is now retained with RAM-only credential; no password storage. Next safe step: scan/commit/push the correction, observe main CI and collect production evidence. Detailed evidence in report section 11.


### First production release verified ? 2026-10-03 00:33 +07:00

Actual main run [37040398669](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37040398669) completed SUCCESS for `1c6c337463aea78f9cde79e3c2237cf302350ceb`, exact private digest `sha256:4aafb7ec622f869956764bc20d09d4c98d191356a573d75006624e6a79482eec`. Healthy blue container binds only127.0.0.1:3100. Source/unit/image/private pull/rollout and public desktop/mobile acceptance passed; API/DB IDs/start/binds/networks/health/config hashes and API certificate unchanged. Apex200, healthz expected SHA, HTTP/www308, normal TLS trust, Certbot timer active/enabled. External IPv4 slots denied; no global IPv6 or IPv6 landing listener. Full selected evidence in protected local folder; report section12 has IDs/hashes/timestamps. Collector missing-family compatibility fix was verified on VPS. Next: push that one-line operational fix and evidence, observe final main automatic update. No root password stored; session remains open in RAM.


### Automatic update verified ? 2026-10-03 00:40 +07:00

Run [37041534776](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37041534776) SUCCESS, main `472c0f5ac6c203fc4b67a9b21c847be300159d8d`, current healthy green digest `sha256:0cf5453c8b38a24ceaa7ca08f13b03ca907fb488b3bbb0b5f7f50510cf864736`, previous healthy blue retained. Backend/config/TLS/timer unchanged. Collector now verifies each slot against its own release SHA/digest and completed PASSED with both real slots. Next: push that final tooling correction, observe final main automatic update, append final evidence locally. Report section13 is authoritative.
