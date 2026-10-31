#!/usr/bin/env python3
"""Keep the retained known-good frontend rollback's protection metadata current.

Only the current release's archived frontend server.json gets the verified
IDs/start times; app/proxy/config protections remain equal and are backed up.
"""
import copy
import fcntl
import hashlib
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import tempfile

EXPECTED_CONFIG_SHA256 = "e259a9cbd7c4a5831c6e9d3ced9688f83d25ae5bec015772e44189b29b14793c"
EXPECTED_NONRUNTIME_SHA256 = "fdd5632587ed572008233abddb8c16ca8109537ea10f595771896250f01c21be"
CURRENT_FRONTEND = "281e1de11af8e6d55691fb9495e87ceae0365a8a"
backup_path = Path("/var/backups/homemind-landingpage-rollback-guard-before-admin-runtime-20261007.json")
loader = importlib.machinery.SourceFileLoader("frontend_controller", "/usr/local/sbin/homemind-landingpage-release")
spec = importlib.util.spec_from_loader(loader.name, loader)
module = importlib.util.module_from_spec(spec)
loader.exec_module(module)

lock = os.open(module.LOCK, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
with os.fdopen(lock, "r+") as lock_file:
    fcntl.flock(lock_file, fcntl.LOCK_EX)
    controller = module.Controller()
    module.require(hashlib.sha256(module.trusted(module.SERVER).read_bytes()).hexdigest() == EXPECTED_CONFIG_SHA256, "Installed guard changed since reconciliation")
    current = controller.state.get("current", {})
    module.require(current.get("sha") == CURRENT_FRONTEND, "Active frontend changed")
    controller.protected()
    module.smoke(controller.config["public_url"], CURRENT_FRONTEND)
    archive_path = module.trusted(module.record(current["name"], "server.json"))
    original = archive_path.read_bytes()
    archived_config = json.loads(original)
    nonruntime = copy.deepcopy(archived_config)
    for item in nonruntime["protected_containers"]:
        item.pop("id")
        item.pop("started_at")
    canonical = json.dumps(nonruntime, sort_keys=True, separators=(",", ":")).encode()
    module.require(hashlib.sha256(canonical).hexdigest() == EXPECTED_NONRUNTIME_SHA256, "Rollback's nonruntime protection/configuration differs")
    candidate = copy.deepcopy(archived_config)
    module.require(len(candidate["protected_containers"]) == len(controller.config["protected_containers"]) == 2, "Rollback protection scope differs")
    for before, live in zip(candidate["protected_containers"], controller.config["protected_containers"]):
        before["id"] = live["id"]
        before["started_at"] = live["started_at"]
    module.require(candidate == controller.config, "Rollback metadata differs beyond runtime identities")
    descriptor = os.open(backup_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, "wb") as backup:
        backup.write(original)
        backup.flush()
        os.fsync(backup.fileno())
    try:
        module.atomic_json(archive_path, candidate)
        module.require(json.loads(archive_path.read_bytes()) == controller.config, "Rollback metadata write verification failed")
        controller.protected()
        module.smoke(controller.config["public_url"], CURRENT_FRONTEND)
    except Exception:
        descriptor, temporary = tempfile.mkstemp(prefix="homemind-rollback-guard-restore-", dir=archive_path.parent)
        try:
            with os.fdopen(descriptor, "wb") as restore:
                restore.write(original)
                restore.flush()
                os.fsync(restore.fileno())
            os.replace(temporary, archive_path)
        finally:
            Path(temporary).unlink(missing_ok=True)
        raise
    print(json.dumps({"check": "retained-rollback-guard-reconciliation", "result": "PASS",
                      "sha": CURRENT_FRONTEND, "digest": current["digest"],
                      "backup": str(backup_path),
                      "old_archive_sha256": hashlib.sha256(original).hexdigest(),
                      "new_archive_sha256": hashlib.sha256(archive_path.read_bytes()).hexdigest(),
                      "only_guard_ids_and_start_changed": True,
                      "backend_runtime_and_public_frontend_unchanged": True}), flush=True)
