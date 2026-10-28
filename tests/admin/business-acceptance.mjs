import { chromium } from "@playwright/test";
import { readCredentials } from "./private-credentials.mjs";
import { createFrontendContext } from "./frontend-surface.mjs";
import { privateEvidence } from "./private-evidence.mjs";
const credential = await readCredentials();
const evidence = await privateEvidence("homemind-admin-business-");
const { browser, context } = await createFrontendContext(chromium, {
  local: process.env.ADMIN_CANDIDATE_URL || "http://127.0.0.1:3301",
});
const page = await context.newPage();
const data = new Map();
const checks = [];
let unsafeBusiness = false;
let stage = "login";
context.on("request", (request) => {
  const url = new URL(request.url());
  if (
    url.origin === "https://api.homemind.vn" &&
    ((!url.pathname.includes("/auth/") && request.method() !== "GET") ||
      (request.method() === "GET" && request.postData()))
  )
    unsafeBusiness = true;
});
context.on("response", async (response) => {
  const url = new URL(response.url());
  if (
    url.origin === "https://api.homemind.vn" &&
    !url.pathname.includes("/auth/") &&
    response.status() === 200
  )
    try {
      data.set(url.pathname, await response.json());
    } catch {}
});
async function settled() {
  await page.locator(".hm-main").waitFor();
  await page.waitForFunction(
    () => !document.querySelector(".hm-main .hm-loading"),
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (await page.locator(".hm-error").count())
    throw new Error("Expected actual success");
}
function assert(condition) {
  if (!condition)
    throw new Error("Business presentation differs from actual response");
}
async function metric(label, value) {
  const text = await page
    .locator(".hm-metric")
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator("strong")
    .innerText();
  assert(text === value.toLocaleString("vi-VN"));
}
try {
  await page.goto("https://homemind.vn/dang-nhap");
  await page
    .getByLabel("Email quản trị", { exact: true })
    .fill(credential.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credential.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/bang-dieu-khien");
  await settled();
  stage = "initial-plan-response";
  const planSnapshot = data.get("/v1/admin/dashboard/plan-distribution").meta
    .asOf;
  for (const scope of ["REAL", "SIMULATED_TEST"]) {
    stage = "scope-select";
    await page
      .locator(".hm-filter-grid label")
      .filter({ has: page.getByText("Phân loại nguồn", { exact: true }) })
      .locator("select")
      .selectOption(scope);
    stage = "scope-apply";
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    await settled();
    stage = "response-scope";
    const current = data.get("/v1/admin/dashboard/overview").data;
    assert(current.provenance === scope);
    stage = "customer-count";
    await metric("Khách hàng trong phạm vi", current.customers.total);
    stage = "workspace-count";
    await metric("Không gian trong phạm vi", current.workspaces.total);
    stage = "allRecords";
    assert(
      await page
        .locator(".hm-provenance")
        .innerText()
        .then((text) =>
          text.includes(
            `${current.customers.allRecords.toLocaleString("vi-VN")} khách hàng`,
          ),
        ),
    );
    stage = "unfiltered-plan";
    assert(
      data.get("/v1/admin/dashboard/plan-distribution").meta.asOf ===
        planSnapshot,
    );
    const trends = data.get("/v1/admin/dashboard/trends").data.items;
    stage = "chart-count";
    assert((await page.locator(".hm-chart circle").count()) === trends.length);
    stage = "chart-values";
    assert(
      await page
        .locator(".hm-chart circle title")
        .allTextContents()
        .then((values) =>
          values.every((value, index) =>
            value.includes(
              BigInt(trends[index].completedSales.amount).toLocaleString(
                "vi-VN",
              ),
            ),
          ),
        ),
    );
    checks.push({
      name: `provenance-${scope}-counts-allRecords-independent-plan-chart`,
      result: "PASS_LIVE",
    });
  }
  stage = "workspace-record";
  await page.goto("https://homemind.vn/bang-dieu-khien/khong-gian");
  await settled();
  const workspace = data.get("/v1/admin/workspaces").data.items[0];
  assert(workspace);
  await page.goto(
    `https://homemind.vn/bang-dieu-khien/khong-gian/${workspace.id}`,
  );
  await settled();
  const current = data.get("/v1/admin/usage/current").data;
  stage = "quota-value";
  const remaining = page
    .getByText("Lượt còn lại", { exact: true })
    .locator("..")
    .locator("dd");
  assert(
    (await remaining.innerText()) ===
      current.quota.remaining.toLocaleString("vi-VN"),
  );
  if (current.archivedAt === null)
    assert(await page.getByText("Chưa lưu trữ", { exact: true }).isVisible());
  if (current.quota.projectionOnly)
    assert(await page.getByText(/Kỳ được dự kiến/).isVisible());
  checks.push({
    name: "shared-workspace-quota-projection-and-null-archive",
    result: "PASS_LIVE",
  });
  assert(!unsafeBusiness);
  checks.push({
    name: "outgoing-business-read-only-and-no-get-body",
    result: "PASS_LIVE",
  });
  console.log(
    "Business UI: 4 PASS_LIVE; scoped counts/allRecords, independent plan snapshot, real chart points, workspace quota/null, outgoing read-only.",
  );
} catch {
  checks.push({ name: "business-accuracy", result: "FAIL", stage });
  console.log(`Business UI: FAIL at ${stage}; private values withheld`);
  process.exitCode = 1;
} finally {
  try {
    await page.evaluate(async () => {
      const root = "https://api.homemind.vn/v1/admin/auth";
      const csrf = await (
        await fetch(`${root}/csrf`, {
          credentials: "include",
          cache: "no-store",
        })
      ).json();
      await fetch(`${root}/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "X-HomeMind-Admin-CSRF": csrf.data.csrfToken },
      });
    });
  } catch {}
  data.clear();
  await context.close();
  await browser.close();
  await evidence.save("results.json", { checks });
  console.log(`Private business evidence: ${evidence.directory}`);
}
