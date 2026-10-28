import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { rewardPolicy } from "../../src/features/feedback/policy";
import { campaign } from "./contract-fixtures";

const name = "30 Ngày Đặc Quyền Premium";
const dialog = (page: Page) => page.getByRole("dialog", { name, exact: true });
const opener = (page: Page) => page.getByRole("button", { name: /30 Ngày Đặc Quyền Premium|Xem lượt gửi|Xem thông tin chương trình/ });
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, baseURL }, info) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  const origin = new URL(baseURL!).origin;
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text()); });
  page.on("response", response => { if (new URL(response.url()).origin === origin && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.route("https://api.homemind.vn/**", async route => {
    if (route.request().method() === "GET" && route.request().url() === "https://api.homemind.vn/v1/public/feedback-popup") await route.fulfill({ json: { ...campaign, enabled: false } });
    else { errors.push("Unexpected API request"); await route.abort(); }
  });
  if (info.project.name === "chromium" && process.env.FEEDBACK_BROWSER_COVERAGE === "1") {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
  }
});
test.afterEach(async ({ page }, info) => {
  if (info.project.name === "chromium" && process.env.FEEDBACK_BROWSER_COVERAGE === "1") {
    const entries = await page.coverage.stopJSCoverage();
    // Collect project chunks; the report mapper retains every popup source file.
    writeFileSync(info.outputPath("browser-coverage.json"), JSON.stringify(entries.filter(entry => entry.source?.includes("HomeMind Premium") || entry.source?.includes("Outcome unavailable") || entry.source?.includes("Submission rejected"))));
  }
  expect(runtimeErrors.get(page), "No new runtime/hydration/console/own-resource/API error").toEqual([]);
});
async function preview(page: Page, mode?: string) {
  await page.goto("/feedback-fixture", { waitUntil: "networkidle" });
  if (mode) {
    await page.getByLabel("Kịch bản mô phỏng").selectOption(mode);
    await page.getByRole("button", { name: "Tải config mô phỏng" }).click();
  }
}
async function open(page: Page) {
  await opener(page).click();
  await expect(dialog(page)).toBeVisible();
}
async function screenshot(page: Page, info: TestInfo, label: string) {
  await page.screenshot({ path: info.outputPath(`${label}.png`), animations: "disabled" });
}

test("disabled production config: direct/reload home makes only public config GET, no invitation/account/submit", async ({ page }) => {
  const requests: string[] = [], errors: string[] = [];
  page.on("request", request => { if (/\/v1\/|feedback|campaign/.test(request.url())) requests.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(dialog(page)).toBeHidden();
  await expect(opener(page)).toHaveCount(0);
  await page.reload({ waitUntil: "networkidle" });
  expect(requests).toEqual(["https://api.homemind.vn/v1/public/feedback-popup", "https://api.homemind.vn/v1/public/feedback-popup"]);
  expect(errors).toEqual([]);
});

test("keyboard open, named dialog, focus trap in both directions and return", async ({ page }) => {
  await preview(page);
  await opener(page).focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page).getByRole("heading", { name, exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  const close = dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  const submit = dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true });
  await expect(submit).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(opener(page)).toBeFocused();
});

test("backdrop retains draft; Unicode input and explicit close/reopen preserve it without auto popup", async ({ page }) => {
  await preview(page);
  await open(page);
  const input = page.getByLabel("Nội dung mô phỏng (không phải DTO)");
  const value = "Góp ý Tiếng Việt e\u0301 + dấu . <script>alert(1)</script> 👪";
  await input.fill(value);
  await page.mouse.click(2, 2);
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(opener(page)).toBeFocused();
  await page.waitForTimeout(100);
  await expect(dialog(page)).toBeHidden();
  await open(page);
  await expect(input).toHaveValue(value);
  await expect(page.getByTestId("fixture-draft-preview")).toHaveText(value);
  await expect(page.getByTestId("fixture-draft-preview").locator("script, img")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });
  await expect(dialog(page)).toBeHidden();
});

test("confirmed policy and privacy; no unsupported reward or subscription promise", async ({ page, context }) => {
  await preview(page);
  await open(page);
  await expect(dialog(page).getByText(rewardPolicy, { exact: true })).toBeVisible();
  const text = await dialog(page).innerText();
  expect(text).not.toMatch(/gửi mã|link đổi quà|không cần thẻ|tự gia hạn|kích hoạt ngay|quota|lượt AI/i);
  const link = dialog(page).getByRole("link", { name: /Chính sách bảo mật/ });
  await expect(link).toHaveAttribute("href", "/privacy-policy#gop-y-nhan-qua-premium");
  const newPage = context.waitForEvent("page");
  await link.click();
  const privacy = await newPage;
  await privacy.waitForLoadState("networkidle");
  await expect(privacy.getByRole("heading", { level: 1, name: "Chính sách bảo mật" })).toBeVisible();
  await privacy.close();
  await expect(dialog(page)).toBeVisible();
});

test("pending close/reopen, repeated Enter/double-click and late completion retain one operation", async ({ page }, info) => {
  await preview(page, "pending");
  await open(page);
  await page.getByLabel("Nội dung mô phỏng (không phải DTO)").fill("Lượt đầu");
  const cta = dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true });
  await cta.dblclick();
  await expect(dialog(page).getByRole("button", { name: "Đang gửi…" })).toBeDisabled();
  await expect(page.getByLabel("Nội dung mô phỏng (không phải DTO)")).toBeDisabled();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("fixture-calls")).toHaveText("1");
  await screenshot(page, info, "pending");
  await page.keyboard.press("Escape");
  await open(page);
  await expect(dialog(page).getByRole("button", { name: "Đang gửi…" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-receipt")));
  await open(page);
  await expect(dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true })).toBeVisible();
  await expect(dialog(page)).toContainText("không xác nhận quà đã được cấp");
  await screenshot(page, info, "submitted");
  await expect(page.getByTestId("fixture-calls")).toHaveText("1");
  await expect(page.getByLabel("Nội dung mô phỏng (không phải DTO)")).toHaveValue("Lượt đầu");
  await dialog(page).getByRole("button", { name: "Gửi lượt góp ý mới" }).click();
  await dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
  await expect(page.getByTestId("fixture-calls")).toHaveText("2");
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-receipt")));
  await expect(dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true })).toBeVisible();
});

