#!/usr/bin/env python3
"""Fixed host-Nginx landing route. Preserves every unrelated virtual host."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

SITE = Path("/etc/nginx/sites-available/homemind-landingpage")
LINK = Path("/etc/nginx/sites-enabled/homemind-landingpage")
SERVER = Path("/etc/homemind-landingpage.json")
MARKER = "# Managed HomeMind landing page; repo=QuangVMZu/HomeMind_LandingPage\n"


def require(value, message):
    if not value:
        raise RuntimeError(message)


def call(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=20)
    require(result.returncode == 0, Path(args[0]).name + " operation failed; raw output suppressed")
    return result.stdout


def render(port=None, tls=True):
    http = MARKER + """server {
    listen 80;
    listen [::]:80;
    server_name homemind.vn www.homemind.vn;
    location ^~ /.well-known/acme-challenge/ { root /var/www/homemind-acme; }
    location / { return 308 https://homemind.vn$request_uri; }
}
"""
    if not tls:
        return http.replace("return 308 https://homemind.vn$request_uri;", "return 503;")
    upstream = "return 503;" if port is None else f"""proxy_pass http://127.0.0.1:{port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;"""
    return http + f"""server {{
    listen 443 ssl;
    server_name www.homemind.vn;
    ssl_certificate /etc/letsencrypt/live/homemind.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homemind.vn/privkey.pem;
    return 308 https://homemind.vn$request_uri;
}}
server {{
    listen 443 ssl;
    server_name homemind.vn;
    ssl_certificate /etc/letsencrypt/live/homemind.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homemind.vn/privkey.pem;
    location / {{
        {upstream}
    }}
}}
"""


def check():
    require(os.geteuid() == 0, "Root operator required")
    for item in json.loads(SERVER.read_text()).get("protected_files", []):
        require(hashlib.sha256(Path(item["path"]).read_bytes()).hexdigest() == item["sha256"], "Protected proxy/backend file changed")
    if SITE.exists():
        require(not SITE.is_symlink() and SITE.stat().st_uid == 0 and not SITE.stat().st_mode & 0o022, "Landing vhost ownership invalid")
        require(SITE.read_text().startswith(MARKER), "Existing vhost is not owned by this deployment")
    if LINK.exists() or LINK.is_symlink():
        require(LINK.is_symlink() and LINK.readlink() == SITE, "Unexpected landing enabled-site path")
    source = None
    for line in call(["nginx", "-T"]).splitlines():
        line = line.strip()
        if line.startswith("# configuration file "):
            source = line[len("# configuration file "):].rstrip(":")
        if line.startswith("server_name "):
            names = line.split()[1:]
            if any(name.rstrip(";") in ("homemind.vn", "www.homemind.vn") for name in names):
                require(source in (str(SITE), str(LINK)), "Another vhost now owns the landing domain; stop before replacing it")
    call(["nginx", "-t"])


def atomic_text(path, text, mode=0o644):
    fd, name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "w") as stream:
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(name, mode)
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)


def snapshot(path):
    require(path.parent == Path("/var/lib") and re.fullmatch(r"homemind-landingpage-[a-zA-Z0-9-]+-(proxy-snapshot|before-rollback-[0-9]+)", path.name), "Snapshot must use the fixed OS-state filename")
    require(not path.is_symlink(), "Unexpected snapshot symlink")
    value = {"app": "homemind-landingpage", "content": SITE.read_text() if SITE.exists() else None, "enabled": LINK.is_symlink()}
    atomic_text(path, json.dumps(value), 0o600)


def apply(content, enabled=True):
    previous = SITE.read_text() if SITE.exists() else None
    linked = LINK.is_symlink()
    try:
        if content is None:
            LINK.unlink(missing_ok=True)
            SITE.unlink(missing_ok=True)
        else:
            require(content.startswith(MARKER), "Unrecognized landing snapshot")
            require("api.homemind.vn" not in content, "Snapshot must never change backend routing")
            atomic_text(SITE, content)
            if enabled and not LINK.is_symlink(): LINK.symlink_to(SITE)
            if not enabled: LINK.unlink(missing_ok=True)
        check()
        call(["systemctl", "reload", "nginx"])
    except Exception:
        if previous is None:
            LINK.unlink(missing_ok=True)
            SITE.unlink(missing_ok=True)
        else:
            atomic_text(SITE, previous)
            if linked and not LINK.is_symlink(): LINK.symlink_to(SITE)
            if not linked: LINK.unlink(missing_ok=True)
        check()
        call(["systemctl", "reload", "nginx"])
        raise


def main():
    os.umask(0o077)
    check()
    args = sys.argv[1:]
    if args == ["check"]:
        return
    if len(args) == 2 and args[0] == "snapshot":
        snapshot(Path(args[1]))
    elif len(args) == 3 and args[0] == "switch":
        config = json.loads(SERVER.read_text())
        require(args[1] in ("blue", "green") and args[2].isdigit(), "Invalid slot/port")
        require(int(args[2]) == config["ports"][0 if args[1] == "blue" else 1], "Port was not audited for this slot")
        apply(render(int(args[2])))
    elif len(args) == 2 and args[0] == "restore":
        path = Path(args[1])
        require(path.parent == Path("/var/lib") and path.name.startswith("homemind-landingpage-") and not path.is_symlink(), "Invalid snapshot path")
        require(path.stat().st_uid == 0 and not path.stat().st_mode & 0o077, "Snapshot must be root-only")
        value = json.loads(path.read_text())
        require(value["app"] == "homemind-landingpage", "Wrong snapshot app")
        apply(value["content"], value["enabled"])
    else:
        raise RuntimeError("Only check/snapshot/switch/restore are supported")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
