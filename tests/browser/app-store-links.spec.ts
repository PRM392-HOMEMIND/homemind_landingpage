import { expect, test } from "./fixtures";

const store = "https://apps.apple.com/app/homemind/id6821934836";
const purpose = "Tải HomeMind trên App Store (mở trong tab mới)";

test("getting-started CTAs are safe App Store links with real navigation", async ({ page, context }, info) => {
  const writes: string[] = [];
  page.on("request", request => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.method());
  });
  // Verify browser navigation without contacting the external store in a test.
  await context.route("https://apps.apple.com/**", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>App Store navigation fixture</title>" }));
  await page.goto("/");
  for (const name of ["Dùng thử miễn phí", "Dùng thử miễn phí ngay", "Bắt đầu giữ lại tiền ngay", "Bắt đầu dùng thử miễn phí", "Bắt đầu miễn phí"]) {
    const link = name === "Dùng thử miễn phí"
      ? page.getByRole("banner").getByRole("link", { name, exact: true, includeHidden: true })
      : page.getByRole("link", { name, exact: true });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", store);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAccessibleDescription(purpose);
    await expect(link.locator("button")).toHaveCount(0);
    // Navbar CTA is intentionally hidden below sm; the drawer is tested below.
    if (name === "Dùng thử miễn phí" && (await page.viewportSize())!.width < 640) continue;
    const opened = context.waitForEvent("page");
    // Keep focus + Enter in one locator action: a late invitation can otherwise
    // take focus between separate focus() and page.keyboard.press() calls.
    if (name === "Dùng thử miễn phí ngay") await link.press("Enter");
    else await link.click();
    const tab = await opened;
    await expect(tab).toHaveURL(store);
    await expect(tab).toHaveTitle("App Store navigation fixture");
    expect(await tab.evaluate(() => window.opener === null)).toBe(true);
    await tab.close();
    expect(new URL(page.url()).pathname).toBe("/");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("home-app-store-links.png"), fullPage: true, animations: "disabled" });
  expect(writes).toEqual([]);
});

test("mobile trial link closes menu and preserves its cleanup", async ({ page, context }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.route("https://apps.apple.com/**", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>App Store navigation fixture</title>" }));
  await page.goto("/gioi-thieu");
  const overflow = await page.evaluate(() => document.body.style.overflow);
  const opener = page.getByRole("button", { name: "Mở menu điều hướng" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Menu HomeMind" });
  const link = menu.getByRole("link", { name: "Dùng thử miễn phí", exact: true });
  await expect(link).toHaveAttribute("href", store);
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(link).toHaveAccessibleDescription(purpose);
  await page.screenshot({ path: info.outputPath("mobile-app-store-link.png"), animations: "disabled" });
  const opened = context.waitForEvent("page");
  await link.click();
  const tab = await opened;
  await expect(tab).toHaveURL(store);
  await tab.close();
  await page.bringToFront();
  await expect(menu).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(overflow);
  await expect(page.locator("main h1")).toHaveText("Về HomeMind");
});
