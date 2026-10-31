# HomeMind deployment plan

**RESUMED_FROM_PREVIOUS_SESSION: 2026-10-02 22:08:27 +07:00 (Asia/Saigon).** Historical pause checkpoint is report section 8. Recovery HEAD was `0249925f02e516901d2daff23a3b3d11c86b480b`; current main/local/remote HEAD is **5fa4a970ca93722b2f3d91dbfd7d69e7e5d0a47d**. Three earlier CI runs/fixes and the owner-verified private package association are preserved in report section 10. [Current push run 37036808490](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37036808490) is in progress; final production evidence must supersede this in-progress entry. Existing source path/work reused, no restart/clone/alternative deployment root remains.

**New directory rule:** do not create `/opt/homemind-landingpage` or any application/deployment root or `releases/` tree. Application source remains only in the existing Windows project; VPS uses Docker internal storage, flat OS-managed files under `/usr/local/sbin`, `/etc`, `/var/lib`, and `/run/lock`, plus the existing Nginx/Certbot directories. No repository copy on VPS. Registry auth uses a short-lived packages:read job token through SSH stdin and a root-only temporary Docker config under `/run`, cleaned after pull. No persistent PAT is needed for automatic deployment.

Historical pause authority: [report, section 8](HOMEMIND_LANDINGPAGE_DEPLOYMENT_REPORT_VI.md#8-checkpoint-tạm-dừng--paused-safely). Existing workspace remains `D:\HomeMind\homemind-landing-page-main\homemind-landingpage`, branch main. Four authorized deployment commits have been pushed since resumption; scoped VPS bootstrap/TLS/renewal preparation is complete. Password stays only in an explicitly open operator session's RAM; peer-disconnected old clients had already erased it. The revised client retains RAM credential/reconnects until explicit close, never repeats an interrupted operation automatically.

## Checkpoints

| Step | State | Evidence / gate |
| --- | --- | --- |
| Repository identity and instructions | VERIFIED | Private QuangVMZu/HomeMind_LandingPage; main; no AGENTS.md; originally clean. Fetched and fast-forwarded README-only upstream commit 0249925. |
| GitHub authentication / permissions | VERIFIED | Existing gh keyring login; repository admin/push; Actions enabled; no rulesets, secrets or variables initially. Package API 404 is inconclusive because current OAuth token lacks read:packages. |
| Source audit | VERIFIED | Next 16.3.1, React 19.2.8, npm lock; App Router; no runtime markdown reads, application environment variables, backend fetches, forms or persistent uploads found. Fonts downloaded at build; avatar images fetched externally. |
| Public DNS and backend TLS baseline | VERIFIED CURRENT | Apex/www A=103.200.22.211 on 3 authoritative NS + Google/Cloudflare; no AAAA/CAA answer. API trusted YE2, actual backend readiness 200/identities/network/hashes unchanged. |
| Trusted SSH access and full VPS audit | VERIFIED | Masked ephemeral GUI input; authenticated against the previously verified ED25519 key. First full collector and targeted follow-up completed; no password file. Ubuntu 24.04.3, amd64, Docker 29.8.2, Compose 5.5.1; actual backend and healthy route discovered. |
| Select proxy, ports/network and resource limits | VERIFIED | Existing host Nginx; loopback slots 3100/3101 free in sockets and all configured container bindings/manifests. VPS 16 CPUs, 32,140 MiB RAM; landing 512 MiB/1 CPU per slot, min available/disk 2048 MiB. Never change backend 127.0.0.1:3000. |
| Docker / validation / release controller | VERIFIED LOCALLY | Node 24.21.0 image builds, non-root/read-only container healthy; desktop/mobile smoke and isolated Docker failure candidate pass; 17 isolated controller tests pass; lint/type/build, Compose, shellcheck/actionlint pass. Actual proxy/transport integration remains dependent on VPS audit. |
| Scoped bootstrap and pull identity | BOOTSTRAP VERIFIED / FIRST PULL PENDING CI | Fixed root-owned system files/user/forced key/sudoers installed, no app root. Dedicated SSH key authenticated; unauthorized command rejected. Actual private pull follows first CI publication before candidate, deploy-job packages:read token via stdin. |
| DNS / landing certificate / renewal | VERIFIED | HTTP-01 both names pass; separate trusted YE1 cert/SAN apex+www, expiry 2026-12-31 21:40:04 +07. Existing Certbot timer/hook reused, scoped renewal dry-run with hook exit 0 at 22:49:12. API cert/backend unchanged. |
| Initial commit / main push | COMPLETED | 0548fce, 2beea14, 9f653c4, 5fa4a97 reviewed/scanned commits pushed without force. Current staged scan 5 files/84,142 bytes pass; 20 local controller/session tests pass, actionlint pass. |
| Main-triggered run / public acceptance | IN PROGRESS | Actual push run 37036808490 for 5fa4a97; prior image/browser tests/private publish verified. Runtime/public acceptance must be observed before declaring success. |

GitHub dedicated SSH secrets/key/verified known_hosts were reused; key installed and positive auth/forced-command rejection verified. Variables are configured, readiness true, platform linux/amd64. Owner connected private GHCR package with HomeMind_LandingPage and supplied screenshot proof. Job-token REST still omitted repository; verify private owner/name, immutable digest and OCI source/revision, reject a nonempty mismatching repository, and require packages:read pull before candidate.

## Architecture decision gate

Production architecture was selected from actual audit: existing host Nginx, separate landing vhost, per-slot loopback 3100/3101→container 3000, unique Compose projects, 512 MiB/1 CPU per slot. Backend remains 127.0.0.1:3000 and its private networks. Root-owned fixed OS config/controller/proxy are installed; no competing proxy or app root. Provider firewall was not accessed; OS bindings/firewall baseline and external slot-port probes are the relevant evidence.

Protected: every existing backend/container/process, backend DNS and TLS lineage, Supabase, authentication, billing, webhooks, databases, mail/TXT records, shared networks and volumes. Public API 404 observations are limited baseline evidence, not healthy checks.

## Sequencing and restoration

1. Finish local validation, image smoke tests and isolated rollback rehearsal.
2. Establish trusted SSH; read OS/architecture/resources, all sockets and configured/stopped Docker bindings, manifests, proxy/control-panel ownership, renewal, firewalls and backend identities. Store raw sanitized evidence outside Git.
3. Record actual architecture, two slot ports/network, backend baseline and safe health endpoint. Use flat root-only restoration records in existing OS state/backup directories; no new application root or release tree. Initial routing snapshot: `/var/lib/homemind-landingpage-bootstrap-20261002-proxy-snapshot`.
4. Implement only the actual proxy adapter, supporting snapshot, candidate validation, graceful switch and restore. Validate configuration before every reload; check protected backend immediately afterward. Do not replace an occupied production apex route without approval.
5. Provision fixed root-owned system wrappers/config, isolated deploy identity and forced-command key; use narrow sudo, never Docker-group membership. The deploy job sends its short-lived read token through SSH stdin; root creates a dedicated temporary Docker auth config only during pull. No shared backend registry config touched and no workflow-uploaded code runs as root.
6. Configure selected TLS manager, independent landing certificate and renewal. Verify DNS/CAA/challenge first, trust chain, issuer, expiry and scoped renewal test. No R13 pinning; no staging certificate in production.
7. Configure matching GitHub secret/variable names, audited architecture, private package access and capacity. Check diff and history with a redacted secret scan. Commit and push only after bootstrap prerequisites pass.
8. Candidate starts alongside current landing, with readiness checks before routing switch. Lock and monotonically increasing workflow run number prevent late releases; workflow also compares SHA against current main immediately before SSH. Store digest/config/snapshot before switching; failure restores prior upstream and verifies both services. First deployment reports no prior release.
9. Observe actual Actions run; verify commit/digest, desktop/mobile browser, HTTP redirect, TLS, assets, backend identity/non-regression and external app-port isolation. Keep previous healthy slot; drain before slot reuse, retain three scoped release records; never global prune.

## Resume

State recovery completed. **FIRST_INCOMPLETE_SAFE_STEP was first SSH/VPS audit**, now completed along with TLS/renewal/bootstrap. Current safe step is observe run 37036808490, then final public and protected-backend verification. Reuse existing key/secrets/root config/certificate and saved inventory; do not repeat provisioning/issuance. Report sections 9–10 preserve resume and real CI evidence; any subsequent final entry is authoritative.


### Current checkpoint ? 2026-10-03 00:15 +07:00

HEAD `5fa4a970ca93722b2f3d91dbfd7d69e7e5d0a47d` is pushed. Run 37036808490 build/private image checks passed, but SSH authentication failed before any release (invalid key format in the GitHub secret). Pipeline-to-tee without pipefail incorrectly labeled remote/rollback steps successful; no deployment or rollback actually occurred. Same verified key/known_hosts and metadata were reconciled through stdin; no new key pair. Explicit workflow bash now enables pipefail. Next: validate/push the fix, observe actual main run and verify live release plus protected backend. Certificate/renewal/bootstrap remain complete; landing still maintenance 503. Report section 11 is authoritative.


Current update at 00:23 +07:00 2026-10-03: run 37039385165 authenticated SSH but rejected opaque registry stdin before pull; no landing release/switch. Controller parser fix passed 22 tests and was installed atomically under the app lock, with protected backend/nginx checks passing. New controller SHA256 `f0cae86edce3e3f69e292edea344b71b3e8f87a38c400cf58b2de8f6afa643ed`; backup `/var/backups/homemind-landingpage-release-before-token-format-fix-20261003`. Root session is now retained with RAM-only credential; no password storage. Next safe step: scan/commit/push the correction, observe main CI and collect production evidence. Detailed evidence in report section 11.


### First production release verified ? 2026-10-03 00:33 +07:00

Actual main run [37040398669](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37040398669) completed SUCCESS for `1c6c337463aea78f9cde79e3c2237cf302350ceb`, exact private digest `sha256:4aafb7ec622f869956764bc20d09d4c98d191356a573d75006624e6a79482eec`. Healthy blue container binds only127.0.0.1:3100. Source/unit/image/private pull/rollout and public desktop/mobile acceptance passed; API/DB IDs/start/binds/networks/health/config hashes and API certificate unchanged. Apex200, healthz expected SHA, HTTP/www308, normal TLS trust, Certbot timer active/enabled. External IPv4 slots denied; no global IPv6 or IPv6 landing listener. Full selected evidence in protected local folder; report section12 has IDs/hashes/timestamps. Collector missing-family compatibility fix was verified on VPS. Next: push that one-line operational fix and evidence, observe final main automatic update. No root password stored; session remains open in RAM.


### Automatic update verified ? 2026-10-03 00:40 +07:00

Run [37041534776](https://github.com/QuangVMZu/HomeMind_LandingPage/actions/runs/37041534776) SUCCESS, main `472c0f5ac6c203fc4b67a9b21c847be300159d8d`, current healthy green digest `sha256:0cf5453c8b38a24ceaa7ca08f13b03ca907fb488b3bbb0b5f7f50510cf864736`, previous healthy blue retained. Backend/config/TLS/timer unchanged. Collector now verifies each slot against its own release SHA/digest and completed PASSED with both real slots. Next: push that final tooling correction, observe final main automatic update, append final evidence locally. Report section13 is authoritative.
