import { test, expect, type Page, type Route } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { localFixture } from "./local-fixture";
import { adminConfig, adminList, adminDetail, adminEnvelope, adminError, adminId, adminItem } from "./admin-fixtures";
import { validDraft } from "./contract-fixtures";
const WEBSITE = "https://homemind.vn";
const API = "https://api.homemind.vn/v1";
const PATH = "/bang-dieu-khien/phan-hoi-qua-tang";
type Harness = { errors: string[]; writes: Array<{ body: unknown; csrf: boolean }>; reads: string[]; aborts: Array<{ path: string; method: string; reason?: string }>; handler?: (route: Route, path: string) => Promise<void>; intentionalNetworkError?: boolean; navigationAbort?: boolean };
const harness = new WeakMap<Page, Harness>();
test.beforeEach(async ({ page, context }, info) => {
  const fixture = localFixture(); fixture.enabled(false); fixture.sql("DELETE FROM admin.login_limits;");
  const state: Harness = { errors: [], writes: [], reads: [], aborts: [] }; harness.set(page, state);
  const directTls = info.project.name === "webkit" && !!process.env.FEEDBACK_LOCAL_HTTPS_PROXY;
  if (directTls) {
    const tls = JSON.parse(readFileSync(process.env.FEEDBACK_LOCAL_HTTPS_PROXY!, "utf8"));
    const response = await fetch(`${tls.url}/fixture-identity`); const identity = await response.json();
    if (!response.ok || identity.fixture !== fixture.name || identity.apiPort !== new URL(fixture.baseUrl).port || identity.productionDatabaseAccess !== false) throw new Error("HTTPS fixture ownership mismatch");
  }
  page.on("pageerror", error => state.errors.push(error.message));
  page.on("requestfailed", request => { if (request.url().startsWith(API)) state.aborts.push({ path: new URL(request.url()).pathname, method: request.method(), reason: request.failure()?.errorText }); });
  page.on("console", message => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) state.errors.push(message.text()); });
  // Approved origin and secure admin cookies stay in the browser. Every API
  // request is mapped to our labelled local fixture; none can reach production.
  await context.route(`${WEBSITE}/**`, async route => {
    const url = new URL(route.request().url());
    if (!["GET", "HEAD"].includes(route.request().method())) throw new Error("Read-only FE mapper");
    if (directTls) { await route.continue(); return; }
    // Match the pinned Next app-router FLIGHT_HEADERS transport. Dropping RSC
    // makes the local server return HTML for a browser Flight/prefetch request.
    // Forward routing metadata only, never Cookie/Authorization to the FE mapper.
    const incoming = route.request().headers(), requestHeaders: Record<string, string> = {};
    for (const name of ["rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch", "next-hmr-refresh", "next-url"]) {
      if (incoming[name] !== undefined) requestHeaders[name] = incoming[name];
    }
    const response = await fetch(`${process.env.FEEDBACK_BASE_URL || "http://127.0.0.1:3417"}${url.pathname}${url.search}`, { redirect: "manual", headers: requestHeaders });
    const headers = Object.fromEntries(response.headers); for (const key of ["content-encoding", "content-length", "transfer-encoding"]) delete headers[key];
    await route.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) });
  });
  await context.route("https://api.homemind.vn/**", async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/v1/")) throw new Error("Unverified API path");
    if (route.request().method() === "PATCH") state.writes.push({ body: route.request().postDataJSON(), csrf: !!route.request().headers()["x-homemind-admin-csrf"] });
    if (url.pathname.startsWith("/v1/admin/feedback-popup")) {
      state.reads.push(url.search);
      if (state.handler) { await state.handler(route, url.pathname.slice("/v1/admin/feedback-popup".length)); return; }
    }
    if (directTls) { await route.continue(); return; }
    const response = await route.fetch({ url: url.href.replace(API, fixture.baseUrl) }); await route.fulfill({ response });
  });
  if (info.project.name === "chromium" && process.env.FEEDBACK_BROWSER_COVERAGE === "1") await page.coverage.startJSCoverage({ resetOnNavigation: false });
});
test.afterEach(async ({ page }, info) => {
  // A 401 redirect starts the login page's own finite guest-session read. Let
  // it finish before Playwright disposes the route.fetch response/context.
  if (new URL(page.url()).pathname === "/dang-nhap") await page.waitForLoadState("networkidle");
  // Failure context must not retain even a synthetic fixture password.
  const password = page.getByLabel("Mật khẩu", { exact: true });
  if (await password.count()) await password.fill("", { timeout: 1000 }).catch(() => {});
  if (info.project.name === "chromium" && process.env.FEEDBACK_BROWSER_COVERAGE === "1") writeFileSync(info.outputPath("browser-coverage.json"), JSON.stringify(await page.coverage.stopJSCoverage()));
  localFixture().enabled(false);
  const state = harness.get(page)!;
  const verifiedNavigationCancel = state.navigationAbort && state.aborts.some(request => request.reason === "Load request cancelled" && ["/v1/admin/auth/csrf", "/v1/admin/feedback-popup"].includes(request.path));
  const expected = state.intentionalNetworkError && info.project.name === "firefox" ? ['[JavaScript Error: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://api.homemind.vn/v1/admin/feedback-popup. (Reason: CORS request did not succeed). Status code: (null)."]'] :
    info.project.name === "webkit" && verifiedNavigationCancel && state.errors.length ? ["/api.homemind.vn/v1/admin/feedback-popup due to access control checks."] : [];
  expect(harness.get(page)!.errors, "Only the exact diagnostic for an intentionally aborted fixture is expected").toEqual(expected);
});
async function login(page: Page) {
  const manifest = JSON.parse(readFileSync(process.env.FEEDBACK_LOCAL_FIXTURE!, "utf8"));
  if (!/^H:[\\/]/i.test(manifest.adminCredentials || "")) throw new Error("Owned local credentials only");
  const credentials = JSON.parse(readFileSync(manifest.adminCredentials, "utf8"));
  await navigate(page, `${WEBSITE}/dang-nhap`); await page.getByLabel("Email quản trị", { exact: true }).fill(credentials.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(`${WEBSITE}/bang-dieu-khien`); await expect(page.locator(".hm-main")).toBeVisible();
  await page.waitForLoadState("networkidle");
}
async function navigate(page: Page, url: string) {
  // Let fonts from the current page finish before deliberately leaving it.
  // Firefox otherwise reports NS_BINDING_ABORTED as a failed font download.
  await page.evaluate(() => document.fonts.ready);
  return page.goto(url);
}
async function visit(page: Page, assertHeading = true) { await login(page); await navigate(page, `${WEBSITE}${PATH}`); if (assertHeading) await expect(page.getByRole("heading", { name: "Phản hồi và quà tặng", exact: true })).toBeVisible(); }
function fixtureResponses(page: Page, config: unknown = adminConfig, list: unknown = adminList, detail: unknown = adminDetail) {
  harness.get(page)!.handler = async (route, path) => route.fulfill({ json: adminEnvelope(path === "" ? config : path === "/submissions" ? list : detail) });
}
test("frontend fixture preserves Next RSC request headers and response content type", async ({ page }) => {
  fixtureResponses(page); await visit(page);
  const response = await page.evaluate(async () => {
    const result = await fetch("/bang-dieu-khien", { headers: { RSC: "1", "Next-Router-Prefetch": "1" } });
    await result.arrayBuffer();
    return { status: result.status, contentType: result.headers.get("content-type") };
  });
  expect(response.status).toBe(200);
  expect(response.contentType).toContain("text/x-component");
});

test("real guest deep link denial, secure login/navigation and logout clears admin data", async ({ page }) => {
  const response = await navigate(page, `${WEBSITE}${PATH}/${adminId}`); expect(response!.headers()["cache-control"]).toContain("no-store"); await page.waitForURL("**/dang-nhap");
  await visit(page); await expect(page.getByRole("link", { name: "Phản hồi và quà tặng", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Menu tài khoản quản trị" }).click(); await page.getByRole("menuitem", { name: "Đăng xuất", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await page.waitForURL("**/dang-nhap");
  await expect(page.getByText("Thông tin đăng ký và góp ý", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});
test("real authorized local campaign toggles only after confirmation, cancel/focus and single-flight", async ({ page }) => {
  await visit(page); const enable = page.getByRole("button", { name: "Bật campaign", exact: true }); await enable.click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true })).toBeFocused(); await page.keyboard.press("Escape"); await expect(enable).toBeFocused(); expect(harness.get(page)!.writes).toHaveLength(0);
  await enable.click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).dblclick();
  await expect(page.getByText("Đang bật", { exact: true })).toBeVisible(); expect(harness.get(page)!.writes).toHaveLength(1); expect(harness.get(page)!.writes[0].csrf).toBe(true);
  await page.getByRole("button", { name: "Tắt campaign", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(page.getByText("Đang tắt", { exact: true })).toBeVisible();
});
test("fixtures pagination/filter reset, XSS-safe list and lifecycle detail", async ({ page }) => {
  fixtureResponses(page, adminConfig, { ...adminList, page: { limit: 25, hasMore: true, nextCursor: "fixture-cursor" } }); await visit(page);
  await expect(page.getByText(adminItem.fullName, { exact: true })).toBeVisible(); expect(await page.evaluate(() => Reflect.get(window, "leak"))).toBeUndefined();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click(); await expect(page.getByText("Trang 2", { exact: true })).toBeVisible();
  await page.getByLabel("Tìm tên, email hoặc số điện thoại").fill("Nguyễn + %"); await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click(); await expect(page.getByText("Trang 1", { exact: true })).toBeVisible();
  await expect.poll(() => harness.get(page)!.reads.at(-1)).toContain("q=Nguy"); expect(harness.get(page)!.reads.at(-1)).not.toContain("cursor"); expect(page.url()).not.toContain("Nguy");
  await page.getByRole("link", { name: /Xem chi tiết đăng ký/ }).click(); await expect(page.getByRole("heading", { name: "Chi tiết đăng ký và quà" })).toBeVisible();
  await expect(page.getByText("Không được theo dõi", { exact: true })).toBeVisible(); await expect(page.getByText(adminItem.reviewPreview, { exact: true })).toBeVisible(); expect(await page.evaluate(() => Reflect.get(window, "leak"))).toBeUndefined();
});
for (const status of [400, 401, 403, 404, 429, 500, 503]) test(`admin fixture list error ${status}, recovery/privacy`, async ({ page }) => {
  const state = harness.get(page)!; state.handler = async (route, path) => route.fulfill(path === "" ? { json: adminEnvelope(adminConfig) } : { status, json: adminError("ADMIN_ERROR"), headers: { "Retry-After": "60", "Access-Control-Expose-Headers": "Retry-After", ...(status === 401 ? { "Set-Cookie": "__Host-homemind-admin=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict" } : {}) } });
  await visit(page, status !== 401 && status !== 403);
  if (status === 401) { await page.waitForURL("**/dang-nhap"); return; }
  if (status === 403) { await expect(page.locator(".hm-guard .hm-error")).toBeVisible(); await expect(page.locator(".hm-main")).toHaveCount(0); return; }
  await expect(page.locator(".hm-error")).toBeVisible(); await expect(page.locator(".hm-main")).not.toContainText("sensitive server message");
  if (status === 429) await expect(page.getByRole("button", { name: /Thử lại sau/ })).toBeDisabled();
  else { fixtureResponses(page); await page.getByRole("button", { name: "Thử lại", exact: true }).click(); await expect(page.getByRole("cell").filter({ hasText: adminItem.email })).toBeVisible(); }
});
for (const variant of ["empty", "missing-lifecycle", "unknown-state", "malformed", "non-json"]) test(`admin fixture ${variant} honest presentation`, async ({ page }) => {
  if (variant === "empty") fixtureResponses(page, adminConfig, { ...adminList, items: [] });
  else if (variant === "missing-lifecycle") { const { lifecycle: _life, ...item } = adminItem; void _life; fixtureResponses(page, adminConfig, { ...adminList, items: [item] }); }
  else if (variant === "unknown-state") fixtureResponses(page, adminConfig, { ...adminList, items: [{ ...adminItem, lifecycle: { ...adminItem.lifecycle, state: "FUTURE" } }] });
  else harness.get(page)!.handler = async (route, path) => route.fulfill(path === "" ? { json: adminEnvelope(adminConfig) } : variant === "non-json" ? { body: "broken" } : { json: adminEnvelope({ items: "broken" }) });
  await visit(page);
  if (variant === "empty") await expect(page.getByText("Chưa có bản ghi", { exact: true })).toBeVisible();
  else if (variant === "missing-lifecycle") await expect(page.getByText(/chưa đủ thông tin mã quà/)).toBeVisible();
  else if (variant === "unknown-state") await expect(page.getByRole("cell").filter({ hasText: "Trạng thái chưa hỗ trợ" })).toBeVisible();
  else await expect(page.locator(".hm-error")).toBeVisible();
});
for (const failure of ["conflict", "unknown-conflict", "network", "pending-navigation"]) test(`admin fixture PATCH ${failure}, no retry and stale result`, async ({ page }) => {
  const state = harness.get(page)!; state.intentionalNetworkError = failure === "network"; state.handler = async (route, path) => {
    if (route.request().method() === "PATCH") {
      if (failure === "network") await route.abort("failed");
      else if (failure === "conflict" || failure === "unknown-conflict") await route.fulfill({ status: 409, json: adminError(failure === "conflict" ? "CONFIG_REVISION_CONFLICT" : "FUTURE_CONFLICT") });
      else await new Promise<void>(() => {});
    } else await route.fulfill({ json: adminEnvelope(path === "" ? adminConfig : adminList) });
  };
  await visit(page); await page.getByRole("button", { name: "Bật campaign", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  if (failure === "pending-navigation") { await expect.poll(() => state.writes.length).toBe(1); await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toBeVisible(); state.navigationAbort = true; await navigate(page, `${WEBSITE}/privacy-policy`); await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); }
  else {
    await expect(page.locator(".hm-error")).toBeVisible();
    if (failure === "unknown-conflict") {
      await expect(page.getByText(/Cấu hình đã thay đổi/)).toHaveCount(0);
      await expect(page.locator(".hm-main")).not.toContainText("sensitive server message");
    } else await expect(page.getByText(failure === "conflict" ? /Cấu hình đã thay đổi/ : /Chưa xác định kết quả cập nhật/)).toBeVisible();
  }
  expect(state.writes).toHaveLength(1);
});
for (const width of [360, 390, 768, 1280, 1440]) test(`admin responsive ${width}px list/detail/confirmation`, async ({ page }, info) => {
  fixtureResponses(page); await page.setViewportSize({ width, height: 900 }); await visit(page); await expect(page.getByRole("cell").filter({ hasText: adminItem.email })).toBeVisible();
  await page.screenshot({ path: info.outputPath(`admin-list-${width}.png`), animations: "disabled" });
  const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll("body *")].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 16).map(element => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width, overflow: getComputedStyle(element).overflowX, parent: element.parentElement?.className })), region: [...document.querySelectorAll('[role="region"]')].map(element => ({ width: element.clientWidth, scroll: element.scrollWidth, overflow: getComputedStyle(element).overflowX })) }));
  expect(geometry.scroll, JSON.stringify(geometry)).toBeLessThanOrEqual(width + 1);
  await page.getByRole("button", { name: "Bật campaign", exact: true }).click(); await page.setViewportSize({ width, height: 360 });
  await expect(page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true })).toBeInViewport(); await page.screenshot({ path: info.outputPath(`admin-confirm-${width}.png`), animations: "disabled" });
  await page.keyboard.press("Escape"); await page.setViewportSize({ width, height: 900 }); await page.getByRole("link", { name: /Xem chi tiết đăng ký/ }).click(); await expect(page.getByText("Không được theo dõi", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); await page.screenshot({ path: info.outputPath(`admin-detail-${width}.png`), animations: "disabled" });
});

