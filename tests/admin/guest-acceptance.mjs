// CI-safe: no credential file is read, no login is attempted, no artifacts emitted.
import { chromium } from "@playwright/test";
import { createFrontendContext } from "./frontend-surface.mjs";
import { assertPrimaryTextContrast } from "./browser-contrast.mjs";
const production = process.argv.includes("--production");
const local = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3300";
const { browser, context } = await createFrontendContext(chromium, {
  production,
  local,
});
try {
  const page = await context.newPage();
  for (const path of ["/bang-dieu-khien", "/bang-dieu-khien/khach-hang"]) {
    const response = await page.goto(`https://homemind.vn${path}`);
    if (!response.headers()["cache-control"]?.includes("no-store"))
      throw new Error("Admin frontend missing no-store");
    await page.waitForURL("**/dang-nhap", { timeout: 30000 });
    await page.getByLabel("Email quản trị", { exact: true }).waitFor();
    if (
      (await page.locator(".hm-table").count()) ||
      (await page.getByLabel("Email quản trị", { exact: true }).inputValue())
    )
      throw new Error("Guest guard/private data boundary failed");
  }
  const contrast = await assertPrimaryTextContrast(page);
  console.log(`PASS_BROWSER: primary text contrast ${contrast.normalRatio.toFixed(2)}:1 normal, ${contrast.hoverRatio.toFixed(2)}:1 hover.`);
  for (const path of [
    "/docs/system-admin-bootstrap.json",
    "/system-admin-bootstrap.json",
    "/admin-storage-state.json",
    "/.admin-private/session.json",
  ]) {
    const response = await page.goto(`https://homemind.vn${path}`);
    if (response.status() !== 404)
      throw new Error("Sensitive-file HTTP boundary failed");
  }
  console.log(
    "PASS_LIVE: fresh guest deep-link redirects, blank login, no-store, private files404; real approved-origin API, no credentials.",
  );
} catch {
  console.log(
    "FAIL: guest browser gate (backend availability/CORS/route/header/private-file boundary); no sensitive details.",
  );
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
