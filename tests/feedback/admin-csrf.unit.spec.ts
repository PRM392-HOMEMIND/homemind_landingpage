import { test, expect } from "@playwright/test";
import { sessionStore, withAdminCsrf } from "../../src/lib/auth/admin-session";
import { clearClient } from "../../src/lib/admin-api/client";
import { adminEnvelope, adminId } from "./admin-fixtures";
import type { Identity } from "../../src/lib/admin-api/types";

// Unit boundary fixtures only. Actual cookie/auth/CSRF enforcement is tested
// separately against the owned Nest/PostgreSQL fixture and real browsers.
const identity: Identity = { id: adminId, email: "csrf-unit@example.test", role: "SYSTEM_ADMIN", sessionId: adminId,
  expiresAt: "2099-01-01T00:00:00.000Z", capabilities: [], idleSeconds: 1800, absoluteSeconds: 28800 };
const originalFetch = globalThis.fetch;
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
let saved: ReturnType<typeof sessionStore.getSnapshot>;
test.beforeEach(() => {
  saved = { ...sessionStore.getSnapshot() }; clearClient();
  Object.assign(sessionStore.getSnapshot(), { phase: "authenticated", identity });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: {
    request: async (_name: string, _options: unknown, action: () => Promise<unknown>) => action(),
  } } });
  globalThis.fetch = async () => { throw new Error("Unexpected unit request"); };
});
test.afterEach(() => {
  clearClient(); Object.assign(sessionStore.getSnapshot(), saved); globalThis.fetch = originalFetch;
  if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
  else Reflect.deleteProperty(globalThis, "navigator");
});
for (const phase of ["checking", "guest", "error"] as const) test(`CSRF write boundary denies ${phase} before requesting a token or invoking a write`, async () => {
  sessionStore.getSnapshot().phase = phase; let writes = 0;
  await expect(withAdminCsrf(async () => { writes++; })).rejects.toMatchObject({ status: 401, code: "ADMIN_UNAUTHORIZED" });
  expect(writes).toBe(0);
});
test("aborted write boundary cannot request CSRF or invoke a write", async () => {
  const controller = new AbortController(); controller.abort(); let writes = 0;
  await expect(withAdminCsrf(async () => { writes++; }, controller.signal)).rejects.toHaveProperty("name", "AbortError"); expect(writes).toBe(0);
});
test("each intentional write obtains a fresh validated CSRF token under the existing lock", async () => {
  let reads = 0;
  globalThis.fetch = async (url, init) => {
    expect(String(url)).toBe("https://api.homemind.vn/v1/admin/auth/csrf"); expect(init?.credentials).toBe("include"); expect(init?.cache).toBe("no-store");
    return Response.json(adminEnvelope({ csrfToken: `unit-token-${++reads}`, expiresIn: 60 }));
  };
  expect(await withAdminCsrf(async token => token)).toBe("unit-token-1");
  expect(await withAdminCsrf(async token => token)).toBe("unit-token-2"); expect(reads).toBe(2);
});
for (const change of ["phase", "revision"] as const) test(`session ${change} changing during CSRF read prevents a stale write even if transport completes`, async () => {
  let finish: ((value: Response) => void) | undefined, writes = 0;
  globalThis.fetch = async () => new Promise(resolve => { finish = resolve; });
  const pending = withAdminCsrf(async () => { writes++; });
  await expect.poll(() => !!finish).toBe(true);
  if (change === "phase") sessionStore.getSnapshot().phase = "guest";
  else sessionStore.getSnapshot().revision++;
  finish!(Response.json(adminEnvelope({ csrfToken: "unit-token-stale", expiresIn: 60 })));
  await expect(pending).rejects.toHaveProperty("name", "AbortError"); expect(writes).toBe(0);
});
