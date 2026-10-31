#!/usr/bin/env python3
"""Read-only GitHub evidence with per-request public DNS; credentials stay in RAM."""
import http.client
import io
import json
import re
import socket
import ssl
import subprocess
import sys
import urllib.parse
import zipfile


DNS_CACHE = {}
PHASE = "initialization"


def resolve(hostname):
    global PHASE
    if hostname not in DNS_CACHE:
        PHASE = "public DNS for " + hostname
        connection = http.client.HTTPSConnection("1.1.1.1", timeout=15, context=ssl.create_default_context())
        connection.request("GET", "/dns-query?" + urllib.parse.urlencode({"name": hostname, "type": "A"}),
                           headers={"Accept": "application/dns-json"})
        response = connection.getresponse()
        assert response.status == 200
        value = json.loads(response.read(200000))
        connection.close()
        assert value["Status"] == 0
        DNS_CACHE[hostname] = next(item["data"] for item in value.get("Answer", []) if item["type"] == 1)
    return DNS_CACHE[hostname]


def get(url, token=None):
    global PHASE
    parts = urllib.parse.urlsplit(url)
    assert parts.scheme == "https" and not parts.username and not parts.password
    assert parts.port in (None, 443)
    if token:
        assert parts.hostname == "api.github.com"
    connection = http.client.HTTPSConnection(parts.hostname, timeout=30, context=ssl.create_default_context())
    address = resolve(parts.hostname)
    PHASE = "HTTPS request to " + parts.hostname
    connection._create_connection = lambda target, timeout, source_address: socket.create_connection((address, target[1]), timeout)
    headers = {"User-Agent": "HomeMind-read-only-evidence", "Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    connection.request("GET", parts.path + ("?" + parts.query if parts.query else ""), headers=headers)
    response = connection.getresponse()
    if response.status in (301, 302, 303, 307, 308):
        location = response.headers["Location"]
        connection.close()
        destination = urllib.parse.urlsplit(location)
        assert destination.hostname.endswith((".blob.core.windows.net", ".actions.githubusercontent.com", ".amazonaws.com"))
        return get(location)  # Never forward the GitHub credential to log storage.
    if response.status != 200:
        raise RuntimeError("GitHub evidence request returned HTTP " + str(response.status))
    content = response.read(50_000_001)
    assert len(content) <= 50_000_000
    connection.close()
    return content


def main():
    run_id, mode = sys.argv[1:]
    assert run_id.isdigit() and mode in ("status", "logs")
    result = subprocess.run(["gh", "auth", "token", "--hostname", "github.com"], capture_output=True, text=True, check=True)
    token = result.stdout.strip()
    base = "https://api.github.com/repos/QuangVMZu/HomeMind_LandingPage/actions/runs/" + run_id
    if mode == "status":
        run = json.loads(get(base, token))
        jobs = json.loads(get(base + "/jobs", token))["jobs"]
        print(json.dumps({"run_id": int(run_id), "head_sha": run["head_sha"], "status": run["status"],
                          "conclusion": run["conclusion"], "url": run["html_url"],
                          "jobs": [{"id": j["id"], "name": j["name"], "status": j["status"], "conclusion": j["conclusion"],
                                    "steps": [{k: s[k] for k in ("name", "status", "conclusion")} for s in j.get("steps", [])]} for j in jobs]}))
    else:
        archive = zipfile.ZipFile(io.BytesIO(get(base + "/logs", token)))
        for name in archive.namelist():
            if any(marker in name for marker in ("Publish tested image", "Reject an obsolete", "Public HTTPS", "Build summary")):
                content = archive.read(name).decode("utf-8-sig")
                content = re.sub(r"gh[opsur]_[A-Za-z0-9_]{20,}", "[REDACTED]", content)
                print(name + "\n" + content)
    token = None


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("Evidence failed during " + PHASE + ": " + type(error).__name__ + "; credentials and signed URLs suppressed", file=sys.stderr)
        sys.exit(1)
