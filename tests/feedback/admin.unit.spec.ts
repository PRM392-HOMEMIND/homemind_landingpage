import { test, expect } from "@playwright/test";
import { filterQuery, readConfig, readList, readDetail, updateConfig, configSchema, detailSchema, itemSchema, listSchema, pageCounts, stateLabel, states } from "../../src/features/feedback-admin/api";
import { validateSchema, ContractError } from "../../src/lib/admin-api/schema";
import { clearClient, configureClient, ApiError, requestFeedbackAdmin } from "../../src/lib/admin-api/client";
import { adminConfig, adminItem, adminList, adminDetail, adminEnvelope, adminError, adminId } from "./admin-fixtures";
const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; clearClient(); configureClient({ onAuthorizationFailure: () => {} }); });
for (const [name, schema, data] of [["config", configSchema, adminConfig], ["list", listSchema, adminList], ["detail", detailSchema, adminDetail], ["item", itemSchema, adminItem]] as const) {
  test(`admin ${name} schema additions and missing/invalid declared fields`, () => {
    expect(() => validateSchema(schema, { ...data, future: "unknown" }, {})).not.toThrow();
    for (const field of schema.required!) {
      const copy: Record<string, unknown> = { ...data }; delete copy[field];
      expect(() => validateSchema(schema, copy, {}), field).toThrow(ContractError);
    }
    expect(() => validateSchema(schema, null, {})).toThrow(ContractError);
  });
}
test("admin optional lifecycle, unknown state, accurate page distinct count", () => {
  const { lifecycle, ...without } = adminItem;
  expect(() => validateSchema(itemSchema, without, {})).not.toThrow();
  expect(() => validateSchema(itemSchema, { ...adminItem, lifecycle: { ...lifecycle, state: "FUTURE" }, benefit: { ...adminItem.benefit, state: "FUTURE" } }, {})).not.toThrow();
  expect(stateLabel("FUTURE")).toBe("Trạng thái chưa hỗ trợ");
  for (const state of states) expect(stateLabel(state)).not.toBe("Trạng thái chưa hỗ trợ");
  const issued = { ...adminItem, lifecycle: { ...lifecycle, rewardId: adminId } };
  expect(pageCounts([issued, { ...issued, duplicate: true }, without])).toEqual({ submissions: 3, repeats: 1, issuedRewards: 1 });
});
test("prototype property names are unknown lifecycle states", () => {
  for (const state of ["__proto__", "constructor", "toString", "hasOwnProperty"]) expect(stateLabel(state)).toBe("Trạng thái chưa hỗ trợ");
});
for (const filters of [ { limit: "0" }, { limit: "101" }, { limit: "01" }, { limit: "1.1" }, { sort: "wrong" }, { duplicate: "yes" }, { benefitState: "PAUSED" }, { userId: "invalid" }, { userId: adminId.replace("41d4", "71d4") }, { q: "x".repeat(121) }, { from: "2026-01-01T00:00:00Z" }, { from: "2026-01-01T00:00:00Z", to: "2027-01-03T00:00:00Z" }, { from: "2026-01-02T00:00:00Z", to: "2026-01-01T00:00:00Z" }, { from: "2026-02-30T00:00:00Z", to: "2026-03-02T00:00:00Z" }, { from: "2026-01-01T00:00:00+07:00", to: "2026-01-02T00:00:00Z" }, { cursor: "x".repeat(2049) }, { unknown: "x" } ]) test(`admin invalid filter ${JSON.stringify(filters).slice(0, 150)}`, () => expect(() => filterQuery(filters)).toThrow(ContractError));
test("admin supported filters and UTF16 q boundaries", () => {
  for (const limit of ["1", "99", "100"]) expect(filterQuery({ limit }).get("limit")).toBe(limit);
  for (const benefitState of states) expect(filterQuery({ benefitState }).get("benefitState")).toBe(benefitState);
  const filters = { sort: "oldest", duplicate: "true", userId: adminId, q: " 😀".trim().repeat(60), from: "2026-01-01T00:00:00.1Z", to: "2027-01-02T00:00:00Z", cursor: "opaque" };
  expect(filterQuery(filters).get("q")).toHaveLength(120);
  expect(filterQuery({ q: "  tên + % _  ", duplicate: "false", cursor: "" }).get("q")).toBe("tên + % _");
  expect(filterQuery({ q: "  ", from: undefined }).size).toBe(0);
});
test("admin rejects non-string filters and normalized invalid UTC hour", () => {
  expect(() => filterQuery({ q: 1 } as never)).toThrow(ContractError);
  expect(() => filterQuery({ q: null } as never)).toThrow(ContractError);
  expect(() => filterQuery({ from: "2026-01-01T24:00:00Z", to: "2026-01-03T00:00:00Z" })).toThrow(ContractError);
});
test("admin extension cannot send cookies/CSRF to another origin or unsupported write path", async () => {
  for (const url of ["https://evil.invalid/v1/admin/feedback-popup", "http://api.homemind.vn/v1/admin/feedback-popup", "https://user:pass@api.homemind.vn/v1/admin/feedback-popup", "https://api.homemind.vn/v1/admin/feedback-popup#x", "https://api.homemind.vn/v1/admin/users"]) await expect(requestFeedbackAdmin(url, "GET", configSchema)).rejects.toThrow(ContractError);
  await expect(requestFeedbackAdmin("https://api.homemind.vn/v1/admin/feedback-popup/submissions", "PATCH", configSchema, { csrf: "csrf" })).rejects.toThrow(ContractError);
  await expect(requestFeedbackAdmin("https://api.homemind.vn/v1/admin/feedback-popup?q=x", "PATCH", configSchema, { csrf: "csrf" })).rejects.toThrow(ContractError);
  await expect(requestFeedbackAdmin("https://api.homemind.vn/v1/admin/feedback-popup", "GET", configSchema, { body: {} })).rejects.toThrow(ContractError);
});
test("admin HTTP uses existing credentials/cache and exact CSRF PATCH; no extra body", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return Response.json(adminEnvelope(init?.method === "PATCH" ? { ...adminConfig, changed: true, enabled: true, revision: 2 } : String(url).includes(adminId) ? adminDetail : String(url).includes("submissions") ? adminList : adminConfig)); };
  await readConfig(); await readList({ q: " + % ", limit: "1" }); await readDetail(adminId); await updateConfig(true, 1, "local-csrf");
  expect(calls[0].url).toBe("https://api.homemind.vn/v1/admin/feedback-popup");
  for (const call of calls) { expect(call.init?.credentials).toBe("include"); expect(call.init?.cache).toBe("no-store"); expect(call.init?.redirect).toBe("error"); }
  expect(calls[3].init?.method).toBe("PATCH"); expect(calls[3].init?.headers).toEqual({ "Content-Type": "application/json", "X-HomeMind-Admin-CSRF": "local-csrf" });
  expect(JSON.parse(calls[3].init!.body as string)).toEqual({ enabled: true, expectedRevision: 1 });
  expect(() => readDetail("bad")).toThrow(); expect(() => updateConfig(true, 0, "csrf")).toThrow();
  await expect(updateConfig(true, 1, "")).rejects.toThrow(ContractError);
});
for (const status of [400, 401, 403, 404, 409, 500, 503]) test(`admin failure ${status} safe, authorization invalidation and PATCH never retried`, async () => {
  let invalidations = 0, posts = 0;
  configureClient({ onAuthorizationFailure: () => invalidations++ });
  globalThis.fetch = async () => { posts++; return Response.json(adminError("ERROR"), { status }); };
  await expect(updateConfig(true, 1, "csrf")).rejects.toBeInstanceOf(ApiError);
  expect(posts).toBe(1); expect(invalidations).toBe(status === 401 || status === 403 ? 1 : 0);
});
test("admin read 503 retry only once; malformed/wrong version/nonJSON/status fails", async () => {
  let attempts = 0; globalThis.fetch = async () => ++attempts === 1 ? Response.json(adminError("ADMIN_UNAVAILABLE"), { status: 503 }) : Response.json(adminEnvelope(adminConfig));
  await readConfig(); expect(attempts).toBe(2);
  for (const response of [Response.json({ ...adminEnvelope(adminConfig), meta: { ...adminEnvelope(adminConfig).meta, version: "new" } }), Response.json(adminEnvelope({ ...adminConfig, enabled: "true" })), new Response("not JSON"), Response.json(adminEnvelope(adminConfig), { status: 202 })]) {
    globalThis.fetch = async () => response; await expect(readConfig()).rejects.toBeInstanceOf(ContractError);
  }
});
test("admin network, abort, session cleared and stale completion", async () => {
  globalThis.fetch = async () => { throw new Error("sensitive transport detail"); }; await expect(readConfig()).rejects.toMatchObject({ code: "NETWORK_UNAVAILABLE" });
  let finish!: (response: Response) => void;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = readConfig(); await new Promise(resolve => setTimeout(resolve, 10)); clearClient(); finish(Response.json(adminEnvelope(adminConfig))); await expect(pending).rejects.toHaveProperty("name", "AbortError");
  const controller = new AbortController(); controller.abort(); await expect(readConfig(controller.signal)).rejects.toHaveProperty("name", "AbortError");
});
test("malformed/nonJSON 401 and 403 still invalidate session", async () => {
  for (const status of [401, 403]) for (const json of [true, false]) {
    let invalidations = 0; configureClient({ onAuthorizationFailure: () => invalidations++ });
    globalThis.fetch = async () => json ? Response.json({ unexpected: true }, { status }) : new Response("broken", { status });
    await expect(readConfig()).rejects.toBeInstanceOf(ContractError); expect(invalidations).toBe(1);
  }
});
test("admin 429 shared cooldown forbids immediate PATCH", async () => {
  let calls = 0; globalThis.fetch = async () => { calls++; return Response.json(adminError("ADMIN_RATE_LIMITED"), { status: 429, headers: { "Retry-After": "60" } }); };
  await expect(readConfig()).rejects.toMatchObject({ status: 429 });
  await expect(updateConfig(true, 1, "csrf")).rejects.toMatchObject({ status: 429, code: "CLIENT_RATE_WAIT" }); expect(calls).toBe(1);
});
