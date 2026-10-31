#!/usr/bin/env python3
"""Read-only diagnostics after TLS bootstrap failure; no new issuance/reload."""
import datetime
import json
from pathlib import Path
import re
import socket
import subprocess


def emit(section, value):
    print(json.dumps({"section": section, "value": value}), flush=True)


emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
for domain in ("homemind.vn", "www.homemind.vn"):
    try: emit("vps_dns", {"domain": domain, "answers": socket.gethostbyname_ex(domain)[2]})
    except Exception as error: emit("vps_dns", {"domain": domain, "error": type(error).__name__})
emit("landing_certificate_exists", Path("/etc/letsencrypt/live/homemind.vn/fullchain.pem").is_file())
emit("landing_https_configured", "/etc/letsencrypt/live/homemind.vn/fullchain.pem" in Path("/etc/nginx/sites-available/homemind-landingpage").read_text())
result = subprocess.run(["nginx", "-t"], capture_output=True, text=True, timeout=15)
emit("nginx_config_test", {"exit": result.returncode, "output": result.stderr.strip()})
processes = subprocess.run(["ps", "-eo", "pid,comm"], capture_output=True, text=True, timeout=10)
emit("remaining_acme_processes_names_only", [line.strip() for line in processes.stdout.splitlines() if "certbot" in line.lower()])
log = Path("/var/log/letsencrypt/letsencrypt.log")
if log.is_file():
    text = log.read_text(errors="replace")[-50000:]
    emit("acme_error_types", sorted(set(re.findall(r"urn:ietf:params:acme:error:[a-zA-Z]+", text))))
    # Only known failure classes, never raw HTTP bodies/JWS/log lines.
    emit("known_failure_hints", [value for value in ("ConnectionError", "Timeout", "rateLimited", "unauthorized", "DNS problem", "Connection refused", "Some challenges have failed", "No valid IP addresses", "CERTIFICATE_VERIFY_FAILED", "Network is unreachable") if value.lower() in text.lower()])
    emit("log_tail_timestamp_hint", re.findall(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", text)[-1:])