for (const mode of ["rejected", "network", "timeout", "malformed-success"]) {
  test(`${mode} uses honest local copy, retains data and supports an intentional next operation`, async ({ page }, info) => {
    await preview(page, mode);
    await open(page);
    await page.getByLabel("Nội dung mô phỏng (không phải DTO)").fill("Giữ dữ liệu thử");
    await dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
    await expect(dialog(page).getByRole("alert")).toContainText(mode === "rejected" ? "Chưa gửi được" : "Hệ thống có thể đã nhận thông tin");
    await expect(page.getByLabel("Nội dung mô phỏng (không phải DTO)")).toHaveValue("Giữ dữ liệu thử");
    await expect(dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true })).toHaveCount(0);
    await expect(dialog(page).getByRole("button", { name: "Gửi lượt góp ý mới" })).toBeEnabled();
    await screenshot(page, info, mode);
    await page.keyboard.press("Escape");
    await page.getByLabel("Kịch bản mô phỏng").selectOption("normal");
    await open(page);
    await dialog(page).getByRole("button", { name: "Gửi lượt góp ý mới" }).click();
    await dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
    await expect(dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true })).toBeVisible();
    await expect(page.getByTestId("fixture-calls")).toHaveText("2");
  });
}

test("disabled/loading/malformed/error fixture config cannot invite or submit; manual recovery works", async ({ page }) => {
  for (const mode of ["disabled", "config-loading", "malformed-config", "config-error"]) {
    await preview(page, mode);
    await expect(opener(page)).toHaveCount(0);
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByTestId("fixture-calls")).toHaveText("0");
    await page.getByLabel("Kịch bản mô phỏng").selectOption("normal");
    await page.getByRole("button", { name: "Tải config mô phỏng" }).click();
    await open(page);
    await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toBeEnabled();
  }
});

for (const changedConfig of ["disabled", "config-error", "malformed-config"]) {
test(`campaign ${changedConfig} between open and submit stops the operation and preserves data for recovery`, async ({ page }) => {
  await preview(page);
  await open(page);
  await page.getByLabel("Nội dung mô phỏng (không phải DTO)").fill("Chưa gửi");
  await page.keyboard.press("Escape");
  await page.getByLabel("Kịch bản mô phỏng").selectOption(changedConfig);
  await open(page);
  await dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
  await expect(dialog(page).getByRole("alert")).toContainText(changedConfig === "disabled" ? "hiện không nhận thông tin" : "Chưa thể xác nhận chương trình");
  await expect(page.getByTestId("fixture-calls")).toHaveText("0");
  await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(opener(page)).toBeFocused();
  await page.getByLabel("Kịch bản mô phỏng").selectOption("normal");
  await open(page);
  await dialog(page).getByRole("button", { name: "Kiểm tra lại chương trình" }).click();
  await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Nội dung mô phỏng (không phải DTO)")).toHaveValue("Chưa gửi");
});
}

