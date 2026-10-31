#!/usr/bin/env python3
"""Targeted read-only follow-up to the saved host audit; no credentials emitted."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import shlex
import socket
import subprocess
import urllib.parse
import urllib.request
import urllib.error


def call(args, timeout=20):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return result.stdout if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def emit(section, value):
    print(json.dumps({"section": section, "value": value}, ensure_ascii=False))


emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
roots = [path for path in ("/root", "/home", "/srv", "/opt", "/var/www", "/www", "/data") if Path(path).is_dir()]
found = call(["find", *roots, "-maxdepth", "8", "(", "-name", "node_modules", "-o", "-name", ".git", ")", "-prune", "-o", "-type", "d", "(", "-iname", "*homemind*landing*", "-o", "-iname", "homemind-landingpage", ")", "-print"], 40)
emit("existing_landing_project_directories", (found or "").splitlines())
for path in ("/opt/homemind-landingpage", "/opt/homemind", "/root/.docker", "/etc/nginx/sites-available/default", "/etc/nginx/sites-available/homemind-api"):
    p = Path(path)
    if p.exists():
        s = p.stat()
        emit("existing_path_metadata", {"path": path, "uid": s.st_uid, "gid": s.st_gid, "mode": oct(s.st_mode & 0o777), "symlink": p.is_symlink()})
emit("planned_user_identity", call(["getent", "passwd", "homemind"]))
emit("cpu_count", call(["nproc"]))
emit("nginx_runtime", call(["systemctl", "show", "nginx.service", "--property=MainPID,ActiveState,ExecMainStartTimestampMonotonic,FragmentPath"]))
emit("certbot_timer", call(["systemctl", "show", "certbot.timer", "--property=ActiveState,UnitFileState,NextElapseUSecRealtime"]))
emit("certbot_version", call(["certbot", "--version"]))
nginx_test = subprocess.run(["nginx", "-t"], capture_output=True, text=True, timeout=15)
emit("nginx_config_test_exit", nginx_test.returncode)
for p in sorted(Path("/etc/letsencrypt/renewal").glob("*.conf")):
    fields = {}
    for line in p.read_text().splitlines():
        if "=" not in line or line.lstrip().startswith("#"):
            continue
        key, value = [item.strip() for item in line.split("=", 1)]
        if key in ("authenticator", "installer", "webroot_path", "server", "key_type"):
            fields[key] = value
        if key in ("deploy_hook", "renew_hook", "post_hook", "pre_hook"):
            fields[key + "_executable_only"] = shlex.split(value)[0] if value else None
    emit("renewal_selected_fields", {"path": str(p), "fields": fields})
for p in sorted(Path("/etc/letsencrypt/renewal-hooks").rglob("*")):
    if p.is_file():
        body = p.read_bytes()
        emit("renewal_hook_metadata", {"path": str(p), "sha256": hashlib.sha256(body).hexdigest(), "nginx_test_present": b"nginx -t" in body, "nginx_reload_present": b"reload nginx" in body})
daemon = Path("/etc/docker/daemon.json")
if daemon.is_file():
    parsed = json.loads(daemon.read_text())
    emit("docker_daemon_network_settings", {key: parsed.get(key) for key in ("allow-direct-routing", "ipv6", "ip6tables", "iptables", "userland-proxy")})
network_ids = call(["docker", "network", "ls", "-q"])
for network_id in (network_ids or "").splitlines():
    raw = call(["docker", "network", "inspect", network_id])
    if raw:
        network = json.loads(raw)[0]
        emit("network_selected_fields", {key: network.get(key) for key in ("Id", "Name", "Driver", "Internal", "EnableIPv6", "IPAM")})
ids = call(["docker", "ps", "-aq"])
for cid in (ids or "").splitlines():
    raw = call(["docker", "inspect", cid])
    if not raw:
        continue
    item = json.loads(raw)[0]
    state = item["State"]
    emit("protected_runtime", {"id": item["Id"], "name": item["Name"], "started_at": state["StartedAt"], "running": state["Running"], "health_status": state.get("Health", {}).get("Status"), "restart_policy": item["HostConfig"]["RestartPolicy"], "bindings": item["HostConfig"]["PortBindings"], "networks": list(item["NetworkSettings"]["Networks"])})
    test = json.dumps(item["Config"].get("Healthcheck", {}).get("Test", []))
    urls = re.findall(r"https?://[a-zA-Z0-9_.:/-]+", test)
    emit("healthcheck_safe_url_hints", {"container": item["Name"], "urls": urls})
    for url in urls:
        parts = urllib.parse.urlsplit(url)
        if parts.hostname not in ("localhost", "127.0.0.1") or "health" not in parts.path:
            continue
        public = "https://api.homemind.vn" + parts.path
        try:
            try:
                response = urllib.request.urlopen(public, timeout=10)
            except urllib.error.HTTPError as error:
                response = error
            body = response.read(20000)
            emit("backend_health_observation", {"url": public, "status": response.code, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()})
        except Exception as error:
            emit("backend_health_observation", {"url": public, "error": type(error).__name__})
manifest = Path("/opt/homemind/compose.yaml")
if manifest.is_file():
    text = manifest.read_text()
    # Record port/network/resource declarations, never env or credentials.
    fields = [line for line in text.splitlines() if re.match(r"^\s*(ports:|expose:|networks:|network_mode:|restart:|mem_limit:|cpus:|internal:)", line)]
    emit("backend_manifest_selected_declarations", {"path": str(manifest), "sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(), "declarations": fields})
    emit("backend_manifest_interpolation_names_only", sorted(set(re.findall(r"\$\{([A-Z0-9_]+)", text))))
for port in (3100, 3101):
    for family, address in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        probe = socket.socket(family, socket.SOCK_STREAM)
        probe.settimeout(1)
        result = probe.connect_ex((address, port))
        probe.close()
        emit("candidate_listener_probe", {"address": address, "port": port, "accepts_connection": result == 0})
for p in (Path("/var/www/html/index.nginx-debian.html"), Path("/etc/nginx/sites-available/default"), Path("/etc/nginx/sites-available/homemind-api")):
    if p.is_file():
        emit("protected_file_hash", {"path": str(p), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
emit("registry_config_presence_only", {"path": "/root/.docker/config.json", "exists": Path("/root/.docker/config.json").is_file()})
