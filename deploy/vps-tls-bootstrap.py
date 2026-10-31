#!/usr/bin/env python3
"""Issue/reuse only the separate landing lineage through existing Certbot webroot."""
import datetime
import hashlib
import json
from pathlib import Path
import runpy
import socket
import ssl
import subprocess


def emit(section, value):
    print(json.dumps({"section": section, "value": value}), flush=True)


m = runpy.run_path("/usr/local/sbin/homemind-landingpage-release", run_name="operator_check")
c = m["Controller"]()
c.protected()
api_cert = Path("/etc/letsencrypt/live/api.homemind.vn/fullchain.pem")
api_hash = hashlib.sha256(api_cert.read_bytes()).hexdigest()
for domain in ("homemind.vn", "www.homemind.vn"):
    if set(socket.gethostbyname_ex(domain)[2]) != {"103.200.22.211"}:
        raise RuntimeError("DNS changed before issuance; no certificate mutation allowed")
certificate = Path("/etc/letsencrypt/live/homemind.vn/fullchain.pem")
if certificate.exists():
    emit("landing_certificate", "Existing lineage reused; no duplicate issuance requested")
else:
    result = subprocess.run(["certbot", "certonly", "--webroot", "-w", "/var/www/homemind-acme", "--cert-name", "homemind.vn", "-d", "homemind.vn", "-d", "www.homemind.vn", "--email", "vminhquang05@gmail.com", "--agree-tos", "--non-interactive", "--key-type", "ecdsa", "--keep-until-expiring"], capture_output=True, text=True, timeout=180)
    if result.returncode:
        emit("landing_certificate", {"status": "FAILED", "exit": result.returncode})
        raise RuntimeError("Landing issuance failed; inspect Certbot OS log privately")
    emit("landing_certificate", "ISSUED: separate homemind.vn lineage, existing Certbot/webroot")
adapter = runpy.run_path("/usr/local/sbin/homemind-landingpage-proxy", run_name="operator_proxy")
if "/etc/letsencrypt/live/homemind.vn/fullchain.pem" not in adapter["SITE"].read_text():
    adapter["apply"](adapter["render"]())
    emit("landing_tls_vhost", "TLS configured with maintenance 503 until first tested CI release")
for domain in ("homemind.vn", "www.homemind.vn", "api.homemind.vn"):
    with socket.create_connection(("103.200.22.211", 443), timeout=10) as raw:
        with ssl.create_default_context().wrap_socket(raw, server_hostname=domain) as secure:
            value = secure.getpeercert()
            emit("trusted_tls", {"domain": domain, "issuer": value["issuer"], "san": value["subjectAltName"], "not_before": value["notBefore"], "expiry": value["notAfter"], "protocol": secure.version()})
if hashlib.sha256(api_cert.read_bytes()).hexdigest() != api_hash:
    raise RuntimeError("Protected API certificate changed")
c.protected()
emit("backend_after_tls", "PASSED: API cert bytes, health, runtime, networks and config unchanged")
emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
