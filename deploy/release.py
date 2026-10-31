#!/usr/bin/env python3
"""Root-owned, digest-only release controller. No proxy is assumed or installed.

Production requires a separately audited root-owned proxy adapter and config.
Adapter commands: check, snapshot PATH, switch SLOT PORT, restore PATH.
Every command must be app-scoped; switch/restore must validate before reload.
"""
import contextlib
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path("/var/lib")  # Existing OS state directory; never an application/project root.
CODE = Path("/usr/local/sbin/homemind-landingpage-release")
SERVER = Path("/etc/homemind-landingpage.json")
ADAPTER = Path("/usr/local/sbin/homemind-landingpage-proxy")
MANIFEST = Path("/etc/homemind-landingpage-compose.yml")
LOCK = Path("/run/lock/homemind-landingpage.lock")
IMAGE = "ghcr.io/prm392-homemind/homemind-landingpage"
SOURCE = "https://github.com/PRM392-HOMEMIND/homemind_landingpage"
OWNER_POLICY = Path('/etc/homemind/f02-f12-local-release.json')
OWNER_RELEASE = 'OWNER_F02_F12_LOCAL_ONLY_20261027'

def owner_policy():
    value=json.loads(trusted(OWNER_POLICY).read_text())
    require(value.get('releaseId')==OWNER_RELEASE, 'Missing root-owned owner release authority')
    return value


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def read_registry_token(stream):
    # Credentials are opaque. Accept bounded printable ASCII, including modern
    # GitHub token punctuation, while rejecting whitespace/control characters.
    # This value goes only to docker login stdin, never shell evaluation.
    token = stream.readline(8193).rstrip("\r\n")
    require(re.fullmatch(r"[!-~]{20,4096}", token), "Invalid registry credential input")
    return token


def validate_release(sha, digest, sequence):
    require(re.fullmatch(r"[a-f0-9]{40}", sha), "Invalid commit SHA")
    require(re.fullmatch(r"sha256:[a-f0-9]{64}", digest), "Invalid image digest")
    require(re.fullmatch(r"[1-9][0-9]{0,11}", str(sequence)), "Invalid run number")


def trusted(path):
    """Reject writable code/config, symlinks and writable parent directories."""
    path = Path(path)
    require(path.is_absolute(), "Expected absolute protected path")
    for item in [path, *path.parents]:
        s = item.lstat()
        require(not stat.S_ISLNK(s.st_mode) and s.st_uid == 0 and not s.st_mode & 0o022,
                "Code/config path must be root-owned, non-writable and without symlinks")
    return path


def record(name, filename):
    require(re.fullmatch(r"[a-zA-Z0-9-]+", name), "Invalid record identity")
    require(re.fullmatch(r"[a-zA-Z0-9.-]+", filename), "Invalid record field")
    return ROOT / f"homemind-landingpage-{name}-{filename}"


def run(args, timeout=60, input=None):
    # No shell, eval, inherited Docker/Git/SSH configuration or credential output.
    try:
        result = subprocess.run(args, check=True, capture_output=True, text=True,
                                timeout=timeout, input=input, env={"PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", "HOME": "/root"})
        return result.stdout.strip()
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        raise RuntimeError(f"{Path(args[0]).name} operation failed or timed out") from error


