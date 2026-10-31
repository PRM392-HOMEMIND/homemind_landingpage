import { type Page } from "@playwright/test";
import { expect, test, handleInvitations } from "./fixtures";
import { validCampaign } from "../../src/features/feedback/http-adapter";

const facebook = "https://www.facebook.com/profile.php?id=61593227567051";
const legalPages = [
  { path: "/privacy-policy", title: "Chính sách bảo mật", navLabel: "Chính sách" },
  { path: "/terms-of-service", title: "Điều khoản sử dụng", navLabel: "Điều khoản" },
];

function watchApplication(page: Page, origin: string) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
  });
  page.on("requestfailed", request => {
    if (request.failure()?.errorText === "net::ERR_ABORTED" && request.isNavigationRequest()) return;
    // Firefox cancels the previous document's favicon during route/reload.
    // A fresh favicon GET below still verifies that the deployed asset works.
    if (request.failure()?.errorText === "NS_BINDING_ABORTED" && new URL(request.url()).pathname === "/favicon.ico") return;
    if (new URL(request.url()).origin === origin) errors.push(`${request.url()} ${request.failure()?.errorText}`);
  });
  page.on("response", response => {
    if (new URL(response.url()).origin === origin && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

async function openNavigation(page: Page) {
  const desktop = page.getByRole("navigation", { name: "Điều hướng chính", exact: true });
  if (await desktop.isVisible()) return desktop;
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
  const mobile = page.getByRole("navigation", { name: "Điều hướng di động", exact: true });
  await expect(mobile).toBeVisible();
  return mobile;
}

test("brand colors, secure Facebook link, legal navigation and keyboard menu", async ({ page, baseURL }, info) => {
  const errors = watchApplication(page, new URL(baseURL!).origin);
  const tab = "Tab";
  const backTab = "Shift+Tab";
  await page.removeLocatorHandler(page.locator('dialog[data-feedback-dialog][open]'));
  const configRead = page.waitForResponse(response => response.request().method() === "GET" && response.url() === "https://api.homemind.vn/v1/public/feedback-popup");
  await page.goto("/", { waitUntil: "networkidle" });
  const response = await configRead;
  const config: unknown = await response.json().catch(() => undefined);
  if (response.ok() && validCampaign(config) && config.enabled) {
    // Network idle can precede React's showModal effect. Close the confirmed
    // initial invitation before inspecting the native inert background tree.
    await page.bringToFront();
    const invitation = page.locator("dialog[data-feedback-dialog][open]");
    await expect(invitation).toBeVisible();
    await invitation.getByRole("button", { name: "Đóng cửa sổ góp ý", exact: true }).click();
    await expect(invitation).toBeHidden();
  }
  await handleInvitations(page);
  // Browser CSS serialization can use Lab instead of RGB for Tailwind colors.
  const colors = await page.evaluate(() => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = "var(--color-slate-800)";
    const dark = getComputedStyle(probe).color;
    probe.style.color = "var(--color-primary-dark)";
    const green = getComputedStyle(probe).color;
    probe.remove();
    return { dark, green };
  });
  const brand = page.getByRole("banner").getByRole("link", { name: "HomeMind — Trang chủ" });
  const wordmark = brand.getByText("HomeMind", { exact: true });
  await expect(brand.getByText("Smart Pantry, Fresh Life", { exact: true })).toBeVisible();
  await expect(wordmark).toHaveCSS("color", colors.dark);
  // The invitation handler closes with a pointer click. Programmatic focus
  // then does not imply :focus-visible; enter keyboard modality explicitly.
  await page.keyboard.press(tab);
  await brand.focus();
  await expect(brand).toBeFocused();
  await expect(wordmark).toHaveCSS("color", colors.green);
  await expect(brand).toHaveCSS("outline-style", "solid");
  if (info.project.name === "desktop") {
    await brand.hover();
    await expect(wordmark).toHaveCSS("color", colors.green);
  }
  await page.mouse.move(0, 100);
  await brand.evaluate(element => (element as HTMLElement).blur());
  await expect(wordmark).toHaveCSS("color", colors.dark);

  if (info.project.name === "mobile") {
    const opener = page.getByRole("button", { name: "Mở menu điều hướng" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Menu HomeMind" });
    await expect(dialog).toBeVisible();
    await expect(opener).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.getByRole("button", { name: "Đóng menu điều hướng" })).toBeFocused();
    await dialog.getByRole("link", { name: "Dùng thử miễn phí" }).focus();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("link", { name: "HomeMind — Trang chủ" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("link", { name: "Dùng thử miễn phí" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  }

  for (const legal of legalPages) {
    const nav = await openNavigation(page);
    for (const label of ["Tính năng", "Thử Voice AI", "Tính Tiết Kiệm", "Bảng giá", "Hỏi đáp", ...legalPages.map(item => item.navLabel)]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await nav.getByRole("link", { name: legal.navLabel, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${legal.path}$`));
    await expect(page).toHaveTitle(`${legal.title} | HomeMind`);
    await expect(page.getByRole("heading", { level: 1, name: legal.title, exact: true })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://homemind.vn${legal.path}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /HomeMind/);
    await expect(page.locator("article").getByRole("link", { name: "homemind.support@gmail.com", exact: true }).first()).toHaveAttribute("href", "mailto:homemind.support@gmail.com");
    const refresh = await page.reload({ waitUntil: "networkidle" });
    expect(refresh?.status()).toBe(200);
    expect(await page.locator("article section").count()).toBeGreaterThanOrEqual(10);
    if (legal.path === "/privacy-policy") {
      await page.getByRole("navigation", { name: "Mục lục" }).getByRole("link", { name: /Yêu cầu xóa tài khoản/ }).click();
      await expect(page).toHaveURL(/\/privacy-policy#xoa-tai-khoan$/);
      await expect(page.locator("#xoa-tai-khoan h2")).toBeInViewport();
      await expect(page.locator(`#xoa-tai-khoan a[href="${facebook}"]`)).toHaveCount(1);
      await expect(page.locator('#xoa-tai-khoan a[href="mailto:homemind.support@gmail.com"]')).toHaveCount(1);
    }
    await page.getByRole("banner").getByRole("link", { name: "HomeMind — Trang chủ", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${new URL(baseURL!).origin.replaceAll(".", "\\.")}/$`));
  }

  // Home-page anchors also navigate home when clicked from a legal page.
  await page.goto("/privacy-policy", { waitUntil: "networkidle" });
  const nav = await openNavigation(page);
  await nav.getByRole("link", { name: "Tính năng", exact: true }).click();
  await expect(page).toHaveURL(/\/#features$/);
  await expect(page.locator("#features h2")).toBeInViewport();

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  const email = footer.getByRole("link", { name: "Gửi email hỗ trợ HomeMind", exact: true });
  await expect(email).toHaveAttribute("href", "mailto:homemind.support@gmail.com");
  await expect(email).toHaveAttribute("title", "homemind.support@gmail.com");
  await expect(email.locator("svg")).toHaveCount(1);
  await expect(footer.getByText("HomeMind", { exact: true })).toHaveCSS("color", colors.green);
  await expect(footer.getByText("Smart Pantry, Fresh Life", { exact: true })).toBeVisible();
  const social = footer.getByRole("link", { name: "HomeMind Facebook", exact: true });
  await expect(social).toHaveAttribute("href", facebook);
  await expect(social).toHaveAttribute("target", "_blank");
  await expect(social).toHaveAttribute("rel", "noopener noreferrer");
  await expect(social.locator("svg")).toHaveCSS("fill", "rgb(24, 119, 242)");
  const mark = social.locator("svg");
  const effects = await mark.evaluate(element => {
    const effects: { opacity: string; filter: string }[] = [];
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      effects.push({ opacity: style.opacity, filter: style.filter });
    }
    return effects;
  });
  expect(effects.every(effect => effect.opacity === "1" && effect.filter === "none")).toBe(true);
  const markBox = (await mark.boundingBox())!;
  const buttonBox = (await social.boundingBox())!;
  expect(markBox.width).toBe(16);
  expect(markBox.height).toBe(16);
  expect(Math.abs(markBox.x + 8 - buttonBox.x - buttonBox.width / 2)).toBeLessThan(1);
  expect(Math.abs(markBox.y + 8 - buttonBox.y - buttonBox.height / 2)).toBeLessThan(1);
  await expect(footer.locator('a[href*="github.com"], a[href*="twitter.com"], a[href*="x.com"]')).toHaveCount(0);
  await social.focus();
  await page.keyboard.press(tab);
  await page.keyboard.press(backTab);
  await expect(social).toBeFocused();
  await expect(social).toHaveCSS("outline-style", "solid");
  await expect(mark).toHaveCSS("fill", "rgb(24, 119, 242)");
  await page.keyboard.press(backTab);
  await expect(email).toBeFocused();
  await expect(email).toHaveCSS("outline-style", "solid");
  await page.keyboard.press(tab);
  if (info.project.name === "desktop") {
    await email.hover();
    await expect(email).toHaveCSS("border-color", colors.green);
    await social.hover();
    await expect(social).toHaveCSS("border-color", colors.green);
    await expect(social.locator("svg")).toHaveCSS("fill", "rgb(24, 119, 242)");
  }
  for (const legal of legalPages) {
    await expect(footer.getByRole("link", { name: legal.title, exact: true })).toHaveAttribute("href", legal.path);
  }
  const screenshot = await footer.screenshot({ path: info.outputPath("footer.png"), animations: "disabled" });
  await info.attach("footer", { body: screenshot, contentType: "image/png" });
  const icon = await page.request.get("/favicon.ico");
  expect(icon.status(), "Fresh favicon remains available after navigation").toBe(200);
  expect(errors, "No application, hydration or same-origin asset errors").toEqual([]);
});

test("short landscape menu scrolls independently and keeps all navigation usable", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Wheel behavior is exercised in the desktop browser.");
  await page.setViewportSize({ width: 768, height: 390 });
  await page.goto("/", { waitUntil: "networkidle" });
  await openNavigation(page);
  const dialog = page.getByRole("dialog", { name: "Menu HomeMind" });
  await expect(dialog).toHaveCSS("transform", "none");
  await dialog.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => dialog.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(dialog.getByRole("link", { name: "Dùng thử miễn phí" })).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await dialog.getByRole("link", { name: "Điều khoản", exact: true }).click();
  await expect(page).toHaveURL(/\/terms-of-service$/);
  await expect(dialog).toBeHidden();
});

for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
  for (const path of ["/", ...legalPages.map(item => item.path)]) {
    test(`responsive ${width}px ${path}`, async ({ page, baseURL }, info) => {
      test.skip(info.project.name !== "desktop", "Viewport matrix is exercised once; mobile interactions have their own project.");
      await page.setViewportSize({ width, height: 900 });
      const errors = watchApplication(page, new URL(baseURL!).origin);
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loaded");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "No horizontal overflow").toBe(true);
      const header = page.getByRole("banner");
      const brand = header.getByRole("link", { name: "HomeMind — Trang chủ" });
      const logo = header.getByRole("img", { name: "HomeMind logo" });
      await expect(logo).toBeVisible();
      const image = await logo.evaluate(element => {
        const image = element as HTMLImageElement;
        return { complete: image.complete, width: image.naturalWidth, height: image.naturalHeight };
      });
      expect(image.complete && image.width > 0 && image.width === image.height).toBe(true);
      const logoBox = (await logo.boundingBox())!;
      const brandBox = (await brand.boundingBox())!;
      const headerBox = (await header.boundingBox())!;
      expect(logoBox.width).toBe(36);
      expect(logoBox.height).toBe(36);
      expect(Math.abs(logoBox.y + logoBox.height / 2 - brandBox.y - brandBox.height / 2)).toBeLessThan(1);
      expect(headerBox.height).toBeLessThanOrEqual(80);
      const menu = width >= 1280 ? header.getByRole("navigation") : header.getByRole("button", { name: "Mở menu điều hướng" });
      await expect(menu).toBeVisible();
      const menuBox = (await menu.boundingBox())!;
      expect(brandBox.x + brandBox.width).toBeLessThan(menuBox.x);
      expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width);
      if (width >= 640) {
        const cta = header.getByRole("link", { name: "Dùng thử miễn phí" });
        await expect(cta).toBeVisible();
        const ctaBox = (await cta.boundingBox())!;
        expect(brandBox.x + brandBox.width).toBeLessThan(ctaBox.x);
        if (width >= 1280) expect(menuBox.x + menuBox.width).toBeLessThan(ctaBox.x);
        expect(ctaBox.x + ctaBox.width).toBeLessThanOrEqual(width);
        await expect(cta).toBeEnabled();
      }
      const legal = legalPages.find(item => item.path === path);
      if (legal) {
        const h1 = page.getByRole("heading", { level: 1, name: legal.title, exact: true });
        const eyebrow = page.getByText("THÔNG TIN PHÁP LÝ · HOMEMIND", { exact: true });
        const hero = h1.locator("..");
        expect(await hero.locator(":scope > :first-child").evaluate(element => element.tagName)).toBe("H1");
        await expect(page.getByRole("link", { name: "Về trang chủ HomeMind", exact: true })).toHaveCount(0);
        const version = page.getByRole("definition").filter({ hasText: "2026.10.28.1" });
        await expect(version).toBeVisible();
        await expect(page.locator('article time[datetime="2026-10-28"]')).toHaveCount(2);
        await expect(page.getByText("Ngày hiệu lực:", { exact: true })).toBeVisible();
        await expect(page.getByText("Cập nhật lần cuối:", { exact: true })).toBeVisible();
        await expect(h1).toHaveCSS("font-size", width >= 1024 ? "60px" : width >= 640 ? "48px" : "36px");
        await expect(h1).toHaveCSS("font-weight", "800");
        await expect(eyebrow).toHaveCSS("font-size", "12px");
        const titleBox = (await h1.boundingBox())!;
        const eyebrowBox = (await eyebrow.boundingBox())!;
        const introBox = (await hero.locator("p").last().boundingBox())!;
        expect(titleBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height);
        expect(eyebrowBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
        expect(introBox.y).toBeGreaterThan(eyebrowBox.y + eyebrowBox.height);
        expect(Math.abs(titleBox.x - brandBox.x), "Legal hero uses the homepage container gutters").toBeLessThan(1);
        expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(width);
        const titleLines = await h1.evaluate(element => {
          const text = element.firstChild!;
          const words = text.textContent!.matchAll(/\S+/g);
          const lines = new Map<number, number>();
          for (const word of words) {
            const range = document.createRange();
            range.setStart(text, word.index);
            range.setEnd(text, word.index + word[0].length);
            const top = Math.round(range.getBoundingClientRect().top);
            lines.set(top, (lines.get(top) ?? 0) + 1);
          }
          return [...lines.values()];
        });
        if (titleLines.length > 1) expect(titleLines.at(-1), "Wrapped H1 avoids a single orphan word").toBeGreaterThanOrEqual(2);
        expect(eyebrowBox.height, "Eyebrow remains on one readable line").toBeLessThan(20);
        const contents = page.getByRole("navigation", { name: "Mục lục", exact: true });
        const contentsBox = (await contents.boundingBox())!;
        expect(Math.abs(contentsBox.x - brandBox.x)).toBeLessThan(1);
        await expect(contents).toHaveCSS("border-radius", "24px");
        const columns = await contents.locator("ol").evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        expect(columns).toBe(width >= 768 ? 2 : 1);
        const readingWidth = await page.locator("article section").first().evaluate(element => element.getBoundingClientRect().width);
        expect(readingWidth).toBeLessThanOrEqual(768);
        const contentsLink = contents.getByRole("link").first();
        await contentsLink.focus();
        await expect(contentsLink).toHaveCSS("outline-style", "solid");
        await contentsLink.hover();
        await expect(contentsLink).toHaveCSS("text-decoration-line", "underline");
        await contentsLink.evaluate(element => (element as HTMLElement).blur());
        const navigation = await openNavigation(page);
        const active = navigation.getByRole("link", { name: legal.navLabel, exact: true });
        await expect(active).toHaveAttribute("href", legal.path);
        await expect(active).toHaveAttribute("aria-current", "page");
        await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
        const green = await active.evaluate(element => {
          const probe = document.createElement("span");
          probe.style.color = "var(--color-primary-dark)";
          element.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        });
        await expect(active).toHaveCSS("color", green);
        if (width < 1280) {
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog", { name: "Menu HomeMind" })).toBeHidden();
        }
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await expect(h1).toBeInViewport();
      }
      const screenshot = await page.screenshot({ path: info.outputPath("page.png"), animations: "disabled" });
      await info.attach(`viewport-${width}`, { body: screenshot, contentType: "image/png" });
      const footer = page.getByRole("contentinfo");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.getByRole("link", { name: "HomeMind Facebook" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const footerImage = await footer.screenshot({ path: info.outputPath("footer.png"), animations: "disabled" });
      await info.attach(`footer-${width}`, { body: footerImage, contentType: "image/png" });
      expect(errors).toEqual([]);
    });
  }
}
