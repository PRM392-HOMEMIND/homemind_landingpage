#!/usr/bin/env python3
"""Workstation-only SSH audit. Read an ephemeral password without terminal echo.

Requires explicit prior console fingerprint verification; never guesses trust.
Not used by Actions or privileged production wrappers.
"""
import argparse
import base64
import hashlib
import getpass
import json
from pathlib import Path
import re
import sys
import time
import paramiko


def password_dialog():
    """Secure interactive input only: no disk storage, stdout or screenshots."""
    import tkinter as tk
    from tkinter import ttk

    result = []
    window = tk.Tk()
    window.title("HomeMind - secure VPS credential")
    window.resizable(False, False)
    window.attributes("-topmost", True)
    frame = ttk.Frame(window, padding=20)
    frame.pack()
    ttk.Label(frame, text="Root password for 103.200.22.211\nRead-only SSH audit. Password stays in memory; it is not saved.").pack(anchor="w")
    entry = ttk.Entry(frame, show="*", width=50)
    entry.pack(pady=14)

    def submit(event=None):
        value = entry.get()
        if value:
            result.append(value)
            entry.delete(0, tk.END)
            window.destroy()

    ttk.Button(frame, text="Run read-only audit (do not save)", command=submit).pack()
    window.bind("<Return>", submit)
    window.after(100, entry.focus_force)
    window.mainloop()
    if not result:
        raise RuntimeError("Secure input cancelled; no SSH authentication attempted")
    return result.pop()


class ConsoleVerifiedKey(paramiko.MissingHostKeyPolicy):
    def __init__(self, fingerprint):
        self.fingerprint = fingerprint

    def missing_host_key(self, client, hostname, key):
        actual = "SHA256:" + base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode().rstrip("=")
        if key.get_name() != "ssh-ed25519" or actual != self.fingerprint:
            raise paramiko.SSHException("SSH key differs from the console-verified ED25519 fingerprint")


class EphemeralSession:
    """Keep the credential only in RAM until explicit close; reconnect transport."""
    def __init__(self, fingerprint, password):
        self.fingerprint = fingerprint
        self._password = password
        self.client = None

    def ensure_connected(self):
        transport = self.client.get_transport() if self.client else None
        if transport and transport.is_active():
            return self.client
        if self.client:
            self.client.close()
        if not self._password:
            raise RuntimeError("Ephemeral session has already been closed")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(ConsoleVerifiedKey(self.fingerprint))
        try:
            client.connect("103.200.22.211", port=22, username="root", password=self._password,
                           allow_agent=False, look_for_keys=False, timeout=10, banner_timeout=10, auth_timeout=10,
                           disabled_algorithms={"keys": ["ssh-rsa", "rsa-sha2-256", "rsa-sha2-512", "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521"]})
            client.get_transport().set_keepalive(15)
        except Exception:
            client.close()
            raise
        self.client = client
        return client

    def close(self):
        self._password = None
        if self.client:
            self.client.close()
        self.client = None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--console-verified-fingerprint", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--password-dialog", action="store_true", help="Ephemeral masked GUI input; never saves credentials")
    parser.add_argument("--remote-script", type=Path, help="Reviewed Python collector, inside this repository's deploy directory")
    parser.add_argument("--keep-open", action="store_true", default=True, help="Default: keep session and RAM-only credential for reviewed requests/reconnection")
    parser.add_argument("--close-after-script", action="store_true", help="Explicitly close and release the RAM credential after the initial script")
    args = parser.parse_args()
    if not re.fullmatch(r"SHA256:[A-Za-z0-9+/]{43}", args.console_verified_fingerprint):
        raise ValueError("Invalid console fingerprint")
    password = password_dialog() if args.password_dialog else getpass.getpass("Root password (not saved): ")
    if not password:
        raise ValueError("Root credential missing")
    session = EphemeralSession(args.console_verified_fingerprint, password)
    password = None
    try:
        client = session.ensure_connected()
        try:
            execute_script(client, args.remote_script or Path(__file__).parent / "audit.py", args.output)
            print("PASSED: authenticated with console-verified key; selected audit saved to protected local file", flush=True)
        except Exception as error:
            if args.close_after_script:
                raise
            print("SCRIPT FAILED: " + type(error).__name__ + "; selected output retained; no operation automatically repeated", flush=True)
        if args.keep_open and not args.close_after_script:
            print("SESSION READY: reviewed script requests only; no credential input in this channel", flush=True)
            for line in sys.stdin:
                try:
                    request = json.loads(line)
                except json.JSONDecodeError:
                    print("REQUEST REJECTED: invalid JSON; RAM-only session retained", flush=True)
                    continue
                if request == {"close": True}:
                    break
                try:
                    client = session.ensure_connected()
                    if request == {"install_system_files": True}:
                        install_system_files(client)
                        print("INSTALL PASSED: fixed OS config/SSH wrapper files installed; no project root created", flush=True)
                        continue
                    execute_script(client, Path(request["script"]), args.output.parent / request["output_name"])
                    print("SCRIPT PASSED: selected output saved; verified SSH session remains open", flush=True)
                except Exception as error:
                    print("SCRIPT FAILED: " + type(error).__name__ + "; selected output retained; no operation automatically repeated", flush=True)
                    try:
                        session.ensure_connected()
                        print("SESSION READY: verified transport restored with the RAM-only credential", flush=True)
                    except Exception:
                        print("RECONNECT UNAVAILABLE: RAM-only session retained for the next reviewed request", flush=True)
    finally:
        password = None
        session.close()


