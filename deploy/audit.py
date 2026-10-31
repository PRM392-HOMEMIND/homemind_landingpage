#!/usr/bin/env python3
"""Read-only Linux inventory; emit selected fields, never full env/inspect/config."""
import datetime
import json
from pathlib import Path
import re
import shutil
import subprocess
import urllib.parse


def capture(args, timeout=20):
    if not shutil.which(args[0]):
        return None
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        return p.stdout if p.returncode == 0 else None
    except subprocess.TimeoutExpired:
        return None


def emit(name, value):
    print(json.dumps({"section": name, "value": value if value is not None else "NOT AVAILABLE / permission or command failure"}, ensure_ascii=False))


def safe_upstream(raw):
    raw = raw.strip().rstrip(";")
    parts = urllib.parse.urlsplit(raw)
    if parts.scheme in ("http", "https"):
        return urllib.parse.urlunsplit((parts.scheme, parts.hostname + (":" + str(parts.port) if parts.port else ""), parts.path, "", ""))
    return raw if re.fullmatch(r"[a-zA-Z0-9_$.:/\[\]-]+", raw) else "REDACTED"


def main():
    emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
    for title, args in [
        ("os", ["cat", "/etc/os-release"]), ("architecture", ["uname", "-m"]),
        ("memory", ["free", "-m"]), ("disk", ["df", "-h", "/", "/opt"]),
        ("listeners_all_ipv4_ipv6", ["ss", "-ltnup"]),
        ("process_names_only", ["ps", "-eo", "user,pid,comm"]),
        ("docker_version", ["docker", "version", "--format", "{{.Server.Version}} {{.Server.Arch}}"]),
        ("compose_version", ["docker", "compose", "version"]),
        ("compose_projects", ["docker", "compose", "ls", "--all", "--format", "json"]),
        ("systemd_services", ["systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend"]),
        ("renewal_timers", ["systemctl", "list-timers", "--all", "--no-pager"]),
        ("ufw", ["ufw", "status", "verbose"]),
        ("nft_tables", ["nft", "list", "tables"]),
        ("iptables_rules", ["iptables", "-S"]),
        ("ip6tables_rules", ["ip6tables", "-S"]),
        ("certificate_lineages", ["certbot", "certificates"]),
    ]:
        emit(title, capture(args))
    manifests = set()
    ids = capture(["docker", "ps", "-aq"])
    for cid in (ids or "").splitlines():
        row = {"id": cid}
        fields = {
            "name": "{{.Name}}", "image": "{{.Config.Image}}", "state": "{{.State.Status}}",
            "pid": "{{.State.Pid}}", "started_at": "{{.State.StartedAt}}", "restart_policy": "{{.HostConfig.RestartPolicy.Name}}",
            "bindings_including_stopped": "{{json .HostConfig.PortBindings}}",
            "network_names": "{{range $name, $network := .NetworkSettings.Networks}}{{$name}} {{end}}",
            "compose_project": '{{index .Config.Labels "com.docker.compose.project"}}',
            "compose_files": '{{index .Config.Labels "com.docker.compose.project.config_files"}}',
        }
        for name, expression in fields.items():
            row[name] = capture(["docker", "inspect", "--format", expression, cid])
        emit("container_selected_fields", row)
        if row["compose_files"] and row["compose_files"].strip() != "<no value>":
            manifests.update(row["compose_files"].strip().split(","))
    for directory in ("/opt", "/srv", "/root"):
        found = capture(["find", directory, "-maxdepth", "5", "-type", "f", "(", "-name", "compose*.yml", "-o", "-name", "compose*.yaml", "-o", "-name", "docker-compose*.yml", "-o", "-name", "docker-compose*.yaml", ")"])
        manifests.update((found or "").splitlines())
    for manifest in sorted(manifests):
        raw = capture(["docker", "compose", "-f", manifest, "config", "--format", "json"])
        if raw:
            try:
                parsed = json.loads(raw)
                emit("manifest_ports_networks", {"path": manifest, "services": {
                    name: {field: service.get(field) for field in ("ports", "expose", "network_mode", "networks", "restart")}
                    for name, service in parsed.get("services", {}).items()
                }})
            except json.JSONDecodeError:
                emit("manifest", {"path": manifest, "status": "JSON unsupported / inspect privately"})
        else:
            emit("manifest", {"path": manifest, "status": "unresolved or permission failure; inspect privately"})
    nginx = capture(["nginx", "-T"])
    if nginx:
        routes = []
        for line in nginx.splitlines():
            line = line.strip()
            if line.startswith("# configuration file "):
                routes.append(line)
            elif re.match(r"^(listen|server_name|location|ssl_certificate|ssl_certificate_key|include)\s", line):
                # Emit public routing and key PATH only; never key contents.
                if not any(x in line.lower() for x in ("password", "token", "secret", "authorization")):
                    routes.append(line)
            elif line.startswith("proxy_pass "):
                routes.append("proxy_pass " + safe_upstream(line.split(None, 1)[1]))
        emit("nginx_selected_routing", routes)
    for edge in ("caddy", "apache2", "httpd", "haproxy", "traefik", "nginx", "certbot", "pm2"):
        emit("tool_available", {edge: bool(shutil.which(edge))})
    # `pm2 jlist` may start a missing PM2 daemon. Read persisted metadata instead;
    # it is only a discovery hint, never live health or restart-policy proof.
    persisted = Path.home() / ".pm2/dump.pm2"
    if persisted.is_file():
        try:
            parsed = json.loads(persisted.read_text())
            emit("pm2_persisted_hints_not_live_health", [{"name": p.get("name"), "mode": p.get("exec_mode")} for p in parsed])
        except (OSError, json.JSONDecodeError):
            emit("pm2_persisted_hints_not_live_health", None)
    emit("cron_file_paths", [str(p) for directory in ("/etc/cron.d", "/var/spool/cron/crontabs") if Path(directory).exists() for p in Path(directory).glob("*") if p.is_file()])
    emit("limitations", "Run as the authenticated audit operator with appropriate sudo. PM2 inventories are user-specific. Inspect other-user PM2, relevant systemd definitions, proxy/control-panel ownership, Docker daemon networking and all ACME schedulers privately; this selected-field inventory is not a complete topology approval.")


if __name__ == "__main__":
    main()
