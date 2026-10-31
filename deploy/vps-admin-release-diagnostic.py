#!/usr/bin/env python3
"""Read-only diagnosis of the installed frontend release controller.

Run through the console-verified operator connection. Never emit environment,
registry credentials, container logs, or arbitrary Docker stderr.
"""
import hashlib
import importlib.machinery
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess


def emit(check, **fields):
    print(json.dumps({"check": check, **fields}), flush=True)


def inspect_command(args):
    try:
        result = subprocess.run(
            args, capture_output=True, text=True, timeout=20, check=False
        )
    except subprocess.TimeoutExpired:
        return None, "timeout"
    if result.returncode:
        message = result.stderr.lower()
        category = next(
            (name for text, name in (
                ("no such object", "missing-object"),
                ("no such container", "missing-object"),
                ("cannot connect", "daemon-unavailable"),
                ("permission denied", "permission-denied"),
            ) if text in message),
            "command-failed",
        )
        return None, category
    return result.stdout.strip(), None


code = Path("/usr/local/sbin/homemind-landingpage-release")
config_path = Path("/etc/homemind-landingpage.json")
loader = importlib.machinery.SourceFileLoader("frontend_controller", str(code))
spec = importlib.util.spec_from_loader(loader.name, loader)
controller_module = importlib.util.module_from_spec(spec)
loader.exec_module(controller_module)
controller = controller_module.Controller()
emit("installed-controller", sha256=hashlib.sha256(code.read_bytes()).hexdigest())
emit("frontend-config", sha256=hashlib.sha256(config_path.read_bytes()).hexdigest())
emit("active-release", sha=controller.state.get("current", {}).get("sha"),
     digest=controller.state.get("current", {}).get("digest"))
emit("capacity", free_disk_mb=shutil.disk_usage("/var/lib").free // (1024 * 1024))
version, failure = inspect_command(["docker", "version", "--format", "{{.Server.Version}}"])
emit("docker-version", version=version, failure=failure)

for item in controller.config.get("protected_containers", []):
    state, failure = inspect_command([
        "docker", "inspect", "--format", "{{json .State}}", item["id"]
    ])
    if failure:
        emit("protected-container", id=item["id"], failure=failure)
    else:
        state = json.loads(state)
        emit("protected-container", id=item["id"], running=state["Running"],
             started_at_matches=state["StartedAt"] == item["started_at"],
             health_matches=state.get("Health", {}).get("Status") == item.get("health_status"))

inventory, failure = inspect_command(["docker", "ps", "-aq", "--no-trunc"])
emit("runtime-inventory", failure=failure)
if inventory:
    for container_id in inventory.splitlines():
        fields = {}
        expressions = {
            "name": "{{json .Name}}",
            "image": "{{json .Config.Image}}",
            "state": "{{json .State}}",
            "bindings": "{{json .HostConfig.PortBindings}}",
            "restart_policy": "{{json .HostConfig.RestartPolicy}}",
            "networks": "{{json .NetworkSettings.Networks}}",
            "labels": "{{json .Config.Labels}}",
        }
        for field, expression in expressions.items():
            value, failure = inspect_command(["docker", "inspect", "--format", expression, container_id])
            if failure:
                fields["failure"] = failure
                break
            fields[field] = json.loads(value)
        if "failure" in fields:
            emit("runtime-container", id=container_id, failure=fields["failure"])
            continue
        state = fields["state"]
        labels = fields["labels"] or {}
        emit("runtime-container", id=container_id, name=fields["name"], image=fields["image"],
             running=state["Running"], started_at=state["StartedAt"],
             health=state.get("Health", {}).get("Status"),
             bindings=fields["bindings"], restart_policy=fields["restart_policy"],
             networks=sorted(fields["networks"] or {}),
             compose_project=labels.get("com.docker.compose.project"),
             compose_service=labels.get("com.docker.compose.service"))

for name, operation in (("capacity-guard", controller.capacity),
                        ("protected-guard", controller.protected),
                        ("proxy-check", lambda: controller.proxy("check"))):
    try:
        operation()
        emit(name, result="PASS_READ_ONLY")
    except Exception as error:
        emit(name, result="FAIL", error_type=type(error).__name__)

for item in controller.config.get("protected_files", []):
    value = controller_module.trusted(Path(item["path"])).read_bytes()
    emit("protected-file", path=item["path"],
         expected_sha256=item["sha256"], actual_sha256=hashlib.sha256(value).hexdigest())

for item in controller.config.get("protected_systemd_units", []):
    active, active_failure = inspect_command(["systemctl", "show", item["unit"], "--property=ActiveState", "--value"])
    started, started_failure = inspect_command(["systemctl", "show", item["unit"], "--property=ExecMainStartTimestampMonotonic", "--value"])
    emit("protected-unit", unit=item["unit"], active=active,
         started_at_matches=started == item["started_at"],
         failure=active_failure or started_failure)
