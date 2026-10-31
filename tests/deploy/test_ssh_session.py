"""Exercise RAM credential lifetime/reconnection with no SSH or real credential."""
import importlib.util
import io
from pathlib import Path
import types
import unittest
from unittest.mock import MagicMock, patch


paramiko_stub = types.SimpleNamespace(MissingHostKeyPolicy=object, SSHException=RuntimeError, SSHClient=MagicMock())
spec = importlib.util.spec_from_file_location("ssh_audit_client_test", Path(__file__).parents[2] / "deploy/ssh-audit-client.py")
client_module = importlib.util.module_from_spec(spec)
with patch.dict("sys.modules", {"paramiko": paramiko_stub}):
    spec.loader.exec_module(client_module)


class EphemeralSessionTests(unittest.TestCase):
    def setUp(self):
        self.first, self.second = MagicMock(), MagicMock()
        self.first.get_transport.return_value.is_active.return_value = True
        self.second.get_transport.return_value.is_active.return_value = True
        self.factory = patch.object(paramiko_stub, "SSHClient", side_effect=[self.first, self.second])
        self.factory.start()
        self.addCleanup(self.factory.stop)

    def test_active_transport_is_reused_without_reauthentication(self):
        session = client_module.EphemeralSession("SHA256:" + "A" * 43, "ephemeral-test-value")
        self.assertIs(session.ensure_connected(), self.first)
        self.assertIs(session.ensure_connected(), self.first)
        self.first.connect.assert_called_once()
        self.assertFalse(self.first.connect.call_args.kwargs["allow_agent"])
        self.assertFalse(self.first.connect.call_args.kwargs["look_for_keys"])
        session.close()

    def test_lost_transport_reconnects_using_same_ram_credential_and_key_policy(self):
        session = client_module.EphemeralSession("SHA256:" + "A" * 43, "ephemeral-test-value")
        session.ensure_connected()
        self.first.get_transport.return_value.is_active.return_value = False
        self.assertIs(session.ensure_connected(), self.second)
        self.assertEqual(self.first.connect.call_args.kwargs["password"], self.second.connect.call_args.kwargs["password"])
        self.assertIsInstance(self.second.set_missing_host_key_policy.call_args.args[0], client_module.ConsoleVerifiedKey)
        self.first.close.assert_called_once()
        session.close()
        self.assertIsNone(session._password)
        with self.assertRaises(RuntimeError):
            session.ensure_connected()

    def test_failed_initial_script_keeps_session_without_repeating_operation(self):
        args = ["ssh-audit-client.py", "--password-dialog", "--console-verified-fingerprint", "SHA256:" + "A" * 43,
                "--output", "unused.jsonl"]
        with patch("sys.argv", args), patch("sys.stdin", io.StringIO('{"close":true}\n')), \
                patch("sys.stdout", io.StringIO()) as output, \
                patch.object(client_module, "password_dialog", return_value="ephemeral-test-value"), \
                patch.object(client_module, "execute_script", side_effect=RuntimeError) as operation:
            client_module.main()
        operation.assert_called_once()
        self.assertIn("SESSION READY", output.getvalue())
        self.assertNotIn("ephemeral-test-value", output.getvalue())
        self.first.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
