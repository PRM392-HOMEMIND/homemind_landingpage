import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { readCredentials } from "./private-credentials.mjs";
import { privateEvidence } from "./private-evidence.mjs";
import { randomUUID } from "node:crypto";
const evidence = await privateEvidence("homemind-admin-contract-");
const checks = [];
let failures = 0;
const document = JSON.parse(
  await readFile(
    new URL("../../docs/HOMEMIND_ADMIN_OPENAPI.json", import.meta.url),
    "utf8",
  ),
);
const source = await readFile(
  new URL("../../src/lib/admin-api/schema.ts", import.meta.url),
  "utf8",
);
const { validateSchema } = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    ).toString("base64")
);
const credentials = await readCredentials();
const browser = await chromium.launch();
const context = await browser.newContext(); // No persistent state, screenshots, traces, or console forwarding.
const page = await context.newPage();
const network = await context.newCDPSession(page);
const methods = new Map();
const preflights = [];
network.on("Network.requestWillBeSent", (event) =>
  methods.set(event.requestId, event.request.method),
);
network.on("Network.responseReceived", (event) => {
  if (
    methods.get(event.requestId) === "OPTIONS" &&
    event.response.url.startsWith("https://api.homemind.vn/")
  ) {
    const headers = Object.fromEntries(
      Object.entries(event.response.headers).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    );
    preflights.push({
      status: event.response.status,
      allowedOrigin:
        headers["access-control-allow-origin"] === "https://homemind.vn",
      credentials: headers["access-control-allow-credentials"] === "true",
    });
  }
});
await network.send("Network.enable");
await page.goto("https://homemind.vn", { waitUntil: "domcontentloaded" });
let csrf;
let authenticated = false;
const records = new Map();
async function request(
  id,
  {
    params = {},
    query = {},
    body,
    invalidCsrf = false,
    rawPath,
    expected = 200,
  } = {},
) {
  const [path, methods] = Object.entries(document.paths).find(([, methods]) =>
    Object.values(methods).some((op) => op.operationId === id),
  );
  const [method, operation] = Object.entries(methods).find(
    ([, op]) => op.operationId === id,
  );
  const url = new URL(
    rawPath || path.replace(/\{(\w+)\}/g, (_, key) => params[key]),
    document.servers[0].url,
  );
  for (const [key, value] of Object.entries(query))
    url.searchParams.set(key, value);
  const result = await page.evaluate(
    async ({ url, method, csrf, body }) => {
      try {
        const response = await fetch(url, {
          method: method.toUpperCase(),
          credentials: "include",
          cache: "no-store",
          headers: {
            ...(method !== "get" ? { "X-HomeMind-Admin-CSRF": csrf } : {}),
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return {
          status: response.status,
          cache: response.headers.get("cache-control"),
          envelope: await response.json(),
        };
      } catch {
        return { status: 0 };
      }
    },
    {
      url: url.href,
      method,
      csrf: invalidCsrf ? "invalid-test-nonce" : csrf,
      body,
    },
  );
  let schema = "BLOCKED";
  if (result.envelope) {
    try {
      validateSchema(
        operation.responses[String(result.status)]?.content["application/json"]
          .schema || document.components.schemas.Error,
        result.envelope,
        document.components.schemas,
      );
      schema = "PASS";
    } catch (error) {
      schema = `FAIL:${error.field}`;
      let probe = result.envelope;
      for (const key of error.field.replace(/^response\./, "").split("."))
        probe = key.endsWith("[]")
          ? probe?.[key.slice(0, -2)]?.[0]
          : probe?.[key];
      if (typeof probe === "string" && /(?:At|asOf)$/.test(error.field))
        console.log(
          JSON.stringify({
            check: "timestamp-syntax-only",
            syntax: probe.replace(/\d/g, "#"),
          }),
        );
    }
  }
  const check = {
    operationId: id,
    status: result.status,
    schema,
    code: result.envelope?.error?.code,
    privateNoStore: result.cache?.includes("no-store") || false,
    result:
      result.status === expected && schema === "PASS" ? "PASS_LIVE" : "FAIL",
    expected,
  };
  checks.push(check);
  if (check.result === "FAIL") failures++;
  console.log(JSON.stringify(check));
  if (result.status === 200) records.set(id, result.envelope.data);
  await new Promise((resolve) => setTimeout(resolve, 650));
  return result;
}
try {
  await request("adminMe", { expected: 401 });
  csrf = (await request("adminCsrf")).envelope?.data?.csrfToken;
  if (!csrf)
    throw new Error("BLOCKED: credentialed CSRF browser request failed");
  const login = await request("adminLogin", { body: credentials });
  if (login.status !== 200)
    throw new Error("BLOCKED: live browser login did not succeed");
  csrf = login.envelope.data.csrfToken;
  authenticated = true;
  const preflight = preflights.find(
    (item) => item.status === 204 && item.allowedOrigin && item.credentials,
  );
  checks.push({
    operationId: "technicalOptions",
    ...preflight,
    result: preflight ? "PASS_LIVE" : "BLOCKED_BROWSER_NETWORK_OBSERVATION",
  });
  console.log(JSON.stringify(checks.at(-1)));
  const cookie = (await context.cookies("https://api.homemind.vn")).find(
    (c) => c.name === "__Host-homemind-admin",
  );
  console.log(
    JSON.stringify({
      check: "cookie-flags",
      secure: cookie?.secure,
      httpOnly: cookie?.httpOnly,
      sameSite: cookie?.sameSite,
      hostOnly: cookie?.domain === "api.homemind.vn",
      path: cookie?.path,
    }),
  );
  for (const id of [
    "adminMe",
    "adminMeta",
    "adminSessions",
    "adminOverview",
    "adminTrends",
    "adminPlanDistribution",
    "adminTopPayingUsers",
    "adminUsers",
    "adminWorkspaces",
    "adminPayments",
    "adminEntitlements",
    "adminUsagePeriods",
    "adminUsageRequests",
    "adminUsageTurns",
    "adminNotifications",
    "adminOperations",
    "adminAuditLogs",
  ])
    await request(id);
  const userId = records.get("adminUsers")?.items?.[0]?.id;
  const workspaceId = records.get("adminWorkspaces")?.items?.[0]?.id;
  const paymentId = records.get("adminPayments")?.items?.[0]?.id;
  const notificationId = records.get("adminNotifications")?.items?.[0]?.id;
  const entryId = records.get("adminAuditLogs")?.items?.[0]?.id;
  for (const [ids, params] of [
    [
      [
        "adminUser",
        "adminUserWorkspaces",
        "adminUserSpending",
        "adminUserActivity",
      ],
      { userId },
    ],
    [
      [
        "adminWorkspace",
        "adminWorkspaceMembers",
        "adminWorkspaceInventory",
        "adminWorkspaceShopping",
      ],
      { workspaceId },
    ],
    [["adminPayment", "adminPaymentTransactions"], { paymentId }],
    [["adminNotification"], { notificationId }],
    [["adminAuditLog"], { entryId }],
  ])
    for (const id of ids) {
      if (Object.values(params).every(Boolean)) await request(id, { params });
      else {
        checks.push({ operationId: id, result: "BLOCKED_NO_LIVE_RECORD" });
        console.log(JSON.stringify(checks.at(-1)));
      }
    }
  if (workspaceId)
    await request("adminCurrentUsage", { query: { workspaceId } });
  // Negative requests never mutate business records. Invalid logout CSRF does not revoke.
  await request("adminUsers", { query: { unknown: "true" }, expected: 400 });
  await request("adminUser", {
    params: { userId: "invalid-uuid" },
    expected: 400,
  });
  await request("adminUser", {
    params: { userId: randomUUID() },
    expected: 404,
  });
  await request("adminOverview", {
    query: { from: "2026-02-30T00:00:00Z", to: "2026-03-01T00:00:00Z" },
    expected: 400,
  });
  await request("adminLogout", { invalidCsrf: true, expected: 403 });
  const first = await request("adminUsers", { query: { limit: "2" } });
  if (first.envelope?.data?.page?.hasMore) {
    const cursor = first.envelope.data.page.nextCursor;
    await request("adminUsers", { query: { limit: "2", cursor } });
    await request("adminUsers", {
      query: { limit: "2", cursor, sort: "oldest" },
      expected: 400,
    });
  }
  const before = cookie?.value;
  const refresh = await request("adminRefresh");
  csrf = refresh.envelope?.data?.csrfToken || csrf;
  console.log(
    JSON.stringify({
      check: "refresh-cookie-rotation",
      rotated:
        before !==
        (await context.cookies("https://api.homemind.vn")).find(
          (c) => c.name === "__Host-homemind-admin",
        )?.value,
    }),
  );
  // Revoke only this harness-created disposable session.
  await request("adminRevokeSession", {
    params: { sessionId: refresh.envelope.data.sessionId },
  });
  authenticated = false;
  await request("adminMe", { expected: 401 });
  checks.push({
    operationId: "adminLogoutAll",
    result: "NOT_RUN_NOT_ISOLATED",
  });
  console.log("adminLogoutAll: NOT_RUN_NOT_ISOLATED");
} catch (error) {
  // Only errors constructed by this harness reach stdout; never raw backend data.
  console.log(
    error.message.startsWith("BLOCKED:")
      ? error.message
      : "FAIL: private live harness error; sensitive values withheld",
  );
  process.exitCode = 2;
} finally {
  if (authenticated) {
    await request("adminLogout");
    await request("adminMe", { expected: 401 });
  }
  await context.close();
  await browser.close();
  await evidence.save("results.json", {
    environment: "approved-production-origin-real-api",
    checks,
    failures,
  });
  console.log(
    `Private contract evidence: ${evidence.directory}; failures: ${failures}`,
  );
  if (failures) process.exitCode = 1;
}
