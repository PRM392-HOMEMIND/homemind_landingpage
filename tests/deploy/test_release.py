"""Isolated release state-machine rehearsal. Never operates on a real VPS."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("release", Path(__file__).resolve().parents[2] / "deploy/release.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
SHA = "a" * 40
DIGEST = "sha256:" + "b" * 64


class FakeController(m.Controller):
    def __init__(self, root, failure=None, first=False):
        self.failure = failure
        self.operations = []
        self.config = {"ports": [3100, 3101], "drain_seconds": 120, "public_url": "https://homemind.vn"}
        self.state_path = root / "state.json"
        self.state = {"high_watermark": 10} if first else {
            "high_watermark": 10,
            "current": {"name": "old", "sha": "c" * 40, "digest": "sha256:" + "d" * 64, "slot": "blue", "port": 3100, "activated": 0},
            "previous": {"name": "older", "sha": "e" * 40, "digest": "sha256:" + "f" * 64, "slot": "green", "port": 3101, "activated": 0},
        }

    def capacity(self): self.operations.append("capacity")
    def protected(self): self.operations.append("backend-check")
    def pull(self, sha, digest):
        self.operations.append("pull")
        if self.failure == "pull": raise RuntimeError("registry denied")
    def check_port(self, slot, port):
        self.operations.append("port-check")
        if self.failure == "collision": raise RuntimeError("protected port")
    def proxy(self, *args):
        self.operations.append("proxy-" + args[0])
        if args[0] == "snapshot": Path(args[1]).write_text("previous upstream")
        if args[0] == "switch" and self.failure == "switch": raise RuntimeError("reload failed after write")
        if args[0] == "restore" and self.failure == "restore": raise RuntimeError("restore failed")
    def compose(self, release, *args, **kwargs):
        self.operations.append("candidate-start")
        if self.failure == "candidate": raise RuntimeError("candidate unhealthy")
    def stop(self, release): self.operations.append("stop-" + release["name"])
    def make_release(self, sha, digest, sequence, slot):
        return {"name": "new", "sha": sha, "digest": digest, "sequence": int(sequence), "slot": slot, "port": 3101}


class ReleaseRehearsal(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.patch = patch.object(m, "ROOT", self.root); self.patch.start()
        self.trust = patch.object(m, "trusted", lambda p: p); self.trust.start()
        self.addCleanup(self.patch.stop); self.addCleanup(self.trust.stop); self.addCleanup(self.directory.cleanup)
        for name, filename in [('SERVER','server.json'),('MANIFEST','compose.production.yml'),('ADAPTER','proxy-adapter')]:
            change = patch.object(m, name, self.root / filename); change.start(); self.addCleanup(change.stop)

    def test_registry_token_accepts_opaque_printable_formats(self):
        import io
        for token in ("ghs_" + "a" * 40, "v1." + "a_-" * 40 + "." + "b" * 40, "a" * 4096):
            self.assertEqual(m.read_registry_token(io.StringIO(token + "\n")), token)

    def test_registry_token_rejects_control_whitespace_and_oversize(self):
        import io
        for token in ("", "short", "a" * 4097, "a" * 20 + " b", "a" * 20 + "\t", "a" * 20 + "\x00", "a" * 20 + "\u00e9"):
            with self.assertRaisesRegex(RuntimeError, "Invalid registry credential"):
                m.read_registry_token(io.StringIO(token + "\n"))

    def test_rejects_untrusted_release_arguments(self):
        for sha, digest, sequence in [("main", DIGEST, 11), (SHA, "latest", 11), (SHA, DIGEST, "1;id")]:
            with self.assertRaises(RuntimeError): m.validate_release(sha, digest, sequence)

    def test_unresolved_configuration_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "Full VPS audit"):
            m.validate_config({"audit_completed": False})

    def test_out_of_order_run_has_no_mutation(self):
        c = FakeController(self.root)
        with self.assertRaisesRegex(RuntimeError, "Stale"): c.rollout(SHA, DIGEST, 9)
        self.assertEqual(c.operations, [])

    def test_duplicate_success_is_verified_without_replacement(self):
        c = FakeController(self.root)
        with patch.object(m, "smoke"):
            result = c.rollout(c.state["current"]["sha"], c.state["current"]["digest"], 10)
        self.assertEqual(result["status"], "PASSED")
        self.assertNotIn("candidate-start", c.operations)

    def test_pull_failure_never_stops_any_release(self):
        c = FakeController(self.root, "pull")
        with self.assertRaises(RuntimeError): c.rollout(SHA, DIGEST, 11)
        self.assertFalse(any(x.startswith("stop-") for x in c.operations))
        self.assertNotIn("proxy-switch", c.operations)

    def test_port_collision_never_touches_backend_or_landing(self):
        c = FakeController(self.root, "collision")
        with self.assertRaises(RuntimeError): c.rollout(SHA, DIGEST, 11)
        self.assertNotIn("candidate-start", c.operations)
        self.assertFalse(any(x.startswith("stop-") for x in c.operations))

    def test_candidate_failure_retains_current_and_reports_original_failure(self):
        c = FakeController(self.root, "candidate")
        with self.assertRaises(RuntimeError): c.rollout(SHA, DIGEST, 11)
        self.assertNotIn("stop-old", c.operations)
        self.assertNotIn("proxy-switch", c.operations)
        outcome = json.loads((self.root / "homemind-landingpage-last-outcome.json").read_text())
        self.assertEqual(outcome["status"], "FAILED")
        self.assertEqual(c.state["high_watermark"], 10)

    def test_partial_proxy_switch_failure_restores_before_cleanup(self):
        c = FakeController(self.root, "switch")
        with patch.object(m, "smoke"):
            with self.assertRaises(RuntimeError): c.rollout(SHA, DIGEST, 11)
        self.assertLess(c.operations.index("proxy-restore"), c.operations.index("stop-new"))
        self.assertNotIn("stop-old", c.operations)

    def test_post_switch_failure_checks_previous_and_keeps_workflow_failed(self):
        c = FakeController(self.root)
        def observe(url, sha):
            if url == c.config["public_url"] and sha == SHA: raise RuntimeError("public failure")
        with patch.object(m, "smoke", side_effect=observe):
            with self.assertRaises(RuntimeError): c.rollout(SHA, DIGEST, 11)
        self.assertIn("proxy-restore", c.operations)
        self.assertEqual(json.loads((self.root / "homemind-landingpage-last-outcome.json").read_text())["failed_step"], "post-switch")

    def test_failed_restoration_preserves_candidate_for_investigation(self):
        c = FakeController(self.root, "restore")
        with patch.object(m, "smoke", side_effect=RuntimeError("unhealthy")):
            # Force the failure after switch, not at candidate validation.
            with patch.object(m, "smoke", side_effect=[None, RuntimeError("public failed"), None]):
                with self.assertRaises(RuntimeError): c.rollout(SHA, DIGEST, 11)
        self.assertNotIn("stop-new", c.operations)
        self.assertEqual(json.loads((self.root / "homemind-landingpage-last-outcome.json").read_text())["rollback"], "FAILED")

    def test_first_deployment_does_not_claim_previous_restoration(self):
        c = FakeController(self.root, "candidate", first=True)
        with self.assertRaises(RuntimeError): c.rollout(SHA, DIGEST, 11)
        outcome = json.loads((self.root / "homemind-landingpage-last-outcome.json").read_text())
        self.assertEqual(outcome["rollback"], "first deployment; no previous release")

    def test_success_persists_digest_and_previous_healthy_release(self):
        c = FakeController(self.root)
        with patch.object(m, "smoke"): result = c.rollout(SHA, DIGEST, 11)
        self.assertEqual(result["status"], "PASSED")
        state = json.loads(self.state_path().read_text())
        self.assertEqual(state["current"]["digest"], DIGEST)
        self.assertEqual(state["previous"]["name"], "old")
        self.assertEqual(state["high_watermark"], 11)
        self.assertNotIn("stop-old", c.operations)

    def state_path(self): return self.root / "state.json"

    def rollback_files(self):
        for name in ["server.json", "compose.yml", "proxy-adapter"]:
            m.record("older", name).write_text("previous configuration")
        for path in [m.SERVER, m.MANIFEST, m.ADAPTER]:
            path.write_text("current configuration")
        m.record("old", "proxy-snapshot").write_text("previous upstream")
        m.record("old", "proxy-adapter").write_text("snapshot adapter")

    def test_conditional_rollback_rejects_a_newer_release(self):
        c = FakeController(self.root)
        with self.assertRaisesRegex(RuntimeError, "different/newer"):
            c.restore_previous([SHA, DIGEST, 10])
        self.assertEqual(c.operations, [])

    def test_manual_rollback_restores_saved_configuration_and_keeps_freshness(self):
        self.rollback_files()
        c = FakeController(self.root)
        with patch.object(m, "smoke"), patch.object(m, "run") as operation:
            result = c.restore_previous()
        self.assertEqual(result["sha"], "e" * 40)
        self.assertEqual((m.MANIFEST).read_text(), "previous configuration")
        self.assertEqual(c.state["high_watermark"], 10)
        self.assertIsNone(c.state["previous"])
        self.assertEqual(operation.call_args[0][0][1], "restore")

    def test_manual_rollback_failure_restores_original_configuration(self):
        self.rollback_files()
        c = FakeController(self.root)
        with patch.object(m, "smoke", side_effect=[None, RuntimeError("previous public failed"), None]), patch.object(m, "run"):
            with self.assertRaises(RuntimeError): c.restore_previous()
        self.assertEqual((m.MANIFEST).read_text(), "current configuration")
        self.assertEqual(c.state["current"]["name"], "old")

    def test_manual_rollback_without_previous_release_is_rejected(self):
        c = FakeController(self.root, first=True)
        with self.assertRaisesRegex(RuntimeError, "no previous"): c.restore_previous()

    def test_cleanup_retains_current_previous_and_unrelated_paths(self):
        base = self.root
        names = []
        for number in range(1, 7):
            name = f"{number}-{'a' * 12}-{number}"
            m.record(name, "release.json").write_text(json.dumps({"app": "homemind-landingpage", "name": name, "status": "healthy", "created": number}))
            names.append(name)
        unrelated = base / "backend-data"; unrelated.mkdir()
        (unrelated / "preserve").write_text("protected")
        c = FakeController(self.root)
        c.state = {"current": {"name": names[0]}, "previous": {"name": names[1]}}
        result = c.cleanup_records()
        self.assertEqual(result["removed_app_records"], [names[2]])
        self.assertTrue((unrelated / "preserve").is_file())
        self.assertTrue(m.record(names[0], "release.json").is_file())


if __name__ == "__main__": unittest.main()