test("pending config recheck is announced, keeps data and can complete while closed", async ({ page }, info) => {
  await preview(page, "checking");
  await open(page);
  await page.getByLabel("Nội dung mô phỏng (không phải DTO)").fill("Đang kiểm tra");
  await dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
  await expect(dialog(page).getByRole("button", { name: "Đang kiểm tra chương trình…" })).toBeDisabled();
  await expect(dialog(page).locator('[role="status"]')).toContainText("Đang xử lý");
  await expect(page.getByTestId("fixture-calls")).toHaveText("0");
  await screenshot(page, info, "checking");
  await page.keyboard.press("Escape");
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-config")));
  await open(page);
  await expect(dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true })).toBeVisible();
  await expect(page.getByLabel("Nội dung mô phỏng (không phải DTO)")).toHaveValue("Đang kiểm tra");
});

test("presentation shell without a form/action slot still supports keyboard and close", async ({ page }) => {
  await preview(page, "no-actions");
  // This bare presentation fixture supplies its own trigger, independently
  // of the production FeedbackExperience marketing CTA.
  const shellOpener=page.getByRole("button",{name:"Góp ý và tìm hiểu quà Premium 30 ngày (fixture khung)",exact:true});
  await shellOpener.click();await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole("heading",{name,exact:true})).toBeFocused();
  await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toHaveCount(0);
  await page.keyboard.press("Shift+Tab");
  await expect(dialog(page).getByRole("link", { name: /Chính sách bảo mật/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(shellOpener).toBeFocused();
});

test("scroll lock restores styles/position after 10 cycles, unmount and navigation without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await preview(page, "long");
  await page.evaluate(() => { document.body.style.overflow = "auto"; document.documentElement.style.overflow = "clip"; window.scrollTo({ top: 400, behavior: "instant" }); });
  const initial = await page.evaluate(() => ({ top: scrollY, overflow: document.body.style.overflow, root: document.documentElement.style.overflow }));
  for (let index = 0; index < 10; index++) {
    await open(page);
    await expect(page.locator("body")).toHaveCSS("position", "fixed");
    await page.mouse.move(2, 2);
    await page.mouse.wheel(0, 500);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => ({ top: scrollY, overflow: document.body.style.overflow, root: document.documentElement.style.overflow }))).toEqual(initial);
  }
  await open(page);
  // Fixture unmount represents route cleanup; the real button is inert behind the dialog.
  await page.evaluate(() => (Array.from(document.querySelectorAll("button")).find(element => element.textContent === "Unmount mô phỏng")!).click());
  await expect(dialog(page)).toHaveCount(0);
  expect(await page.evaluate(() => ({ top: scrollY, overflow: document.body.style.overflow, root: document.documentElement.style.overflow }))).toEqual(initial);
  await page.goto("/privacy-policy", { waitUntil: "networkidle" });
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
  expect(errors).toEqual([]);
});

test("two tabs isolate draft and UI state without client reward tracking or PII storage", async ({ page, context }) => {
  const other = await context.newPage();
  for (const [target, value] of [[page, "tab một"], [other, "tab hai"]] as const) {
    await preview(target);
    await open(target);
    await target.getByLabel("Nội dung mô phỏng (không phải DTO)").fill(value);
  }
  await expect(page.getByLabel("Nội dung mô phỏng (không phải DTO)")).toHaveValue("tab một");
  await expect(other.getByLabel("Nội dung mô phỏng (không phải DTO)")).toHaveValue("tab hai");
  for (const target of [page, other]) {
    expect(await target.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie }))).toEqual({ local: 0, session: 0, cookie: "" });
    expect(target.url()).not.toMatch(/tab|fixtureText/);
  }
  await other.close();
});

for (const [width, height] of [[360, 800], [390, 844], [768, 900], [1280, 900], [1440, 900], [390, 320], [768, 390], [640, 450]]) {
  test(`responsive ${width}x${height}: close/actions visible, body scroll, no overflow`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await preview(page, "long");
    await open(page);
    expect(await dialog(page).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toBeInViewport();
    await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toBeInViewport();
    await screenshot(page, info, `popup-initial-${width}x${height}`);
    const content = dialog(page).locator('[data-lenis-prevent]').first();
    await content.hover();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toBeInViewport();
    await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toHaveCSS("transform", "none");
    await screenshot(page, info, `popup-${width}x${height}`);
    await page.keyboard.press("Escape");
  });
}

