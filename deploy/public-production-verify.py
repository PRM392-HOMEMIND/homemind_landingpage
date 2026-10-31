#!/usr/bin/env python3
"""Public, read-only DNS/TLS/routes and origin-port evidence from workstation."""
import concurrent.futures
import datetime
import hashlib
import json
import re
import socket
import ssl
import sys
import urllib.error
import urllib.request


def emit(section, value):
    print(json.dumps({"section": section, "value": value}), flush=True)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


emit("timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())
expected = sys.argv[1]
assert re.fullmatch(r"[a-f0-9]{40}", expected)
resolved = {}
for name in ("homemind.vn", "www.homemind.vn"):
    for kind in ("A", "AAAA"):
        query = urllib.request.Request(f"https://1.1.1.1/dns-query?name={name}&type={kind}", headers={"Accept": "application/dns-json"})
        with urllib.request.urlopen(query, timeout=15) as response:
            data = json.load(response)
        answers = [a["data"] for a in data.get("Answer", []) if a["type"] == (1 if kind == "A" else 28)]
        emit("public_dns", {"name": name, "type": kind, "rcode": data["Status"], "answers": answers})
        assert data["Status"] == 0
        assert answers == ["103.200.22.211"] if kind == "A" else not answers
        if kind == "A":
            resolved[name] = answers[0]
# Per-process public resolution handles a failed workstation resolver. HTTPS
# still validates each original hostname; no system/server DNS setting changes.
query = urllib.request.Request("https://1.1.1.1/dns-query?name=api.homemind.vn&type=A", headers={"Accept": "application/dns-json"})
with urllib.request.urlopen(query, timeout=15) as response:
    data = json.load(response)
resolved["api.homemind.vn"] = next(a["data"] for a in data.get("Answer", []) if a["type"] == 1)
assert resolved["api.homemind.vn"] == "103.200.22.211"
original_getaddrinfo = socket.getaddrinfo


def public_getaddrinfo(host, port, *args, **kwargs):
    return original_getaddrinfo(resolved.get(host, host), port, *args, **kwargs)


socket.getaddrinfo = public_getaddrinfo
emit("resolver_scope", "Cloudflare public DoH, current process only; original TLS hostnames retained")
for name in ("homemind.vn", "www.homemind.vn", "api.homemind.vn"):
    with socket.create_connection((name, 443), timeout=10) as transport:
        with ssl.create_default_context().wrap_socket(transport, server_hostname=name) as tls:
            cert = tls.getpeercert()
            emit("trusted_tls", {"name": name, "protocol": tls.version(), "issuer": cert["issuer"],
                                 "sans": cert["subjectAltName"], "not_after": cert["notAfter"],
                                 "der_sha256": hashlib.sha256(tls.getpeercert(binary_form=True)).hexdigest()})
opener = urllib.request.build_opener(NoRedirect())
for url, status in (("http://homemind.vn/", 308), ("http://www.homemind.vn/", 308),
                    ("https://www.homemind.vn/", 308), ("https://homemind.vn/", 200),
                    ("https://homemind.vn/healthz", 200), ("https://api.homemind.vn/v1/health/ready", 200)):
    try:
        response = opener.open(url, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read(2_000_000)
    emit("public_route", {"url": url, "status": response.code, "location": response.headers.get("Location"),
                          "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()})
    assert response.code == status
    if status == 308:
        assert response.headers["Location"] == "https://homemind.vn/"
    if url == "https://homemind.vn/healthz":
        health = json.loads(body)
        emit("public_release", health)
        assert health["release"] == expected and health["status"] == "ok"
    if url == "https://api.homemind.vn/v1/health/ready":
        assert hashlib.sha256(body).hexdigest() == "31bf75f4c0a97cc1f7b60df824fa390b3be9ba014f29b63c87c698ba63d9a9fd"


def test_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as connection:
        connection.settimeout(5)
        code = connection.connect_ex(("103.200.22.211", port))
    return {"address": "103.200.22.211", "port": port, "connection_succeeded": code == 0, "os_result": code}


with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    for result in pool.map(test_port, (3100, 3101)):
        emit("external_ipv4_landing_port", result)
        assert not result["connection_succeeded"]
emit("outcome", "PASSED")