def atomic_json(path, value):
    descriptor, name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    tmp = Path(name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            json.dump(value, stream, indent=2)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def get_url(url):
    require(urllib.parse.urlsplit(url).scheme in ("http", "https"), "Invalid observation URL")
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return response.status, response.read(2_000_000)
    except urllib.error.HTTPError as error:
        return error.code, error.read(2_000_000)


def smoke(url, sha):
    # nginx reload is graceful/asynchronous: briefly old workers can serve the
    # prior route. Retry full acceptance with normal trust, never bypass checks.
    for attempt in range(5):
        try:
            return smoke_once(url, sha)
        except (RuntimeError, urllib.error.URLError, TimeoutError):
            if attempt == 4:
                raise
            time.sleep(0.5)


def smoke_once(url, sha):
    code, body = get_url(url + "/healthz")
    require(code == 200 and json.loads(body)["release"] == sha, "Release identity/readiness mismatch")
    code, body = get_url(url + "/")
    require(code == 200 and b"HomeMind" in body, "Landing page not ready")
    assets = set(re.findall(rb'(?:src|href)="(/_next/static/[^"?#]+)', body))
    require(assets, "Missing generated assets")
    for asset in assets:
        require(get_url(url + asset.decode())[0] == 200, "Generated asset failed")
    for route in ("/robots.txt", "/sitemap.xml", "/favicon.ico", "/temp.png", "/googleeb07a4ac9bf011d2.html"):
        require(get_url(url + route)[0] == 200, "Required route/static asset failed")


def validate_config(c):
    require(c.get("audit_completed") is True, "Full VPS audit is required before bootstrap/deploy")
    require(c.get("transport") == "host-loopback", "Actual transport adapter/manifest must be implemented after audit")
    require(c.get("platform") in ("linux/amd64", "linux/arm64"), "Audited VPS platform required")
    require(c.get("public_url") == "https://homemind.vn", "Unexpected public URL")
    ports = c.get("ports", [])
    require(len(ports) == 2 and all(type(p) is int and 1024 <= p <= 65535 for p in ports)
            and ports[0] != ports[1], "Two distinct audited ports required")
    require(type(c.get("memory_mb")) is int and c["memory_mb"] >= 128, "Audited memory budget required")
    require(type(c.get("cpus")) in (int, float) and 0 < c["cpus"] <= 8, "Audited CPU budget required")
    for key in ("min_available_mb", "min_disk_mb", "drain_seconds"):
        require(type(c.get(key)) is int and c[key] > 0, f"Audited {key} required")
    require(c["drain_seconds"] >= 120, "Keep previous slot for at least 120 seconds")
    require(c.get("backend_observations") and c.get("backend_health_verified") is True,
            "A verified backend baseline/health endpoint is required; arbitrary 404 is insufficient")
    for observation in c["backend_observations"]:
        parts = urllib.parse.urlsplit(observation["url"])
        require(parts.scheme == "https" and not parts.username and not parts.password and not parts.query,
                "Backend observations must be public read-only HTTPS paths without credentials")
        require(type(observation["status"]) is int, "Backend baseline status required")
        if observation.get("sha256"):
            require(re.fullmatch(r"[a-f0-9]{64}", observation["sha256"]), "Invalid baseline body hash")
    require(c.get("protected_containers") or c.get("protected_systemd_units"), "Protected runtime identities required")
    for item in c.get("protected_containers", []):
        require(re.fullmatch(r"[a-f0-9]{64}", item["id"]), "Protected container ID required")
    for item in c.get("protected_systemd_units", []):
        require(re.fullmatch(r"[a-zA-Z0-9_.@-]+\.service", item["unit"]), "Invalid protected service")


class Controller:
    def __init__(self):
        require(os.geteuid() == 0, "Deployment requires the fixed sudo wrapper")
        trusted(CODE)
        self.config = json.loads(trusted(SERVER).read_text())
        validate_config(self.config)
        self.adapter = str(trusted(ADAPTER))
        self.manifest = trusted(MANIFEST)
        self.state_path = ROOT / "homemind-landingpage-state.json"
        self.state = json.loads(trusted(self.state_path).read_text()) if self.state_path.exists() else {"high_watermark": 0}

    def docker(self, *args, timeout=60):
        return run(["docker", *args], timeout)

    def authorize_local(self, sha):
        self.local_only=False
        if not OWNER_POLICY.exists():return
        import select
        require(select.select([sys.stdin],[],[],15)[0], 'Short-lived registry/metadata credential required')
        self.registry_token=read_registry_token(sys.stdin)
        def github(path):
            request=urllib.request.Request('https://api.github.com/repos/PRM392-HOMEMIND/homemind_landingpage/'+path,headers={'Authorization':'Bearer '+self.registry_token,'Accept':'application/vnd.github+json','User-Agent':'HomeMind-root-release'})
            with urllib.request.urlopen(request,timeout=15)as response:return json.load(response)
        pr=github('commits/'+sha+'/pulls')
        scoped=[p for p in pr if p['number']==3 and p.get('merged_at')and p['merge_commit_sha']==sha and p['base']['sha']=='c07da07ae6eea8ee43a1ac95dc06c7282368a7e2'and p['head']['ref']=='billing/f02-f12-recovery-20261027'and p['head']['repo']['full_name']=='PRM392-HOMEMIND/homemind_landingpage']
        if not scoped:return
        commit=github('git/commits/'+sha)
        require(commit['tree']['sha']==owner_policy().get('webTree'), 'Candidate tree differs from root-owned owner approval')
        self.local_only=True

    def acceptance(self, url, sha):
        if not getattr(self,'local_only',False):return smoke(url,sha)
        records=[getattr(self,'candidate',None),self.state.get('current'),self.state.get('previous')]
        release=next((r for r in records if r and r['sha']==sha),None)
        require(release is not None, 'No owned release for platform observation')
        ids=self.compose(release,'ps','-q','landing').split()
        require(len(ids)==1, 'Ambiguous owned landing container')
        state=json.loads(self.docker('inspect','--format','{{json .State}}',ids[0]))
        require(state['Running']and state.get('Health',{}).get('Status')=='healthy', 'Existing platform health monitor is not healthy')
        return {'platform_health':'healthy','functional_tests':'NOT_RUN_OWNER_EXCLUDED'}

    def proxy(self, *args):
        return run([self.adapter, *map(str, args)], 60)

    def protected(self):
        for item in self.config.get("protected_containers", []):
            result = json.loads(self.docker("inspect", "--format", "{{json .State}}", item["id"]))
            require(result["Running"] and result["StartedAt"] == item["started_at"], "Protected backend runtime changed")
            if item.get("health_status"):
                require(result.get("Health", {}).get("Status") == item["health_status"], "Protected container readiness changed")
            for field, expression in (("bindings", "{{json .HostConfig.PortBindings}}"), ("networks", "{{json .NetworkSettings.Networks}}"), ("restart_policy", "{{json .HostConfig.RestartPolicy}}")):
                if field in item:
                    actual = json.loads(self.docker("inspect", "--format", expression, item["id"]))
                    if field == "networks": actual = sorted(actual)
                    require(actual == item[field], "Protected backend networking/restart policy changed")
        for item in self.config.get("protected_files", []):
            require(hashlib.sha256(trusted(Path(item["path"])).read_bytes()).hexdigest() == item["sha256"], "Protected backend/proxy file changed")
        for item in self.config.get("protected_systemd_units", []):
            active = run(["systemctl", "show", item["unit"], "--property=ActiveState", "--value"])
            started = run(["systemctl", "show", item["unit"], "--property=ExecMainStartTimestampMonotonic", "--value"])
            require(active == "active" and started == item["started_at"], "Protected service runtime changed")
        for item in ([]if getattr(self,'local_only',False)else self.config["backend_observations"]):
            status, body = get_url(item["url"])
            require(status == item["status"], "Backend response differs from baseline")
            if item.get("sha256"):
                require(hashlib.sha256(body).hexdigest() == item["sha256"], "Backend response body differs from stable baseline")

    def capacity(self):
        mem = dict(line.split(":", 1) for line in Path("/proc/meminfo").read_text().splitlines())
        require(int(mem["MemAvailable"].split()[0]) // 1024 >= self.config["min_available_mb"], "Insufficient memory; backend remains untouched")
        require(shutil.disk_usage(ROOT).free // (1024 * 1024) >= self.config["min_disk_mb"], "Insufficient disk; no global cleanup permitted")
        version = self.docker("version", "--format", "{{.Server.Version}}")
        require(int(version.split(".")[0]) >= 28, "Docker <28 loopback exposure needs an audited mitigation before use; do not upgrade shared Docker automatically")
        machine = os.uname().machine
        expected = {"x86_64": "linux/amd64", "aarch64": "linux/arm64"}.get(machine)
        require(expected == self.config["platform"], "VPS platform does not match audit")

    def compose(self, release, *args, timeout=180):
        env_file = trusted(record(release["name"], "release.env"))
        manifest = trusted(record(release["name"], "compose.yml"))
        return self.docker("compose", "--project-name", "homemind-landingpage-" + release["slot"],
                           "--project-directory", "/", "--env-file", str(env_file),
                           "-f", str(manifest), *args, timeout=timeout)

    def check_port(self, slot, port):
        # All containers, including stopped ones. Only this exact slot may own the target binding.
        ids = self.docker("ps", "-aq").splitlines()
        owned_listener = False
        for cid in ids:
            ports = json.loads(self.docker("inspect", "--format", "{{json .HostConfig.PortBindings}}", cid)) or {}
            for bindings in ports.values():
                for bind in bindings or []:
                    if int(bind["HostPort"]) == port:
                        project = self.docker("inspect", "--format", '{{index .Config.Labels "com.docker.compose.project"}}', cid)
                        service = self.docker("inspect", "--format", '{{index .Config.Labels "com.docker.compose.service"}}', cid)
                        require(project == "homemind-landingpage-" + slot and service == "landing" and bind["HostIp"] == "127.0.0.1", "Port belongs to a protected or unknown container")
                        owned_listener = json.loads(self.docker("inspect", "--format", "{{json .State.Running}}", cid))
        sockets = run(["ss", "-H", "-ltn"])
        for line in sockets.splitlines():
            local = line.split()[3]
            if local.rsplit(":", 1)[-1] == str(port):
                require(owned_listener and local == "127.0.0.1:" + str(port), "Port belongs to an unrelated host/IPv6 process")

    def stop(self, release):
        self.compose(release, "stop", "--timeout", "30", "landing")
        self.compose(release, "rm", "--force", "landing")

    def pull(self, sha, digest):
        image = IMAGE + "@" + digest
        import select
        token=getattr(self,'registry_token',None)
        if token is None:
            require(select.select([sys.stdin], [], [], 15)[0], "Short-lived read:packages token is required through stdin")
            token = read_registry_token(sys.stdin)
        # Temporary root-only Docker auth in OS runtime storage, never shared auth.
        with tempfile.TemporaryDirectory(prefix="homemind-landingpage-ghcr-", dir="/run") as auth:
            os.chmod(auth, 0o700)
            run(["docker", "--config", auth, "login", "ghcr.io", "--username", "PRM392-HOMEMIND", "--password-stdin"], input=token + "\n")
            token = None
            self.registry_token=None
            run(["docker", "--config", auth, "pull", "--platform", self.config["platform"], image], 300)
        labels = json.loads(self.docker("image", "inspect", "--format", "{{json .Config.Labels}}", image))
        require(labels.get("org.opencontainers.image.revision") == sha and labels.get("org.opencontainers.image.source") == SOURCE,
                "Private image source/revision provenance mismatch")
        user = self.docker("image", "inspect", "--format", "{{.Config.User}}", image)
        require(user == "node", "Unexpected root runtime image")

    def make_release(self, sha, digest, sequence, slot):
        name = f"{sequence}-{sha[:12]}-{time.time_ns()}"
        port = self.config["ports"][0 if slot == "blue" else 1]
        release = {"app": "homemind-landingpage", "status": "candidate", "name": name, "sha": sha, "digest": digest, "sequence": int(sequence), "slot": slot, "port": port, "created": time.time()}
        shutil.copyfile(self.manifest, record(name, "compose.yml"))
        shutil.copyfile(SERVER, record(name, "server.json"))
        shutil.copyfile(self.adapter, record(name, "proxy-adapter"))
        os.chmod(record(name, "proxy-adapter"), 0o700)
        env = {"LANDING_IMAGE": IMAGE + "@" + digest, "LANDING_PLATFORM": self.config["platform"],
               "LANDING_HOST_PORT": port, "LANDING_MEMORY_LIMIT": str(self.config["memory_mb"]) + "m", "LANDING_CPU_LIMIT": self.config["cpus"]}
        record(name, "release.env").write_text("".join(f"{k}={v}\n" for k, v in env.items()))
        os.chmod(record(name, "release.env"), 0o600)
        atomic_json(record(name, "release.json"), release)
        return release

    def rollout(self, sha, digest, sequence, rollback=False):
        validate_release(sha, digest, sequence)
        self.authorize_local(sha)
        active = self.state.get("current")
        if not rollback and active and active["sha"] == sha and active["digest"] == digest and int(sequence) >= self.state["high_watermark"]:
            self.acceptance(self.config["public_url"], sha)
            self.protected()
            self.state["high_watermark"] = int(sequence)
            atomic_json(self.state_path, self.state)
            return {"status": "PASSED", "sha": sha, "digest": digest, "rollback": "not needed; already current"}
        require(rollback or int(sequence) > self.state["high_watermark"], "Stale or duplicate workflow rejected")
        current = self.state.get("current")
        previous = self.state.get("previous")
        slot = "green" if current and current["slot"] == "blue" else "blue"
        if current:
            require(time.time() - current["activated"] >= self.config["drain_seconds"], "Previous release still draining; retry after drain period")
        self.capacity()
        self.protected()
        self.proxy("check")
        self.pull(sha, digest)  # Pull and verify BEFORE any old landing container is touched.
        port = self.config["ports"][0 if slot == "blue" else 1]
        self.check_port(slot, port)
        release = self.make_release(sha, digest, sequence, slot)
        self.candidate=release
        snapshot = record(release["name"], "proxy-snapshot")
        self.proxy("snapshot", snapshot)
        trusted(snapshot)
        switched = False
        candidate_started = False
        step = "candidate"
        try:
            if previous and previous["slot"] == slot:
                self.stop(previous)
                self.state["previous"] = None
                atomic_json(self.state_path, self.state)
            self.check_port(slot, port)  # Recheck immediately before binding.
            candidate_started = True
            self.compose(release, "up", "-d", "--no-build", "--pull", "never", "--wait", "--wait-timeout", "120", "landing")
            self.acceptance("http://127.0.0.1:" + str(port), sha)
            step = "switch"
            switched = True  # Even a partially failing adapter must restore its snapshot.
            self.proxy("switch", slot, port)
            step = "post-switch"
            self.acceptance(self.config["public_url"], sha)
            self.protected()
            release["activated"] = time.time()
            release["status"] = "healthy"
            if self.local_only:release['owner_local_release']=OWNER_RELEASE
            new_state = {"high_watermark": max(int(sequence), self.state["high_watermark"]), "current": release, "previous": current}
            outcome = {"status": "PASSED", "sha": sha, "digest": digest, "rollback": "manual" if rollback else "not needed"}
            if self.local_only:outcome.update(status='DEPLOYED_OBSERVED',functional_tests='NOT_RUN_OWNER_EXCLUDED')
            atomic_json(record(release["name"], "release.json"), release)
            atomic_json(ROOT / "homemind-landingpage-last-outcome.json", outcome)
            atomic_json(self.state_path, new_state)
            self.state = new_state
            return outcome
        except Exception as original:
            restoration_errors = []
            for operation in ([lambda: self.proxy("restore", snapshot)] if switched else []) + [self.protected] + ([lambda: self.acceptance(self.config["public_url"], current["sha"])] if current else []):
                try:
                    operation()
                except Exception:
                    restoration_errors.append("restoration verification failed")
            if candidate_started and not restoration_errors:
                try:
                    self.stop(release)
                except Exception:
                    restoration_errors.append("candidate cleanup failed")
            outcome = {"status": "FAILED", "sha": sha, "digest": digest, "failed_step": step,
                       "rollback": "FAILED" if restoration_errors else ("previous release retained/restored" if current else "first deployment; no previous release"),
                       "restoration_errors": restoration_errors}
            atomic_json(record(release["name"], "release.json"), {**release, "status": "failed"})
            atomic_json(ROOT / "homemind-landingpage-last-outcome.json", outcome)
            raise RuntimeError(json.dumps(outcome)) from original

    def restore_previous(self, expected=None):
        current, previous = self.state.get("current"), self.state.get("previous")
        require(current and previous, "First deployment has no previous healthy release")
        if expected:
            sha, digest, sequence = expected
            validate_release(sha, digest, sequence)
            require(current["sha"] == sha and current["digest"] == digest and self.state["high_watermark"] == int(sequence),
                    "Rollback rejected: a different/newer release is current")
        # The old slot is retained, so restoration needs neither a rebuild nor downtime.
        self.protected()
        self.acceptance("http://127.0.0.1:" + str(previous["port"]), previous["sha"])
        snapshot = trusted(record(current["name"], "proxy-snapshot"))
        archived_adapter = trusted(record(current["name"], "proxy-adapter"))
        before = record(current["name"], "before-rollback-" + str(time.time_ns()))
        self.proxy("snapshot", before)
        trusted(before)
        targets = [("server.json", SERVER), ("compose.yml", MANIFEST), ("proxy-adapter", ADAPTER)]
        saved_config = [(dst, trusted(dst).read_bytes(), dst.stat().st_mode & 0o777) for _, dst in targets]
        try:
            run([str(archived_adapter), "restore", str(snapshot)], 60)
            self.acceptance(self.config["public_url"], previous["sha"])
            self.protected()
            # Adopt the previous immutable app/proxy configuration with routing already restored.
            for src, dst in targets:
                source = trusted(record(previous["name"], src))
                temporary = dst.with_suffix(".restore")
                shutil.copyfile(source, temporary)
                os.chmod(temporary, 0o755 if src == "proxy-adapter" else 0o600)
                os.replace(temporary, dst)
            previous = {**previous, "activated": time.time()}
            restored = {"high_watermark": self.state["high_watermark"], "current": previous, "previous": None}
            # Keep the replaced slot as a record, but it is not a healthy rollback target
            # after an external acceptance failure. Its next reuse is app-scoped.
            atomic_json(self.state_path, restored)
            self.state = restored
            outcome = {"status": "PASSED", "rollback": "previous image/configuration/upstream restored", "sha": previous["sha"], "digest": previous["digest"]}
            atomic_json(ROOT / "homemind-landingpage-last-outcome.json", outcome)
            return outcome
        except Exception as original:
            errors = []
            try:
                for dst, content, mode in saved_config:
                    temporary = dst.with_suffix(".restore")
                    temporary.write_bytes(content)
                    os.chmod(temporary, mode)
                    os.replace(temporary, dst)
                self.proxy("restore", before)
                self.protected()
                self.acceptance(self.config["public_url"], current["sha"])
            except Exception:
                errors.append("rollback restoration/verification failed")
            raise RuntimeError(json.dumps({"status": "FAILED", "rollback": "FAILED", "restoration_errors": errors})) from original

    def cleanup_records(self):
        # Config records only. Never delete Docker images, containers, networks or volumes.
        base = trusted(ROOT)
        protected_names = {item["name"] for item in (self.state.get("current"), self.state.get("previous")) if item}
        records = []
        for child in base.glob("homemind-landingpage-*-release.json"):
            match = re.fullmatch(r"homemind-landingpage-([1-9][0-9]{0,11}-[a-f0-9]{12}-[0-9]+)-release\.json", child.name)
            if child.is_symlink() or not child.is_file() or not match:
                continue
            metadata = json.loads(trusted(child).read_text())
            require(metadata.get("app") == "homemind-landingpage" and metadata.get("name") == match[1], "Unrecognized release record; cleanup stopped")
            require(child.resolve().parent == base.resolve(), "Cleanup escaped fixed app releases directory")
            records.append((child, metadata))
        records.sort(key=lambda item: item[1]["created"], reverse=True)
        healthy = [item["name"] for child, item in records if item.get("status") == "healthy"][:3]
        investigations = [item["name"] for child, item in records if item.get("status") != "healthy"][:1]
        retained = protected_names | set(healthy) | set(investigations)
        removed = []
        for child, metadata in records:
            name = metadata["name"]
            if name not in retained:
                for item in base.glob(f"homemind-landingpage-{name}-*"):
                    require(item.is_file() and not item.is_symlink(), "Unexpected state path; cleanup stopped")
                    trusted(item).unlink()
                removed.append(name)
        return {"removed_app_records": removed, "retained": sorted(retained)}


@contextlib.contextmanager
def lock():
    import fcntl
    descriptor = os.open(LOCK, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        metadata = os.fstat(descriptor)
        require(metadata.st_uid == 0 and not metadata.st_mode & 0o077, "Deployment lock must be root-owned and private")
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        os.close(descriptor)


def main():
    os.umask(0o077)
    with lock():
        c = Controller()
        if len(sys.argv) == 5 and sys.argv[1] == "deploy":
            print(json.dumps(c.rollout(*sys.argv[2:])))
        elif sys.argv[1:] == ["rollback"]:
            print(json.dumps(c.restore_previous()))
        elif len(sys.argv) == 5 and sys.argv[1] == "rollback-if":
            print(json.dumps(c.restore_previous(sys.argv[2:])))
        elif sys.argv[1:] == ["verify"]:
            current = c.state.get("current")
            require(current, "No successful release recorded")
            smoke(c.config["public_url"], current["sha"])
            c.protected()
            print(json.dumps({"status": "PASSED", "current": current}))
        elif sys.argv[1:] == ["status"]:
            print(json.dumps(c.state))
        elif sys.argv[1:] == ['owner-policy']:
            value=owner_policy();print(json.dumps({'releaseId':value['releaseId'],'webTree':value['webTree']}))
        elif sys.argv[1:] == ["cleanup-records"]:
            print(json.dumps(c.cleanup_records()))
        elif sys.argv[1:] == ["logs"]:
            require(c.state.get("current"), "No successful release recorded")
            print(c.compose(c.state["current"], "logs", "--tail", "100", "--no-color", "landing", timeout=30))
        else:
            raise RuntimeError("Usage: deploy SHA DIGEST RUN_NUMBER | rollback | verify | status")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
