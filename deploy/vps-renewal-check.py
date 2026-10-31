#!/usr/bin/env python3
"""Scope Certbot staging renewal rehearsal to landing lineage only."""
import datetime
import json
import runpy
import subprocess


def emit(section, value):
    print(json.dumps({"section": section, "value": value}), flush=True)


m = runpy.run_path("/usr/local/sbin/homemind-landingpage-release", run_name="operator_check")
c = m["Controller"]()
c.protected()
result = subprocess.run(["certbot", "renew", "--cert-name", "homemind.vn", "--dry-run", "--run-deploy-hooks", "--non-interactive"], capture_output=True, text=True, timeout=240)
emit("landing_renewal_dry_run", {"status": "PASSED" if result.returncode == 0 else "FAILED", "exit": result.returncode, "cert_name": "homemind.vn", "deploy_hook_exercised": result.returncode == 0})
c.protected()
emit("backend_after_renewal", "PASSED: runtime, networks, health and config unchanged")
timer = subprocess.run(["systemctl", "show", "certbot.timer", "--property=ActiveState,UnitFileState,NextElapseUSecRealtime"], capture_output=True, text=True, timeout=10)
emit("existing_renewal_timer", timer.stdout.strip())
emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
if result.returncode:
    raise RuntimeError("Landing renewal rehearsal failed; raw Certbot output suppressed")