test("real expired/revoked local session clears PII and denies deep link", async ({ page }) => {
  await visit(page); localFixture().sql("UPDATE admin.sessions SET revoked_at=now() WHERE revoked_at IS NULL;");
  await page.getByRole("button", { name: "Tải lại", exact: true }).click(); await page.waitForURL("**/dang-nhap");
  await expect(page.locator(".hm-main")).toHaveCount(0); await navigate(page, `${WEBSITE}${PATH}/${adminId}`); await page.waitForURL("**/dang-nhap");
});
test("fixtures filter validation rejects invalid input without reads; next/previous/reset cursor", async ({ page }) => {
  fixtureResponses(page, adminConfig, { ...adminList, page: { limit: 25, hasMore: true, nextCursor: "opaque" } }); await visit(page);
  await expect(page.getByRole("button", { name: "Trang sau", exact: true })).toBeEnabled(); await page.getByRole("button", { name: "Trang sau", exact: true }).click(); await expect(page.getByText("Trang 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Trang trước", exact: true }).click(); await expect(page.getByText("Trang 1", { exact: true })).toBeVisible();
  await page.getByLabel("Tìm tên, email hoặc số điện thoại").fill("x".repeat(121)); const before = harness.get(page)!.reads.length;
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click(); await expect(page.getByRole("alert").filter({ hasText: "Bộ lọc chưa hợp lệ" })).toBeVisible(); expect(harness.get(page)!.reads).toHaveLength(before);
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click(); await expect(page.getByLabel("Tìm tên, email hoặc số điện thoại")).toHaveValue("");
});
for (const state of ["ACTIVE", "SCHEDULED", "WAITING_ENTITLEMENT", "EXPIRED", "CONFLICT", "BLOCKED", "DUPLICATE"]) test(`fixture detail lifecycle ${state}, API dates/segments/repeat source`, async ({ page }) => {
  const source = "550e8400-e29b-41d4-a716-446655440001";
  fixtureResponses(page, adminConfig, adminList, { ...adminDetail, duplicate: true,
    benefit: { ...adminItem.benefit, state: "DUPLICATE", postponed: true },
    lifecycle: { ...adminItem.lifecycle, state, sourceSubmissionId: source, rewardId: source, accountId: source,
      accountCreatedAt: "2026-10-01T00:00:00.000Z", linkedAt: "2026-10-10T02:00:00.000Z", awardedAt: "2026-10-10T02:00:00.000Z",
      expectedStartsAt: "2026-12-01T00:00:00.000Z", expectedEndsAt: "2026-12-31T00:00:00.000Z", actualStartedAt: "2026-10-10T02:00:00.000Z",
      completedAt: "2026-12-31T00:00:00.000Z", allotmentConsumed: true, submissionCount: 3, logicalRewardCount: 1,
      allocatedSeconds: 2592000, elapsedSeconds: 100, remainingSeconds: 2591900, segmentCount: 1 },
    segments: [{ id: source, startsAt: "2026-10-10T02:00:00.000Z", endsAt: "2026-10-11T02:00:00.000Z", plannedEndsAt: "2026-11-09T02:00:00.000Z", supersededAt: "2026-10-11T02:00:00.000Z", supersededBy: "PAID" }],
  }); await visit(page); await navigate(page, `${WEBSITE}${PATH}/${adminId}`); await expect(page.getByText("Đã dùng suất nhận quà", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem lượt gửi gốc và các giai đoạn quyền" })).toHaveAttribute("href", `${PATH}/${source}`);
  await expect(page.getByText(/Đã thay thế lúc/)).toBeVisible(); await expect(page.getByText("Không được theo dõi", { exact: true })).toBeVisible();
  await expect(page.locator(".hm-main")).toContainText("31/12/2026");
});
test("fixture detail without lifecycle and config malformed/network/loading stays safe", async ({ page }) => {
  const { lifecycle: _life, ...detail } = adminDetail; void _life;
  fixtureResponses(page, { ...adminConfig, enabled: "true" }, adminList, detail); await visit(page);
  await expect(page.locator(".hm-error")).toBeVisible(); await expect(page.getByRole("button", { name: "Bật campaign", exact: true })).toHaveCount(0);
  fixtureResponses(page, adminConfig, adminList, detail); await page.getByRole("button", { name: "Thử lại", exact: true }).click(); await expect(page.getByRole("button", { name: "Bật campaign", exact: true })).toBeVisible();
  await navigate(page, `${WEBSITE}${PATH}/${adminId}`); await expect(page.getByText("Chưa có dữ liệu", { exact: true }).first()).toBeVisible();
  harness.get(page)!.handler = async (route, path) => { if (path === "") await new Promise<void>(() => {}); else await route.fulfill({ json: adminEnvelope(adminList) }); };
  await navigate(page, `${WEBSITE}${PATH}`); await expect(page.locator(".hm-panel").first().getByRole("status")).toContainText("Đang tải"); await expect(page.getByRole("button", { name: "Bật campaign", exact: true })).toHaveCount(0);
});
test("fixture PATCH timeout has uncertain result and no automatic retry", async ({ page }) => {
  const state = harness.get(page)!; state.handler = async (route, path) => {
    if (route.request().method() === "PATCH") await new Promise<void>(() => {});
    else await route.fulfill({ json: adminEnvelope(path === "" ? adminConfig : adminList) });
  }; await visit(page); await page.getByRole("button", { name: "Bật campaign", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.locator(".hm-error")).toContainText("Chưa xác định kết quả cập nhật", { timeout: 25000 }); expect(state.writes).toHaveLength(1); await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("CSRF request abort on navigation cannot send stale PATCH", async ({ page, context }) => {
  const aborts: Array<{ path: string; method: string; reason: string | undefined }> = [];
  page.on("requestfailed", request => { if (request.url().startsWith(API)) aborts.push({ path: new URL(request.url()).pathname, method: request.method(), reason: request.failure()?.errorText }); });
  fixtureResponses(page); await visit(page);
  let csrfReads = 0;
  await context.route(`${API}/admin/auth/csrf`, async () => { csrfReads++; await new Promise<void>(() => {}); });
  await page.getByRole("button", { name: "Bật campaign", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect.poll(() => csrfReads).toBe(1); harness.get(page)!.navigationAbort = true; await navigate(page, `${WEBSITE}/privacy-policy`); await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); expect(harness.get(page)!.writes).toHaveLength(0);
  await test.info().attach("owned-navigation-aborts", { body: JSON.stringify(aborts), contentType: "application/json" });
});
test("fixture stale list response cannot replace a newer filter result", async ({ page }) => {
  let release!: () => Promise<void>;
  harness.get(page)!.handler = async (route, path) => {
    if (path === "") { await route.fulfill({ json: adminEnvelope(adminConfig) }); return; }
    if (!new URL(route.request().url()).searchParams.has("q")) { release = async () => { try { await route.fulfill({ json: adminEnvelope(adminList) }); } catch {} }; await new Promise<void>(() => {}); }
    else await route.fulfill({ json: adminEnvelope({ ...adminList, items: [] }) });
  }; await visit(page); await expect.poll(() => typeof release).toBe("function");
  await page.getByLabel("Tìm tên, email hoặc số điện thoại").fill("mới"); await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click(); await expect(page.getByText("Không có kết quả phù hợp", { exact: true })).toBeVisible();
  await release(); await expect(page.getByText("Không có kết quả phù hợp", { exact: true })).toBeVisible(); await expect(page.getByText(adminItem.fullName, { exact: true })).toHaveCount(0);
});
test("prototype-named states and HTML reason codes remain safe admin text", async ({ page }) => {
  fixtureResponses(page, adminConfig, { ...adminList, items: [{ ...adminItem, benefit: { ...adminItem.benefit, state: "__proto__" }, lifecycle: { ...adminItem.lifecycle, state: "constructor" } }] }, { ...adminDetail, benefit: { ...adminItem.benefit, state: "__proto__", reason: "<img src=x onerror=window.leak=1>" }, lifecycle: { ...adminItem.lifecycle, state: "constructor" } });
  await visit(page); await expect(page.getByRole("cell").filter({ hasText: "Trạng thái chưa hỗ trợ" })).toBeVisible();
  await page.getByRole("link", { name: /Xem chi tiết đăng ký/ }).click(); await expect(page.getByText("<img src=x onerror=window.leak=1>", { exact: true })).toBeVisible(); expect(await page.evaluate(() => Reflect.get(window, "leak"))).toBeUndefined();
});

test("existing dashboard sections remain readable through the owned released backend", async ({ page }, info) => {
  test.setTimeout(info.project.name === "webkit" ? 360000 : 90000);
  await login(page);
  for (const section of ["", "khach-hang", "khong-gian", "thanh-toan", "goi-su-dung", "su-dung-ai", "thong-bao", "van-hanh", "nhat-ky", "phien-dang-nhap"]) {
    await navigate(page, `${WEBSITE}/bang-dieu-khien${section ? `/${section}` : ""}`);
    await expect(page.locator(".hm-main")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".hm-main .hm-loading")).toHaveCount(0);
    await expect(page.locator(".hm-main .hm-error")).toHaveCount(0);
  }
  expect(harness.get(page)!.writes).toHaveLength(0);
});

test("every admin filter control sends the documented query and resets pagination", async ({ page }, info) => {
  fixtureResponses(page); await visit(page);
  const expected = { q: "Nguyễn", benefitState: "ACTIVE", duplicate: "true", userId: adminId, from: "2026-10-01T00:00:00Z", to: "2026-11-01T00:00:00Z", sort: "oldest", limit: "100" };
  await page.getByLabel("Tìm tên, email hoặc số điện thoại", { exact: true }).fill(expected.q);
  await page.getByRole("combobox", { name: "Trạng thái lượt gửi", exact: true }).selectOption(expected.benefitState);
  await page.getByRole("combobox", { name: "Lượt gửi", exact: true }).selectOption(expected.duplicate);
  await page.getByLabel("Mã tài khoản", { exact: true }).fill(expected.userId);
  await page.getByLabel("Từ thời điểm (UTC)", { exact: true }).fill(expected.from);
  await page.getByLabel("Đến thời điểm (UTC, không bao gồm)", { exact: true }).fill(expected.to);
  await page.getByRole("combobox", { name: "Sắp xếp", exact: true }).selectOption(expected.sort);
  await page.getByRole("combobox", { name: "Số bản ghi mỗi trang", exact: true }).selectOption(expected.limit);
  await page.getByRole("button", { name: "Áp dụng bộ lọc", exact: true }).click();
  await expect.poll(() => Object.fromEntries(new URLSearchParams(harness.get(page)!.reads.at(-1)))).toEqual(expected);
  expect(page.url()).not.toContain(expected.q);
  await page.getByRole("region", { name: "Danh sách đăng ký, có thể cuộn ngang" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("admin-table-filtered.png"), animations: "disabled" });
});

test("legacy benefit dates, superseded segments and unsupported usage stay truthful", async ({ page }, info) => {
  const { lifecycle: _life, ...legacy } = adminDetail; void _life;
  const detail = { ...legacy, benefit: { ...legacy.benefit, state: "ACTIVE", userId: adminId, workspaceId: adminId, boundAt: "2026-10-10T01:00:00.000Z", grantedAt: "2026-10-10T01:00:00.000Z", startsAt: "2026-10-10T01:00:00.000Z", endsAt: "2026-11-09T01:00:00.000Z", postponed: true }, segments: [{ id: adminId, startsAt: "2026-10-10T01:00:00.000Z", endsAt: "2026-10-11T01:00:00.000Z", plannedEndsAt: "2026-11-09T01:00:00.000Z", supersededAt: "2026-10-11T01:00:00.000Z", supersededBy: "PAID" }] };
  fixtureResponses(page, adminConfig, adminList, detail); await visit(page); await navigate(page, `${WEBSITE}${PATH}/${adminId}`);
  const fact = (label: string) => page.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd");
  await expect(fact("Tài khoản liên kết")).toHaveText(adminId); await expect(fact("Cấp quà lần đầu")).not.toHaveText("Chưa có thông tin");
  await expect(fact("Số quà logic của tài khoản")).toHaveText("Chưa có thông tin");
  await expect(page.getByText(/Đã thay thế lúc/)).toBeVisible();
  const richer = { ...detail, lifecycle: { ...adminDetail.lifecycle, featureUsage: { status: "FUTURE_UNKNOWN", used: null } } };
  fixtureResponses(page, adminConfig, adminList, richer); await navigate(page, `${WEBSITE}${PATH}/${adminId}`);
  await expect(fact("Sử dụng tính năng Premium")).toHaveText("Chưa có dữ liệu được hỗ trợ");
  await expect(fact("Bắt đầu dự kiến")).not.toHaveText("Chưa có thông tin");
  await page.screenshot({ path: info.outputPath("admin-legacy-detail.png"), fullPage: true, animations: "disabled" });
});

test("invalid private detail deep link fails safely without a detail API request", async ({ page }) => {
  fixtureResponses(page); await visit(page); const before = harness.get(page)!.reads.length;
  await navigate(page, `${WEBSITE}${PATH}/not-a-uuid`); await expect(page.locator(".hm-error")).toBeVisible();
  expect(harness.get(page)!.reads.length).toBe(before); await expect(page.locator(".hm-main")).not.toContainText(adminItem.email);
});

for (const status of [400, 401, 403, 429]) test(`campaign PATCH documented rejection ${status} has no retry and no false success`, async ({ page }) => {
  const state = harness.get(page)!; state.handler = async (route, path) => {
    if (route.request().method() === "PATCH") await route.fulfill({ status, json: adminError("ADMIN_REJECTION"), headers: { "Retry-After": "60", "Access-Control-Expose-Headers": "Retry-After", ...(status === 401 ? { "Set-Cookie": "__Host-homemind-admin=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict" } : {}) } });
    else await route.fulfill({ json: adminEnvelope(path === "" ? adminConfig : adminList) });
  };
  await visit(page); await page.getByRole("button", { name: "Bật campaign", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  if (status === 401) await page.waitForURL("**/dang-nhap");
  else if (status === 403) { await expect(page.locator(".hm-guard .hm-error")).toBeVisible(); await expect(page.locator(".hm-main")).toHaveCount(0); }
  else await expect(page.locator(".hm-error").filter({ hasText: adminId })).toBeVisible();
  expect(state.writes).toHaveLength(1); await expect(page.getByText("Máy chủ đã xác nhận cập nhật cấu hình.", { exact: true })).toHaveCount(0);
});

test("real linked account detail and repeated submissions show server dates and one logical reward", async ({ page }) => {
  const fixture = localFixture(); fixture.enabled(true);
  const marker = `FE lifecycle ${randomUUID()}`, email = `fe-detail-${randomUUID()}@example.test`, phone = `091${Math.floor(1000000 + Math.random() * 8999999)}`;
  const headers = { "Content-Type": "application/json", Origin: WEBSITE };
  const body = { ...validDraft, fullName: marker, email, phoneNumber: phone };
  const ids: string[] = [];
  for (let index = 0; index < 2; index++) {
    const response = await fetch(`${fixture.baseUrl}/public/feedback-popup/submissions`, { method: "POST", headers: { ...headers, "Idempotency-Key": randomUUID() }, body: JSON.stringify(body) });
    expect(response.status).toBe(202); ids.push((await response.json()).submissionId);
  }
  const signup = await fetch(`${fixture.baseUrl}/auth/register`, { method: "POST", headers, body: JSON.stringify({ email, phone, displayName: "Owned local FE lifecycle", password: randomUUID(), workspaceType: "household", acceptedTerms: true, acceptedPrivacy: true }) });
  expect(signup.status).toBe(201); const account = (await signup.json()).user;
  await visit(page); await page.getByLabel("Tìm tên, email hoặc số điện thoại").fill(marker); await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(page.getByRole("row").filter({ hasText: email })).toHaveCount(2);
  await page.locator(`a[href="${PATH}/${ids[0]}"]`).click();
  await expect(page.getByRole("heading", { name: "Chi tiết đăng ký và quà", exact: true })).toBeVisible();
  const fact = (label: string) => page.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd");
  await expect(fact("Tài khoản liên kết")).toHaveText(account.id);
  await expect(fact("Số quà logic của tài khoản")).toHaveText("1"); await expect(fact("Số lượt gửi trong phạm vi")).toHaveText("2");
  await expect(fact("Đã dùng suất nhận quà")).toHaveText("Có");
  for (const label of ["Tài khoản được tạo", "Liên kết", "Cấp quà lần đầu", "Đã bắt đầu thực tế"]) await expect(fact(label)).not.toHaveText("Chưa có dữ liệu");
  await expect(fact("Trạng thái quà gốc")).toHaveText("Đang có hiệu lực");
  await expect(fact("Sử dụng tính năng Premium")).toHaveText("Không được theo dõi");
  expect(harness.get(page)!.writes).toHaveLength(0);
});

test("optional lifecycle omitted leaves reward counts unknown and empty segments truthful", async ({ page }) => {
  const { lifecycle: _life, ...legacy } = adminDetail; void _life;
  fixtureResponses(page, adminConfig, adminList, legacy); await visit(page); await navigate(page, `${WEBSITE}${PATH}/${adminId}`);
  const fact = (label: string) => page.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd");
  await expect(fact("Trạng thái quà gốc")).toHaveText("Chờ tài khoản");
  await expect(fact("Mã trạng thái lượt gửi / quà gốc")).toHaveText("PENDING_ACCOUNT / Chưa có thông tin");
  for (const label of ["Đã dùng suất nhận quà", "Số quà logic của tài khoản", "Số lượt gửi trong phạm vi", "Lượt đầu / cuối", "Số giai đoạn quyền", "Thời lượng đã phân bổ (giây)"]) await expect(fact(label)).toHaveText("Chưa có thông tin");
  await expect(page.getByText("Chưa có giai đoạn quyền tại bản ghi này. Với lượt gửi lại, xem lượt gửi gốc.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem lượt gửi gốc và các giai đoạn quyền", exact: true })).toHaveCount(0);
});
