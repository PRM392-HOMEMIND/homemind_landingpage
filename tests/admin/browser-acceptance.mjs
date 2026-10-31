// Opt-in private acceptance. Business HTTP is always sent to the real API.
// Candidate mode maps only frontend resources to the actual local production build.
// No API interception, mocked success, persistent browser state, trace or console forwarding.
import { chromium, firefox } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { readCredentials } from "./private-credentials.mjs";
import { privateEvidence } from "./private-evidence.mjs";
import { createFrontendContext } from "./frontend-surface.mjs";
import { assertPrimaryTextContrast } from "./browser-contrast.mjs";

const credentials = await readCredentials();
const production = process.argv.includes("--production");
const smoke = process.argv.includes("--smoke");
const local = process.env.ADMIN_CANDIDATE_URL || "http://127.0.0.1:3300";
const evidence = await privateEvidence("homemind-admin-private-");
const buildId = production
  ? (await (await fetch("https://homemind.vn/healthz")).json()).release
  : (await readFile(".next/BUILD_ID", "utf8")).trim();
const checks = [];
const responses = new Map();
const traffic = [];
const failures = [];
let browser;
let context;
let page;
let authenticated = false;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(value, message) {
  if (!value) throw Object.assign(new Error(message), { safe: true });
}
async function check(name, action) {
  try {
    await action();
    checks.push({ name, result: "PASS_LIVE" });
    console.log(`${name}: PASS_LIVE`);
  } catch (error) {
    const reason = error.safe
      ? error.message
      : `Browser action failed (${error.name}); private call details withheld`;
    checks.push({ name, result: "FAIL", reason });
    failures.push(name);
    console.log(`${name}: FAIL ${reason}`);
  }
}
async function connect(engine) {
  ({ browser, context } = await createFrontendContext(engine, {
    production,
    local,
  }));
  context.on("response", async (response) => {
    const url = new URL(response.url());
    if (url.origin !== "https://api.homemind.vn") return;
    // No URLs with queries, resource IDs, bodies, tokens, customer fields or cookie values in evidence.
    const path = url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "{id}");
    traffic.push({
      path,
      method: response.request().method(),
      status: response.status(),
      at: Date.now(),
    });
    if (!url.pathname.includes("/auth/")) {
      try {
        const body = await response.json();
        if (response.status() === 200) responses.set(url.pathname, body);
      } catch {}
    }
  });
  page = await context.newPage();
}
async function settled(target = page) {
  await target
    .locator(".hm-main,.hm-login-form,.hm-guard")
    .first()
    .waitFor({ timeout: 30000 });
  if (authenticated)
    await target.locator(".hm-main").waitFor({ timeout: 30000 });
  await target.waitForFunction(
    () => !document.querySelector(".hm-main .hm-loading"),
    undefined,
    { timeout: 30000 },
  );
  await delay(700);
}
async function visit(path) {
  await page.goto(`https://homemind.vn${path}`, {
    waitUntil: "domcontentloaded",
  });
  await settled();
  await delay(800);
}
async function login() {
  await page.goto("https://homemind.vn/dang-nhap", {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByLabel("Email quản trị", { exact: true })
    .fill(credentials.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/bang-dieu-khien", { timeout: 30000 });
  authenticated = true;
  await settled();
}
async function visual(name) {
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await settled();
    if (authenticated)
      assert(
        (await page.locator(".hm-main .hm-error").count()) === 0,
        `${name}: expected live success/empty region, saw error`,
      );
    await delay(200);
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 2,
      controls: [
        ...document.querySelectorAll(
          ".hm-main .hm-button,.hm-main input,.hm-main select",
        ),
      ]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width && r.height)
        .every((r) => r.height >= 38),
    }));
    assert(!geometry.overflow, `${name}: page overflow at ${width}`);
    assert(geometry.controls, `${name}: small control at ${width}`);
    await page.screenshot({
      mask: [page.getByText(credentials.email, { exact: true })],
      path: join(evidence.directory, `${name}-${width}.png`),
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
async function tabs(names) {
  for (const name of names) {
    await page.getByRole("button", { name, exact: true }).click();
    await settled();
  }
}
async function logoutUI() {
  await page.getByRole("button", { name: "Menu tài khoản quản trị" }).click();
  await page.getByRole("menuitem", { name: "Đăng xuất", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await page.waitForURL("**/dang-nhap");
  await page.getByLabel("Email quản trị", { exact: true }).waitFor();
  authenticated = false;
}
try {
  await connect(chromium);
  await check("guard-unauthenticated-deep-link", async () => {
    await visit("/bang-dieu-khien/khach-hang");
    await page.waitForURL("**/dang-nhap");
    assert(
      (await page.locator(".hm-table").count()) === 0,
      "Protected table visible to guest",
    );
  });
  await check("login-blank-responsive", async () => {
    assert(
      (await page
        .getByLabel("Email quản trị", { exact: true })
        .inputValue()) === "",
      "Login prefilled",
    );
    await visual("login");
  });
  await check("primary-control-text-contrast", async () => {
    await assertPrimaryTextContrast(page);
  });
  await check("generic-invalid-login-no-auto-retry", async () => {
    const before = traffic.filter(
      (t) => t.path === "/v1/admin/auth/login" && t.method === "POST",
    ).length;
    await page
      .getByLabel("Email quản trị", { exact: true })
      .fill(credentials.email);
    await page
      .getByLabel("Mật khẩu", { exact: true })
      .fill("invalid-local-negative-password");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page
      .getByRole("alert")
      .getByText("Email hoặc mật khẩu không đúng.", { exact: true })
      .waitFor();
    await delay(1200);
    assert(
      traffic.filter(
        (t) => t.path === "/v1/admin/auth/login" && t.method === "POST",
      ).length ===
        before + 1,
      "Invalid login was automatically retried",
    );
    await page.getByLabel("Email quản trị", { exact: true }).fill("");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("");
  });
  await check("login-cookie-cors", async () => {
    const guestTab = await context.newPage();
    await guestTab.goto("https://homemind.vn/dang-nhap");
    await guestTab.getByLabel("Email quản trị", { exact: true }).waitFor();
    await login();
    await guestTab.waitForURL("**/bang-dieu-khien", { timeout: 30000 });
    await settled(guestTab);
    await guestTab.close();
    checks.push({
      name: "existing-guest-tab-restores-after-login",
      result: "PASS_LIVE",
    });
    const cookie = (await context.cookies("https://api.homemind.vn")).find(
      (c) => c.name === "__Host-homemind-admin",
    );
    assert(
      cookie?.httpOnly &&
        cookie.secure &&
        cookie.sameSite === "Strict" &&
        cookie.domain === "api.homemind.vn" &&
        cookie.path === "/",
      "Session cookie flags mismatch",
    );
    assert(
      !(await page.evaluate(() =>
        Object.keys(localStorage).some((k) => /admin|csrf|token/i.test(k)),
      )),
      "Persistent auth storage",
    );
  });
  if (!authenticated)
    throw Object.assign(new Error("Cannot continue authenticated acceptance"), {
      safe: true,
    });
  await check("dashboard-value-accuracy", async () => {
    const data = responses.get("/v1/admin/dashboard/overview")?.data;
    assert(data, "Missing actual overview response");
    assert(
      await page
        .locator(".hm-metric")
        .filter({ hasText: "Doanh số hoàn tất" })
        .innerText()
        .then((text) =>
          text.includes(
            BigInt(data.completedSales.amount).toLocaleString("vi-VN"),
          ),
        ),
      "Displayed financial amount differs",
    );
    assert(
      await page.getByText("Trạng thái hiện tại", { exact: true }).isVisible(),
      "Missing separate current scope",
    );
    await visual("dashboard");
  });
  await check("reload-and-authenticated-login-redirect", async () => {
    await page.reload();
    await settled();
    assert(
      await page.locator(".hm-sidebar").isVisible(),
      "Session reload lost",
    );
    await page.goto("https://homemind.vn/dang-nhap");
    await page.waitForURL("**/bang-dieu-khien");
    await settled();
  });
  await check("customers-pagination-and-menu-keyboard", async () => {
    await visit("/bang-dieu-khien/khach-hang");
    await visual("customers");
    const limit = page.getByLabel("Bản ghi / trang", { exact: true });
    await limit.fill("1");
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    await settled();
    const next = page.getByRole("button", { name: "Trang tiếp", exact: true });
    if (await next.isEnabled()) {
      await next.click();
      await settled();
      await page
        .getByRole("button", { name: "Trang trước", exact: true })
        .click();
      await settled();
    } else
      checks.push({
        name: "pagination-next-live-record",
        result: "BLOCKED",
        reason: "No second record in current dataset",
      });
    const menu = page.getByRole("button", { name: "Thao tác bản ghi 1" });
    if (await menu.count()) {
      await menu.focus();
      await page.keyboard.press("Enter");
      await page.getByRole("menu").waitFor();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Escape");
      assert(
        await menu.evaluate((el) => el === document.activeElement),
        "Menu focus not restored",
      );
      await page.setViewportSize({ width: 390, height: 1000 });
      await menu.click();
      await page.getByRole("menu").waitFor({ state: "visible" });
      const bounds = await page.getByRole("menu").boundingBox();
      if (
        !bounds ||
        bounds.x < 0 ||
        bounds.x + bounds.width > 392 ||
        bounds.y < 0 ||
        bounds.y + bounds.height > 1002
      )
        console.log(JSON.stringify({ check: "menu-geometry", bounds }));
      assert(
        bounds &&
          bounds.x >= 0 &&
          bounds.x + bounds.width <= 392 &&
          bounds.y >= 0 &&
          bounds.y + bounds.height <= 1002,
        "Menu collides with viewport",
      );
      await page.keyboard.press("Home");
      await page.keyboard.press("End");
      await page.keyboard.press("Escape");
      const opener = page.getByRole("button", {
        name: "Mở điều hướng quản trị",
      });
      await opener.click();
      await page.getByRole("dialog", { name: "Điều hướng quản trị" }).waitFor();
      await page.keyboard.press("Escape");
      await page
        .getByRole("dialog", { name: "Điều hướng quản trị" })
        .waitFor({ state: "hidden" });
      assert(
        await opener.evaluate((el) => el === document.activeElement),
        "Drawer focus not restored",
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  });
  const userId = responses.get("/v1/admin/users")?.data?.items?.[0]?.id;
  const workspaceId = responses.get("/v1/admin/workspaces")?.data?.items?.[0]
    ?.id;
  await check("customer-detail-tabs", async () => {
    assert(userId, "No live customer");
    await visit(`/bang-dieu-khien/khach-hang/${userId}`);
    await visual("customer-detail");
    if (!smoke)
      await tabs([
        "Không gian",
        "Chi tiêu",
        "Hoạt động",
        "Thanh toán",
        "Sử dụng AI",
        "Lượt xử lý AI",
        "Hồ sơ & chấp thuận",
      ]);
  });
  await check("workspace-directory", async () => {
    await visit("/bang-dieu-khien/khong-gian");
    await visual("workspaces");
  });
  const liveWorkspace =
    workspaceId || responses.get("/v1/admin/workspaces")?.data?.items?.[0]?.id;
  await check("workspace-detail-tabs", async () => {
    assert(liveWorkspace, "No live workspace");
    await visit(`/bang-dieu-khien/khong-gian/${liveWorkspace}`);
    await visual("workspace-detail");
    if (!smoke)
      await tabs([
        "Thông tin không gian",
        "Thành viên",
        "Tồn kho",
        "Danh sách mua",
        "Lịch sử quyền lợi",
        "Kỳ sử dụng",
        "Yêu cầu AI",
        "Gói & quota hiện tại",
      ]);
    await page.reload();
    await settled();
  });
  for (const [slug, name] of [
    ["thanh-toan", "payments"],
    ["goi-su-dung", "entitlements"],
    ["su-dung-ai", "usage"],
    ["thong-bao", "notifications"],
    ["van-hanh", "operations"],
    ["nhat-ky", "audit"],
    ["phien-dang-nhap", "sessions"],
  ]) {
    if (smoke && !["payments", "operations", "sessions"].includes(name))
      continue;
    await check(`${name}-template`, async () => {
      await visit(`/bang-dieu-khien/${slug}`);
      await visual(name);
      if (name === "usage" && !smoke)
        await tabs([
          "Kỳ lịch sử",
          "Yêu cầu & giữ chỗ",
          "Lượt xử lý",
          "Quota hiện tại",
        ]);
    });
  }
  if (!smoke)
    for (const [path, name] of [
      ["notifications", "notification"],
      ["audit-logs", "audit-log"],
      ["payments", "payment"],
    ]) {
      const id = responses.get(`/v1/admin/${path}`)?.data?.items?.[0]?.id;
      if (!id) {
        checks.push({
          name: `${name}-detail`,
          result: "BLOCKED",
          reason: "No live authorized record",
        });
        continue;
      }
      const slug =
        path === "notifications"
          ? "thong-bao"
          : path === "payments"
            ? "thanh-toan"
            : "nhat-ky";
      await check(`${name}-detail`, async () => {
        await visit(`/bang-dieu-khien/${slug}/${id}`);
        await visual(`${name}-detail`);
        if (path === "payments")
          await tabs([
            "Giao dịch xác minh",
            "Quyền lợi liên quan",
            "Thông tin đơn",
          ]);
      });
    }
  await check("logout-all-confirmation-cancel-only", async () => {
    await visit("/bang-dieu-khien/phien-dang-nhap");
    await page
      .getByRole("button", { name: "Đăng xuất tất cả phiên", exact: true })
      .click();
    assert(
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Hủy", exact: true })
        .evaluate((el) => el === document.activeElement),
      "Confirmation cancel not initially focused",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert(
      !traffic.some(
        (t) => t.path === "/v1/admin/auth/logout-all" && t.method === "POST",
      ),
      "Cancelled dialog submitted logout-all",
    );
  });
  await check("cross-tab-refresh-serialization", async () => {
    await visit("/bang-dieu-khien/phien-dang-nhap");
    const other = await context.newPage();
    await other.goto("https://homemind.vn/bang-dieu-khien/phien-dang-nhap");
    await settled(other);
    const before = traffic.filter(
      (t) => t.path === "/v1/admin/auth/refresh" && t.method === "POST",
    ).length;
    await Promise.all([
      page.getByRole("button", { name: "Làm mới phiên theo yêu cầu" }).click(),
      other.getByRole("button", { name: "Làm mới phiên theo yêu cầu" }).click(),
    ]);
    await delay(4000);
    const after = traffic.filter(
      (t) => t.path === "/v1/admin/auth/refresh" && t.method === "POST",
    ).length;
    assert(
      after - before === 1,
      "Simultaneous tabs performed more than one refresh mutation",
    );
    assert(
      await other.locator(".hm-main").isVisible(),
      "Second tab lost authorization",
    );
    await other.close();
  });
  await check("offline-error-no-success-fallback", async () => {
    await context.setOffline(true);
    await page.getByRole("button", { name: "Tải lại danh sách" }).click();
    await page.getByRole("alert").waitFor();
    assert(
      (await page.locator(".hm-panel table").count()) === 0,
      "Stale session table shown as current after offline failure",
    );
    await context.setOffline(false);
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await settled();
  });
  await check("logout-cache-clear-and-back", async () => {
    await context.setOffline(false);
    await logoutUI();
    await page.goBack();
    await settled();
    await page.waitForURL("**/dang-nhap");
    assert(
      (await page.locator(".hm-table").count()) === 0,
      "Protected data remains after logout",
    );
  });
  await context.close();
  await browser.close();
  responses.clear();
  await delay(2000);
  await connect(firefox);
  authenticated = false;
  await check("firefox-auth-deep-reload-logout", async () => {
    await login();
    await visit("/bang-dieu-khien/van-hanh");
    await page.reload();
    await settled();
    await visual("firefox-operations");
    await logoutUI();
  });
} catch (error) {
  failures.push("acceptance-environment");
  checks.push({
    name: "acceptance-environment",
    result: "FAIL",
    reason: error.safe
      ? error.message
      : "Private harness failed; details withheld",
  });
} finally {
  // Only revoke a session created by this harness; never logout-all unrelated owner sessions.
  if (authenticated && page && !page.isClosed())
    try {
      await context.setOffline(false);
      await page.evaluate(async () => {
        const origin = "https://api.homemind.vn/v1/admin";
        const csrf = await (
          await fetch(`${origin}/auth/csrf`, {
            credentials: "include",
            cache: "no-store",
          })
        ).json();
        await fetch(`${origin}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "X-HomeMind-Admin-CSRF": csrf.data.csrfToken },
        });
      });
    } catch {}
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  await evidence.save("results.json", {
    environment: production
      ? "production"
      : "approved-origin-candidate-with-real-production-api",
    buildId,
    checks,
    traffic,
    engines: ["chromium", "firefox"],
    screenshots: "private outside repository; do not upload",
  });
  console.log(`Private evidence directory: ${evidence.directory}`);
  console.log(
    `Acceptance: ${failures.length ? "FAIL" : "PASS_WITH_DOCUMENTED_DATA_LIMITS"}; ${checks.filter((c) => c.result === "PASS_LIVE").length} passed, ${failures.length} failed, ${checks.filter((c) => c.result === "BLOCKED").length} blocked`,
  );
  if (failures.length) process.exitCode = 1;
}
