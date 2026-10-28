import { expect, test } from "./fixtures";

test("production landing, navigation, simulator, FAQ and assets", async ({ page, request, baseURL }, info) => {
  const origin = new URL(baseURL!).origin;
  const errors: string[] = [];
  const externalFailures: string[] = [];
  const isOwn = (url: string) => url.startsWith(`${origin}/`);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource:")) errors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    // Navigation aborts when a menu closes are harmless; actual asset failures are not.
    if (req.failure()?.errorText === "net::ERR_ABORTED" && req.isNavigationRequest()) return;
    (isOwn(req.url()) ? errors : externalFailures).push(`${req.method()} ${req.url()} ${req.failure()?.errorText}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) (isOwn(res.url()) ? errors : externalFailures).push(`${res.status()} ${res.url()}`);
  });
  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/HomeMind/);
  await expect(page.locator("h1")).toBeVisible();
  for (const id of ["features", "simulator", "calculator", "pricing", "faq"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  const pricingHeading = page.locator("#pricing h2");
  await expect(pricingHeading).not.toBeInViewport();
  if (info.project.name === "mobile") await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
  const nav = page.getByRole("navigation", { name: info.project.name === "mobile" ? "Điều hướng di động" : "Điều hướng chính", exact: true });
  await nav.getByRole("link", { name: "Bảng giá", exact: true }).click();
  // Lenis anchors scroll without changing the hash; dynamic section heights can
  // alter the exact offset. Verify the destination is actually on screen.
  await expect(pricingHeading).toBeInViewport();
  if (info.project.name === "mobile") await expect(nav).toBeHidden();
  await page.locator("#simulator").getByRole("button", { name: /Vừa dùng hết/ }).click();
  await expect(page.getByText("Chuyển vào Danh Sách Cần Mua", { exact: true })).toBeVisible();
  const faq = page.locator("#faq button").first();
  await faq.click();
  await expect(page.locator("#faq").getByText(/AI của chúng tôi được tối ưu hóa/)).toBeVisible();
  for (const path of ["/healthz", "/robots.txt", "/sitemap.xml", "/favicon.ico", "/temp.png", "/googleeb07a4ac9bf011d2.html"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
  const health = await (await request.get("/healthz")).json();
  if (process.env.EXPECTED_RELEASE) expect(health.release).toBe(process.env.EXPECTED_RELEASE);
  expect(await page.locator('link[rel="stylesheet"]').count()).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loaded");
  const insecure = await page.locator('[src^="http://"], link[href^="http://"]').count();
  expect(insecure).toBe(0);
  if (externalFailures.length) {
    await info.attach("external-provider-failures", { body: JSON.stringify(externalFailures, null, 2), contentType: "application/json" });
  }
  expect(errors, "Application or same-origin asset errors").toEqual([]);
});
