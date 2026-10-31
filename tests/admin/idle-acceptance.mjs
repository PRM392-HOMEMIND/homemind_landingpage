import { chromium } from "@playwright/test";
import { readCredentials } from "./private-credentials.mjs";
import { privateEvidence } from "./private-evidence.mjs";
import { createFrontendContext } from "./frontend-surface.mjs";
const credentials = await readCredentials();
const evidence = await privateEvidence("homemind-admin-idle-");
const { browser, context } = await createFrontendContext(chromium);
const page = await context.newPage();
let reads = 0;
let loggedIn = false;
let result = "FAIL";
context.on("request", (request) => {
  if (
    request.url().startsWith("https://api.homemind.vn/v1/admin") &&
    request.method() === "GET"
  )
    reads++;
});
try {
  await page.goto("https://homemind.vn/dang-nhap");
  await page
    .getByLabel("Email quản trị", { exact: true })
    .fill(credentials.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/bang-dieu-khien");
  loggedIn = true;
  await page
    .locator(".hm-main .hm-loading")
    .first()
    .waitFor({ state: "hidden" });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const initial = reads;
  const started = Date.now();
  console.log(
    "Idle acceptance started: waiting 16 real minutes without HTTP keepalive.",
  );
  for (let minute = 1; minute <= 16; minute++) {
    await new Promise((resolve) => setTimeout(resolve, 60000));
    if (reads !== initial)
      throw new Error("Unexpected background read during idle window");
    if (minute % 4 === 0)
      console.log(`Idle observation: ${minute} minutes; no background reads.`);
  }
  if (
    new URL(page.url()).pathname !== "/dang-nhap" ||
    (await page.locator(".hm-table").count())
  )
    throw new Error("Guard did not clear expired data");
  const status = await page.evaluate(
    async () =>
      (
        await fetch("https://api.homemind.vn/v1/admin/auth/me", {
          credentials: "include",
          cache: "no-store",
        })
      ).status,
  );
  if (status !== 401)
    throw new Error("Real backend did not return idle-expired 401");
  loggedIn = false;
  result = "PASS_LIVE";
  await evidence.save("result.json", {
    result,
    elapsedSeconds: Math.floor((Date.now() - started) / 1000),
    noHeartbeat: true,
    guard: "redirect-and-memory-cleared",
    backendStatus: status,
  });
  console.log("Idle expiry: PASS_LIVE; local guard and actual backend 401.");
} catch {
  console.log("Idle expiry: FAIL; sensitive details withheld");
  process.exitCode = 1;
  await evidence.save("result.json", { result });
} finally {
  if (loggedIn)
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
  await context.close();
  await browser.close();
  console.log(`Private idle evidence: ${evidence.directory}`);
}
