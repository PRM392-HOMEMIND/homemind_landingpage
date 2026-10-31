#!/usr/bin/env python3
"""Operator-only scoped identity and HTTP challenge bootstrap after saved audit."""
import datetime
import json
from pathlib import Path
import runpy
import subprocess
import urllib.request
import uuid


def emit(section, value):
    print(json.dumps({"section": section, "value": value}), flush=True)


m = runpy.run_path("/usr/local/sbin/homemind-landingpage-release", run_name="operator_check")
controller = m["Controller"]()
controller.protected()
controller.capacity()
result = subprocess.run(["/usr/local/sbin/homemind-landingpage-bootstrap"], capture_output=True, text=True, timeout=60)
if result.returncode:
    emit("bootstrap", {"status": "FAILED", "exit": result.returncode})
    raise RuntimeError("Scoped bootstrap failed; raw output suppressed")
emit("bootstrap", {"status": "PASSED", "user": "homemind", "docker_group": False})
adapter = runpy.run_path("/usr/local/sbin/homemind-landingpage-proxy", run_name="operator_proxy")
adapter["check"]()
snapshot = Path("/var/lib/homemind-landingpage-bootstrap-20261002-proxy-snapshot")
if not snapshot.exists():
    adapter["snapshot"](snapshot)
emit("initial_routing_backup", str(snapshot))
site = adapter["SITE"]
if not site.exists():
    adapter["apply"](adapter["render"](tls=False))
    emit("landing_http_vhost", "CREATED; shared nginx gracefully reloaded")
else:
    emit("landing_http_vhost", "Existing scoped vhost reused")
controller.protected()
challenge = Path("/var/www/homemind-acme/.well-known/acme-challenge")
challenge.mkdir(parents=True, exist_ok=True)
name = "homemind-landingpage-preflight-" + uuid.uuid4().hex
probe = challenge / name
content = "HomeMind HTTP-01 preflight " + uuid.uuid4().hex
try:
    probe.write_text(content)
    probe.chmod(0o644)
    for domain in ("homemind.vn", "www.homemind.vn"):
        with urllib.request.urlopen("http://" + domain + "/.well-known/acme-challenge/" + name, timeout=10) as response:
            if response.status != 200 or response.read().decode() != content:
                raise RuntimeError("Public HTTP-01 preflight did not reach the intended webroot")
        emit("http01_preflight", {"domain": domain, "status": "PASSED"})
finally:
    probe.unlink(missing_ok=True)
controller.protected()
emit("backend_after_http_bootstrap", "PASSED: health, runtime, networking, config hashes unchanged")
emit("project_root_created", Path("/opt/homemind-landingpage").exists())
emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