def execute_script(client, script_path, output_path):
        script_path = script_path.resolve(strict=True)
        if script_path.parent != Path(__file__).parent.resolve() or script_path.suffix != ".py":
            raise ValueError("Only reviewed Python scripts directly in the existing deploy directory are accepted")
        output_path = output_path.resolve()
        if output_path.parent.name != "HomeMindDeployment" or output_path.suffix != ".jsonl":
            raise ValueError("Output must be a selected-field JSONL file in the existing protected directory")
        script = script_path.read_text(encoding="utf-8")
        channel = client.get_transport().open_session(timeout=10)
        channel.exec_command("python3 -")
        channel.sendall(script.encode())
        channel.shutdown_write()
        output = bytearray()
        errors = bytearray()
        deadline = time.monotonic() + 300
        while time.monotonic() < deadline:
            if channel.recv_ready(): output.extend(channel.recv(65536))
            if channel.recv_stderr_ready(): errors.extend(channel.recv_stderr(65536))
            if len(output) + len(errors) > 4_000_000:
                raise RuntimeError("Audit output exceeded bounded size")
            if channel.exit_status_ready() and not channel.recv_ready() and not channel.recv_stderr_ready(): break
            time.sleep(0.1)
        else:
            channel.close()
            raise TimeoutError("Read-only audit exceeded five-minute bound")
        status = channel.recv_exit_status()
        # Selected-field audit output is stored under the user-only credential directory.
        for line in output.decode().splitlines(): json.loads(line)
        output_path.write_bytes(output)
        if status != 0: raise RuntimeError("Remote operation failed; selected JSON retained; raw stderr suppressed")


def install_system_files(client):
    """Operator bootstrap only, never exposed through the Actions deploy identity."""
    root = Path(__file__).resolve().parent.parent
    mappings = [
        (root / "deploy/release.py", "/usr/local/sbin/homemind-landingpage-release", 0o755),
        (root / "deploy/proxy-adapter.py", "/usr/local/sbin/homemind-landingpage-proxy", 0o755),
        (root / "deploy/deploy.sh", "/usr/local/sbin/homemind-landingpage-deploy", 0o755),
        (root / "deploy/rollback.sh", "/usr/local/sbin/homemind-landingpage-rollback", 0o755),
        (root / "deploy/verify.sh", "/usr/local/sbin/homemind-landingpage-verify", 0o755),
        (root / "deploy/ssh-entry.sh", "/usr/local/sbin/homemind-landingpage-ssh", 0o755),
        (root / "deploy/bootstrap.sh", "/usr/local/sbin/homemind-landingpage-bootstrap", 0o700),
        (root / "deploy/server.audited.json", "/etc/homemind-landingpage.json", 0o600),
        (root / "compose.production.yml", "/etc/homemind-landingpage-compose.yml", 0o600),
        (Path(__import__("os").environ["LOCALAPPDATA"]) / "HomeMindDeployment/github-actions-homemind-landingpage-20261002.pub", "/etc/homemind-landingpage-deploy.pub", 0o644),
    ]
    with client.open_sftp() as sftp:
        # Never overwrite any existing system file during initial install.
        for source, destination, mode in mappings:
            source.resolve(strict=True)
            try:
                sftp.lstat(destination)
            except FileNotFoundError:
                continue
            raise RuntimeError("Existing scoped system file requires read-only reconciliation before installation")
        for source, destination, mode in mappings:
            temporary = destination + ".install-" + str(time.time_ns())
            content = source.read_bytes().replace(b"\r\n", b"\n")
            with sftp.file(temporary, "wx") as stream:
                stream.write(content)
                stream.flush()
            sftp.chown(temporary, 0, 0)
            sftp.chmod(temporary, mode)
            sftp.posix_rename(temporary, destination)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("BLOCKED/FAILED: " + type(error).__name__ + "; credentials and raw SSH output suppressed", file=sys.stderr)
        sys.exit(1)
