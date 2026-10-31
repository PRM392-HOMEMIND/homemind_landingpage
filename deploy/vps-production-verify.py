#!/usr/bin/env python3
"""Read-only final release evidence; emit selected public fields, never secrets."""
import datetime
import hashlib
import json
from pathlib import Path
import runpy
import socket
import ssl
import subprocess
import urllib.error
import urllib.request


def emit(section, value):
    print(json.dumps({"section": section, "value": value}), flush=True)


def call(args):
    return subprocess.check_output(args, text=True, timeout=30)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
module = runpy.run_path("/usr/local/sbin/homemind-landingpage-release", run_name="release_evidence")
controller = module["Controller"]()
current = controller.state.get("current")
if not current:
    raise RuntimeError("No successful production release recorded")
module["smoke"](controller.config["public_url"], current["sha"])
controller.protected()
emit("release_and_backend_verification", "PASSED")
emit("release_state", controller.state)
ids = call(["docker", "ps", "-aq"]).splitlines()
for cid in ids:
    item = json.loads(call(["docker", "inspect", cid]))[0]
    labels = item["Config"].get("Labels") or {}
    project = labels.get("com.docker.compose.project", "")
    protected = cid in [c["id"][:len(cid)] for c in controller.config["protected_containers"]]
    if not project.startswith("homemind-landingpage-") and not protected:
        continue
    state = item["State"]
    emit("container_selected_fields", {
        "id": item["Id"], "name": item["Name"], "image": item["Config"]["Image"],
        "image_id": item["Image"], "running": state["Running"], "started_at": state["StartedAt"],
        "health": state.get("Health", {}).get("Status"), "restart_policy": item["HostConfig"]["RestartPolicy"],
        "bindings": item["HostConfig"]["PortBindings"], "networks": sorted(item["NetworkSettings"]["Networks"]),
        "user": item["Config"]["User"], "readonly_root": item["HostConfig"]["ReadonlyRootfs"],
        "memory_bytes": item["HostConfig"]["Memory"], "nano_cpus": item["HostConfig"]["NanoCpus"],
        "pids_limit": item["HostConfig"]["PidsLimit"], "log_config": item["HostConfig"]["LogConfig"],
        "compose_project": project,
    })
    if project.startswith("homemind-landingpage-"):
        image = json.loads(call(["docker", "image", "inspect", item["Image"]]))[0]
        image_labels = image["Config"].get("Labels") or {}
        emit("landing_image_identity", {
            "id": image["Id"], "repo_digests": image.get("RepoDigests"),
            "architecture": image["Architecture"], "os": image["Os"], "size_bytes": image["Size"],
            "revision": image_labels.get("org.opencontainers.image.revision"),
            "source": image_labels.get("org.opencontainers.image.source"),
        })
        expected = next((release for release in (current, controller.state.get("previous"))
                         if release and project == "homemind-landingpage-" + release["slot"]), None)
        if expected:
            assert image_labels.get("org.opencontainers.image.revision") == expected["sha"]
            assert any(value.endswith("@" + expected["digest"]) for value in image.get("RepoDigests", []))
emit("ipv4_landing_listeners", call(["ss", "-ltn4", "sport = :3100 or sport = :3101"]).strip())
emit("ipv6_landing_listeners", call(["ss", "-ltn6", "sport = :3100 or sport = :3101"]).strip())
interfaces = json.loads(call(["ip", "-j", "address", "show", "scope", "global"]))
emit("global_ipv6_addresses", [a["local"] for i in interfaces for a in i.get("addr_info", []) if a.get("family") == "inet6"])
emit("nginx_runtime", call(["systemctl", "show", "nginx.service", "--property=MainPID,ActiveState,ExecMainStartTimestampMonotonic"]).strip())
emit("nginx_test_exit", subprocess.run(["nginx", "-t"], capture_output=True, timeout=15).returncode)
emit("certbot_timer", call(["systemctl", "show", "certbot.timer", "--property=ActiveState,UnitFileState,NextElapseUSecRealtime"]).strip())
for hostname in ("homemind.vn", "www.homemind.vn", "api.homemind.vn"):
    with socket.create_connection((hostname, 443), timeout=10) as transport:
        with ssl.create_default_context().wrap_socket(transport, server_hostname=hostname) as tls:
            certificate = tls.getpeercert()
            emit("trusted_tls", {"hostname": hostname, "protocol": tls.version(), "issuer": certificate["issuer"],
                                 "sans": certificate["subjectAltName"], "not_before": certificate["notBefore"],
                                 "not_after": certificate["notAfter"], "der_sha256": hashlib.sha256(tls.getpeercert(binary_form=True)).hexdigest()})
opener = urllib.request.build_opener(NoRedirect())
for url in ("http://homemind.vn/", "http://www.homemind.vn/", "https://www.homemind.vn/", "https://homemind.vn/healthz"):
    try:
        response = opener.open(url, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    emit("public_route", {"url": url, "status": response.code, "location": response.headers.get("Location")})
emit("new_application_root_absent", not Path("/opt/homemind-landingpage").exists())
emit("controller_sha256", hashlib.sha256(Path("/usr/local/sbin/homemind-landingpage-release").read_bytes()).hexdigest())
emit("outcome", "PASSED")