test("popup text/control contrast and focus indication meet AA for the implemented palette", async ({ page }) => {
  await preview(page);
  await open(page);
  const ratios = await dialog(page).evaluate(element => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
      const values = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(value => { const srgb = value / 255; return srgb <= .04045 ? srgb / 12.92 : ((srgb + .055) / 1.055) ** 2.4; });
      return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
    };
    return Array.from(element.querySelectorAll("h2, p, a, button")).map(node => {
      const style = getComputedStyle(node);
      let parent: Element | null = node;
      let background = "rgb(255,255,255)";
      while (parent) {
        const color = getComputedStyle(parent).backgroundColor;
        if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") { background = color; break; }
        parent = parent.parentElement;
      }
      const a = luminance(style.color), b = luminance(background);
      return { tag: node.tagName, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
    });
  });
  for (const value of ratios) expect(value.ratio, value.tag).toBeGreaterThanOrEqual(4.5);
  await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toBeFocused();
  await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toHaveCSS("outline-style", "solid");
});

test("visualViewport keyboard-like resize/offset keeps close/actions inside the usable viewport", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const viewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0 });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  });
  await preview(page, "long");
  await open(page);
  await page.evaluate(() => {
    Object.assign(window.visualViewport!, { height: 320, offsetTop: 20 });
    window.visualViewport!.dispatchEvent(new Event("resize"));
    window.visualViewport!.dispatchEvent(new Event("scroll"));
  });
  for (const label of ["Đóng cửa sổ góp ý", "Gửi góp ý & đăng ký trải nghiệm"]) {
    const box = (await dialog(page).getByRole("button", { name: label, exact: true }).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(20);
    expect(box.y + box.height).toBeLessThanOrEqual(340);
  }
  await screenshot(page, info, "visual-viewport-keyboard-simulation");
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.visualViewport!.dispatchEvent(new Event("resize")));
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
});

test("visualViewport fallback supports close/reopen and resize without runtime errors", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "visualViewport", { configurable: true, value: undefined }));
  await preview(page);
  await open(page);
  await page.setViewportSize({ width: 390, height: 320 });
  await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toBeInViewport();
  await page.keyboard.press("Escape");
  await open(page);
  await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toBeInViewport();
});

test("small mobile viewport preserves long Unicode draft through an uncertain outcome", async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 360 });
  await preview(page, "network");
  await open(page);
  const input = page.getByLabel("Nội dung mô phỏng (không phải DTO)");
  const value = "Tiếng Việt e\u0301 + <img src=x onerror=alert(1)> & ".repeat(30);
  await input.fill(value);
  await dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
  const alert = dialog(page).getByRole("alert");
  await expect(alert).toContainText("Hệ thống có thể đã nhận thông tin");
  await alert.scrollIntoViewIfNeeded();
  await expect(input).toHaveValue(value);
  await expect(page.getByTestId("fixture-draft-preview").locator("img, script")).toHaveCount(0);
  expect(await dialog(page).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toBeInViewport();
  await expect(dialog(page).getByRole("button", { name: "Gửi lượt góp ý mới" })).toBeInViewport();
  await screenshot(page, info, "mobile-long-draft-uncertain");
  await page.keyboard.press("Escape");
  await expect(opener(page)).toBeFocused();
});

test("unmount during pending operation restores the page and ignores its late fixture receipt", async ({ page }) => {
  await preview(page, "pending");
  await open(page);
  await dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
  await expect(dialog(page).getByRole("button", { name: "Đang gửi…" })).toBeDisabled();
  await expect(page.getByTestId("fixture-calls")).toHaveText("1");
  await page.evaluate(() => (Array.from(document.querySelectorAll("button")).find(element => element.textContent === "Unmount mô phỏng")!).click());
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await page.evaluate(() => document.dispatchEvent(new Event("fixture-receipt")));
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByTestId("fixture-calls")).toHaveText("1");
  await page.goto("/privacy-policy", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1, name: "Chính sách bảo mật" })).toBeVisible();
});

test("defensive fallback for a partial visualViewport object keeps the modal usable", async ({ page }) => {
  // Synthetic partial/polyfill object, not a claim about the native browser API.
  await page.addInitScript(() => Object.defineProperty(window, "visualViewport", { configurable: true, value: new EventTarget() }));
  await preview(page);
  await open(page);
  expect(await dialog(page).evaluate(element => element.style.getPropertyValue("--popup-viewport-top"))).toBe("0px");
  expect(await dialog(page).evaluate(element => element.style.getPropertyValue("--popup-viewport-bottom"))).toBe("0px");
  await page.setViewportSize({ width: 390, height: 320 });
  await expect(dialog(page).getByRole("button", { name: "Đóng cửa sổ góp ý" })).toBeInViewport();
  await expect(dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true })).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(opener(page)).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
});
