#!/usr/bin/env python3
"""One-time frontend guard reconciliation after verified read-only diagnosis.

Changes only frontend protection metadata, under its release lock, with an
exclusive root-only backup and exact old-config/current-runtime assertions.
Never deploys, restarts, pulls images, or writes backend/database/proxy files.
"""
import copy
import fcntl
import hashlib
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

EXPECTED_OLD_SHA256 = "2874e2b39579172f903f0f65b501e04c830c6c193db10978ddf6e773e2c84988"
EXPECTED_NONRUNTIME_SHA256 = "fdd5632587ed572008233abddb8c16ca8109537ea10f595771896250f01c21be"
CURRENT_FRONTEND = "281e1de11af8e6d55691fb9495e87ceae0365a8a"
OLD_IDS = ["e230e258e5793609e5c6ad2e0b227d97516040c2b8da3ad2bea4694fa2c549b0",
           "2e7107f4939f7daf60547f7cfc78ccefbd357ddaa1a81d02751e1a0ff5f4a005"]
OBSERVED = [
    {"container_id": "a5d3e6d2e590d982853b07540aeec9c4a027c545f6d9c1d4249346a2f1a67977",
     "service": "api", "started_at": "2026-10-07T04:29:35.091636888Z"},
    {"container_id": "900c8719a3cc5ad426de7c12a01d9f71be849ac203d2185bb261b8b549a181f1",
     "service": "db", "started_at": "2026-10-07T04:26:16.456627654Z"},
]


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def inspect(container_id, expression):
    result = subprocess.run(["docker", "inspect", "--format", expression, container_id],
                            capture_output=True, text=True, check=True, timeout=20)
    return json.loads(result.stdout)


code = Path("/usr/local/sbin/homemind-landingpage-release")
config_path = Path("/etc/homemind-landingpage.json")
backup_path = Path("/var/backups/homemind-landingpage-guard-before-admin-runtime-20261007.json")
loader = importlib.machinery.SourceFileLoader("frontend_controller", str(code))
spec = importlib.util.spec_from_loader(loader.name, loader)
module = importlib.util.module_from_spec(spec)
loader.exec_module(module)

lock = os.open(module.LOCK, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
with os.fdopen(lock, "r+") as lock_file:
    fcntl.flock(lock_file, fcntl.LOCK_EX)
    controller = module.Controller()
    original_bytes = module.trusted(config_path).read_bytes()
    require(hashlib.sha256(original_bytes).hexdigest() == EXPECTED_OLD_SHA256, "Frontend config changed since diagnosis")
    require(controller.state.get("current", {}).get("sha") == CURRENT_FRONTEND, "Active frontend changed since diagnosis")
    require([item["id"] for item in controller.config["protected_containers"]] == OLD_IDS, "Unexpected protected identity set")
    nonruntime = copy.deepcopy(controller.config)
    for item in nonruntime["protected_containers"]:
        item.pop("id")
        item.pop("started_at")
    canonical = json.dumps(nonruntime, sort_keys=True, separators=(",", ":")).encode()
    require(hashlib.sha256(canonical).hexdigest() == EXPECTED_NONRUNTIME_SHA256, "Nonruntime protections differ from reviewed source")
    controller.capacity()
    controller.proxy("check")

    candidate = copy.deepcopy(controller.config)
    inventory = subprocess.run(["docker", "ps", "-q", "--no-trunc"],
                               capture_output=True, text=True, check=True, timeout=20).stdout.splitlines()
    for index, observation in enumerate(OBSERVED):
        role = observation["service"]
        container_id = observation["container_id"]
        started_at = observation["started_at"]
        matching = []
        for identity in inventory:
            labels = inspect(identity, "{{json .Config.Labels}}") or {}
            if labels.get("com.docker.compose.project") == "homemind" and labels.get("com.docker.compose.service") == role:
                matching.append(identity)
        require(matching == [container_id], "Ambiguous/current backend identity changed")
        state = inspect(container_id, "{{json .State}}")
        labels = inspect(container_id, "{{json .Config.Labels}}") or {}
        require(labels.get("com.docker.compose.project") == "homemind" and labels.get("com.docker.compose.service") == role, "Current backend role mismatch")
        require(state["Running"] and state["StartedAt"] == started_at, "Backend readiness/start changed since diagnosis")
        baseline = candidate["protected_containers"][index]
        require(state.get("Health", {}).get("Status") == baseline["health_status"], "Protected health requirement changed")
        require(inspect(container_id, "{{json .HostConfig.PortBindings}}") == baseline["bindings"], "Protected bindings changed")
        require(inspect(container_id, "{{json .HostConfig.RestartPolicy}}") == baseline["restart_policy"], "Protected restart policy changed")
        require(sorted(inspect(container_id, "{{json .NetworkSettings.Networks}}")) == baseline["networks"], "Protected networks changed")
        baseline["id"] = container_id
        baseline["started_at"] = started_at

    controller.config = candidate
    # Validate all protections, including files/units/public hashes, before write.
    controller.protected()
    module.smoke(controller.config["public_url"], CURRENT_FRONTEND)
    require(hashlib.sha256(config_path.read_bytes()).hexdigest() == EXPECTED_OLD_SHA256, "Concurrent frontend config change")
    descriptor = os.open(backup_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, "wb") as backup:
        backup.write(original_bytes)
        backup.flush()
        os.fsync(backup.fileno())
    try:
        module.atomic_json(config_path, candidate)
        verified = module.Controller()
        verified.protected()
        verified.proxy("check")
        module.smoke(verified.config["public_url"], CURRENT_FRONTEND)
    except Exception:
        descriptor, temporary = tempfile.mkstemp(prefix="homemind-guard-restore-", dir=config_path.parent)
        try:
            with os.fdopen(descriptor, "wb") as restore:
                restore.write(original_bytes)
                restore.flush()
                os.fsync(restore.fileno())
            os.replace(temporary, config_path)
        finally:
            Path(temporary).unlink(missing_ok=True)
        raise
    print(json.dumps({"check": "frontend-guard-reconciliation", "result": "PASS",
                      "old_sha256": EXPECTED_OLD_SHA256,
                      "new_sha256": hashlib.sha256(config_path.read_bytes()).hexdigest(),
                      "backup": str(backup_path), "protected_runtime_count": len(OBSERVED),
                      "nonruntime_protections_unchanged": True, "frontend_unchanged": CURRENT_FRONTEND,
                      "backend_runtime_unchanged_during_update": True}), flush=True)
