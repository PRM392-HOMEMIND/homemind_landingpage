import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { localFixture } from "./local-fixture";
import { validateSchema } from "../../src/lib/admin-api/schema";
import { configSchema, listSchema, detailSchema, updateSchema, states } from "../../src/features/feedback-admin/api";
import { validDraft } from "./contract-fixtures";
const fixture = localFixture();
const manifest = JSON.parse(readFileSync(process.env.FEEDBACK_LOCAL_FIXTURE!, "utf8"));
if (!/^H:[\\/]/i.test(manifest.adminCredentials || "")) throw new Error("Owned private credentials required");
const credentials = JSON.parse(readFileSync(manifest.adminCredentials, "utf8"));
let cookie = "", csrf = "";
async function call(path: string, method = "GET", body?: unknown, token = csrf, authenticated = true) {
  const response = await fetch(`${fixture.baseUrl}${path}`, { method, redirect: "error", cache: "no-store", headers: {
    Origin: "https://homemind.vn", ...(authenticated && cookie ? { Cookie: cookie } : {}),
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { "X-HomeMind-Admin-CSRF": token } : {}),
  }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (authenticated) for (const value of response.headers.getSetCookie()) if (value.startsWith("__Host-homemind-admin=")) cookie = value.split(";")[0];
  return response;
}
test.beforeAll(async () => {
  fixture.sql("DELETE FROM admin.login_limits;");
  const initial = await call("/admin/auth/csrf", "GET", undefined, "", false); const boot = await initial.json();
  cookie = initial.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  const login = await call("/admin/auth/login", "POST", { email: credentials.email, password: credentials.password }, boot.data.csrfToken);
  expect(login.status).toBe(200); csrf = (await login.json()).data.csrfToken;
});
test.afterAll(async () => { await call("/admin/auth/logout", "POST"); fixture.enabled(false); });
test("real SYSTEM_ADMIN config, CSRF enforcement, revision conflict and audited local toggle", async () => {
  const start = await call("/admin/feedback-popup"); expect(start.status).toBe(200); expect(start.headers.get("cache-control")).toContain("no-store");
  const config = (await start.json()).data; validateSchema(configSchema, config, {});
  expect((await call("/admin/feedback-popup", "PATCH", { enabled: !config.enabled, expectedRevision: config.revision }, "")).status).toBe(403);
  expect((await call("/admin/feedback-popup", "PATCH", { enabled: !config.enabled, expectedRevision: config.revision }, "invalid-local-csrf")).status).toBe(403);
  const changed = await call("/admin/feedback-popup", "PATCH", { enabled: !config.enabled, expectedRevision: config.revision }); expect(changed.status).toBe(200);
  const updated = (await changed.json()).data; validateSchema(updateSchema, updated, {}); expect(updated.enabled).toBe(!config.enabled); expect(updated.revision).toBe(config.revision + 1);
  const conflict = await call("/admin/feedback-popup", "PATCH", { enabled: config.enabled, expectedRevision: config.revision }); expect(conflict.status).toBe(409); expect((await conflict.json()).error.code).toBe("CONFIG_REVISION_CONFLICT");
  const audit = (await (await call("/admin/feedback-popup")).json()).data; expect(audit.lastChange.revision).toBe(updated.revision); expect(audit.lastChange.actorId).toBeTruthy();
  const same = (await (await call("/admin/feedback-popup", "PATCH", { enabled: updated.enabled, expectedRevision: updated.revision })).json()).data; expect(same.changed).toBe(false); expect(same.revision).toBe(updated.revision);
});
test("real pagination, Unicode filters and lifecycle one award/account across repeated accepted submissions", async () => {
  fixture.enabled(true); const marker = `FE Nhật ${randomUUID().slice(0,8)}`; const email = `fe-admin-${randomUUID()}@example.test`;
  const body = { ...validDraft, fullName: marker, email, phoneNumber: `091${Math.floor(1000000 + Math.random()*8999999)}` };
  const ids: string[] = [];
  async function submit() { const r = await call("/public/feedback-popup/submissions", "POST", body, "", false); expect(r.status).toBe(202); ids.push((await r.json()).submissionId); }
  await submit(); await submit();
  const signup = await call("/auth/register", "POST", { email, phone: body.phoneNumber, displayName: "Local fixture admin", password: randomUUID(), workspaceType: "household", acceptedTerms: true, acceptedPrivacy: true }, "", false); expect(signup.status).toBe(201);
  const registered = await signup.json(); const accountId = registered.user.id; await submit();
  expect(typeof registered.accessToken).toBe("string");
  const customerDenied = await fetch(`${fixture.baseUrl}/admin/feedback-popup`, { headers: { Origin: "https://homemind.vn", Authorization: `Bearer ${registered.accessToken}` } });
  expect(customerDenied.status).toBe(401);
  const first = (await (await call(`/admin/feedback-popup/submissions?limit=1&q=${encodeURIComponent(marker)}&sort=oldest`)).json()).data; validateSchema(listSchema, first, {}); expect(first.items).toHaveLength(1); expect(first.page.hasMore).toBe(true);
  const second = (await (await call(`/admin/feedback-popup/submissions?limit=1&q=${encodeURIComponent(marker)}&sort=oldest&cursor=${encodeURIComponent(first.page.nextCursor)}`)).json()).data; expect(second.items[0].id).not.toBe(first.items[0].id);
  expect((await call(`/admin/feedback-popup/submissions?limit=1&q=other&cursor=${encodeURIComponent(first.page.nextCursor)}`)).status).toBe(400);
  const repeated = (await (await call(`/admin/feedback-popup/submissions?userId=${accountId}&duplicate=true`)).json()).data; validateSchema(listSchema, repeated, {}); expect(repeated.items).toHaveLength(2);
  for (const id of ids) {
    const detail = (await (await call(`/admin/feedback-popup/submissions/${id}`)).json()).data; validateSchema(detailSchema, detail, {});
    expect(detail.lifecycle.accountId).toBe(accountId); expect(detail.lifecycle.logicalRewardCount).toBe(1); expect(detail.lifecycle.submissionCount).toBe(3);
    expect(detail.lifecycle.sourceSubmissionId).toBe(ids[0]); expect(detail.lifecycle.featureUsage).toEqual({ status: "NOT_TRACKED", used: null });
    expect(detail.lifecycle.awardedAt).toBeTruthy(); if (id !== ids[0]) expect(detail.segments).toEqual([]);
  }
  for (const state of states) { const r = await call(`/admin/feedback-popup/submissions?benefitState=${state}&limit=1`); expect(r.status).toBe(200); validateSchema(listSchema, (await r.json()).data, {}); }
});
test("real denied anonymous, wrong origin, malformed filters, missing detail and CORS", async () => {
  expect((await call("/admin/feedback-popup", "GET", undefined, "", false)).status).toBe(401);
  const denied = await fetch(`${fixture.baseUrl}/admin/feedback-popup`, { headers: { Origin: "https://evil.invalid", Cookie: cookie } }); expect(denied.status).toBe(403);
  for (const query of ["limit=0", "limit=101", "unknown=x", "q=" + "x".repeat(121), "benefitState=PAUSED", "duplicate=maybe", "from=2026-01-01T00:00:00Z", "userId=bad", "cursor=bad"]) expect((await call(`/admin/feedback-popup/submissions?${query}`)).status).toBe(400);
  expect((await call(`/admin/feedback-popup/submissions/${randomUUID()}`)).status).toBe(404);
  expect((await call("/admin/feedback-popup/submissions/not-a-uuid")).status).toBe(400);
  const preflight = await fetch(`${fixture.baseUrl}/admin/feedback-popup`, { method: "OPTIONS", headers: { Origin: "https://homemind.vn", "Access-Control-Request-Method": "PATCH", "Access-Control-Request-Headers": "content-type,x-homemind-admin-csrf" } }); expect(preflight.status).toBe(204); expect(preflight.headers.get("access-control-allow-credentials")).toBe("true");
});
