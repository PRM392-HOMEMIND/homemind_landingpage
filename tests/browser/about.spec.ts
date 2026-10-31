import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const team = [
  ["Vũ Minh Quang", "Trưởng nhóm · Phát triển sản phẩm"],
  ["Lê Phạm Hoài Bảo", "Phát triển sản phẩm"],
  ["Phạm Thị Ánh", "Phát triển sản phẩm"],
  ["Nguyễn Minh Thành", "Phát triển sản phẩm"],
  ["Trương Đinh Hồng Nhung", "Marketing"],
  ["Thái Hải Yến", "Marketing"],
];
const navigation = ["Giới thiệu", "Tính năng", "Thử Voice AI", "Tính Tiết Kiệm", "Bảng giá", "Hỏi đáp", "Chính sách", "Điều khoản"];
const features = ["Nhập giọng nói 3 giây", "Nhắc nhở hạn dùng thông minh", "Tự động lập danh sách đi chợ", "Chia sẻ tủ đồ Family", "Tra cứu từ xa tránh mua trùng", "Hỗ trợ Micro-POS Cửa hàng"];

function watch(page: Page, baseURL: string) {
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
  });
  page.on("response", response => {
    if (new URL(response.url()).origin === new URL(baseURL).origin && response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  return { errors, writes };
}

test("About direct load/reload, grounded content, SEO and no business side effects", async ({ page, request, baseURL }) => {
  const observed = watch(page, baseURL!);
  const apiRequests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).hostname === "api.homemind.vn") apiRequests.push(request.url()); });
  const response = await page.goto("/gioi-thieu");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Giới thiệu HomeMind | HomeMind");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://homemind.vn/gioi-thieu");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://homemind.vn/gioi-thieu");
  await expect(page.locator("main h1")).toHaveText("Về HomeMind");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Những việc nhỏ, bớt phải lo", "Các tính năng chính", "Đội ngũ phát triển HomeMind", "Bắt đầu cùng HomeMind"]);
  const featureRegion = page.getByRole("region", { name: "Các tính năng chính" });
  await expect(featureRegion.getByRole("heading", { level: 3 })).toHaveText(features);
  await expect(page.getByText(/Trường Đại học FPT, TP. Hồ Chí Minh/)).toBeVisible();
  await expect(page.locator("main form, main input, main textarea")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Thành viên HomeMind" }).locator("img, a, button")).toHaveCount(0);
  expect((await page.reload())?.status()).toBe(200);
  await expect(page.locator("main h1")).toHaveText("Về HomeMind");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://homemind.vn/gioi-thieu");
  expect(apiRequests).toEqual([]);
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});

for (const width of [320, 360, 390, 640, 768, 1024, 1280, 1440, 1920]) {
  test(`About team and page geometry at ${width}px`, async ({ page, baseURL }, info) => {
    const observed = watch(page, baseURL!);
    await page.setViewportSize({ width, height: width === 640 ? 450 : 900 });
    await page.goto("/gioi-thieu");
    await page.evaluate(() => document.fonts.ready);
    const members = page.getByRole("list", { name: "Thành viên HomeMind" });
    const cards = members.locator(":scope > li");
    await expect(cards).toHaveCount(6);
    await expect(cards.getByRole("heading", { level: 3 })).toHaveText(team.map(([name]) => name));
    for (let index = 0; index < team.length; index++) await expect(cards.nth(index).locator("p")).toHaveText(team[index][1]);
    const geometry = await cards.evaluateAll(elements => elements.map(element => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, width: bounds.width, overflow: element.scrollWidth > element.clientWidth };
    }));
    expect(geometry.every(card => !card.overflow && card.left >= 0 && card.right <= width)).toBe(true);
    if (width >= 768) {
      for (let index = 0; index < 6; index += 2) {
        expect(Math.abs(geometry[index].top - geometry[index + 1].top)).toBeLessThanOrEqual(1);
        expect(geometry[index].right).toBeLessThan(geometry[index + 1].left);
      }
      expect(geometry[2].top).toBeGreaterThanOrEqual(geometry[0].bottom);
      expect(geometry[4].top).toBeGreaterThanOrEqual(geometry[2].bottom);
    } else {
      for (let index = 1; index < 6; index++) {
        expect(Math.abs(geometry[index].left - geometry[0].left)).toBeLessThanOrEqual(1);
        expect(geometry[index].top).toBeGreaterThanOrEqual(geometry[index - 1].bottom);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width >= 1280) {
      const header = await page.getByRole("banner").evaluate(element => {
        const brand = element.querySelector("a")!.getBoundingClientRect();
        const links = Array.from(element.querySelectorAll("nav a"), link => link.getBoundingClientRect());
        const trial = element.querySelector('a[href="https://apps.apple.com/app/homemind/id6821934836"]')!.getBoundingClientRect();
        return { brandRight: brand.right, links: links.map(link => ({ left: link.left, right: link.right })), trialLeft: trial.left, trialRight: trial.right };
      });
      expect(header.brandRight).toBeLessThanOrEqual(header.links[0].left);
      expect(header.links.at(-1)!.right).toBeLessThanOrEqual(header.trialLeft);
      expect(header.trialRight).toBeLessThanOrEqual(width);
      for (let index = 1; index < header.links.length; index++) expect(header.links[index - 1].right).toBeLessThanOrEqual(header.links[index].left);
      await info.attach("header-geometry", { body: JSON.stringify(header, null, 2), contentType: "application/json" });
    }
    await info.attach("team-geometry", { body: JSON.stringify({ width, columns: width >= 768 ? 2 : 1, geometry }, null, 2), contentType: "application/json" });
    await info.attach("about-page", { body: await page.screenshot({ path: info.outputPath("about-page.png"), fullPage: true, animations: "disabled" }), contentType: "image/png" });
    await members.scrollIntoViewIfNeeded();
    await info.attach("about-team", { body: await members.screenshot({ path: info.outputPath("about-team.png"), animations: "disabled" }), contentType: "image/png" });
    expect(observed.errors).toEqual([]);
    expect(observed.writes).toEqual([]);
  });
}

test("About navigation order, active page and cross-page homepage section", async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/gioi-thieu");
    if (width < 1280) await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
    const nav = page.getByRole("navigation", { name: width < 1280 ? "Điều hướng di động" : "Điều hướng chính", exact: true });
    await expect(nav.getByRole("link")).toHaveText(navigation);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "Giới thiệu", exact: true })).toHaveAttribute("aria-current", "page");
    const featureLink = nav.getByRole("link", { name: "Tính năng", exact: true });
    await expect(featureLink).toHaveAttribute("href", "/#features");
    await featureLink.click();
    await expect(page).toHaveURL(/\/#features$/);
    await expect(page.locator("#features h2")).toBeInViewport();
    await expect(page.getByRole("dialog", { name: "Menu HomeMind" })).toHaveCount(0);
    if (width < 1280) await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
    await nav.getByRole("link", { name: "Giới thiệu", exact: true }).click();
    await expect(page).toHaveURL(/\/gioi-thieu$/);
    await expect(page.locator("main h1")).toBeInViewport();
  }
});

test("About CTA links explain existing account guidance, official App Store and support", async ({ page }) => {
  await page.goto("/gioi-thieu");
  const ctas = page.getByRole("region", { name: "Bắt đầu cùng HomeMind" });
  const register = ctas.getByRole("link", { name: "Đăng ký", exact: true });
  const contact = ctas.getByRole("link", { name: "Liên hệ", exact: true });
  const free = ctas.getByRole("link", { name: "Dùng thử miễn phí", exact: true });
  await expect(register).toHaveAttribute("href", "/terms-of-service#tai-khoan");
  await expect(register).toHaveAccessibleDescription("Xem hướng dẫn tài khoản; việc đăng ký được thực hiện trong ứng dụng.");
  await expect(contact).toHaveAttribute("href", "mailto:homemind.support@gmail.com");
  await expect(contact).toHaveAccessibleDescription("Gửi email hỗ trợ đến homemind.support@gmail.com.");
  await expect(free).toHaveAttribute("href", "https://apps.apple.com/app/homemind/id6821934836");
  await expect(free).toHaveAttribute("target", "_blank");
  await expect(free).toHaveAttribute("rel", "noopener noreferrer");
  await expect(free).toHaveAccessibleDescription("Mở trang HomeMind trên App Store trong tab mới; đăng ký và sử dụng trong ứng dụng.");
  await expect(ctas.getByText(/Phiên bản trên CH Play đang được phát triển/)).toBeVisible();
  await register.click();
  await expect(page).toHaveURL(/\/terms-of-service#tai-khoan$/);
  await expect(page.locator("#tai-khoan h2")).toBeInViewport();
  await page.reload();
  await expect(page.locator("#tai-khoan h2")).toBeInViewport();
  await page.goBack();
  await expect(page.locator("main h1")).toHaveText("Về HomeMind");
  await ctas.getByRole("link", { name: "xem thông tin gói Free trên trang chủ", exact: true }).click();
  await expect(page).toHaveURL(/\/#pricing$/);
  await expect(page.locator("#pricing h2")).toBeInViewport();
  await expect(page.locator("#pricing").getByRole("heading", { name: "Gói Free", exact: true })).toBeVisible();
});

test("About keyboard focus and mobile menu Escape/restore under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto("/gioi-thieu");
  const opener = page.getByRole("button", { name: "Mở menu điều hướng" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Menu HomeMind" });
  const close = menu.getByRole("button", { name: "Đóng menu điều hướng" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(menu.getByRole("link", { name: "HomeMind — Trang chủ" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(menu.getByRole("link", { name: "Dùng thử miễn phí", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "HomeMind — Trang chủ" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  for (const label of navigation) {
    await page.keyboard.press("Tab");
    await expect(menu.getByRole("link", { name: label, exact: true })).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("button", { name: "Đăng nhập", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "Dùng thử miễn phí", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "HomeMind — Trang chủ" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  const register = page.getByRole("region", { name: "Bắt đầu cùng HomeMind" }).getByRole("link", { name: "Đăng ký", exact: true });
  await page.keyboard.press("Tab");
  await register.focus();
  await expect(register).toBeFocused();
  await expect(register).toHaveCSS("outline-style", "solid");
  await expect(register).toHaveCSS("outline-width", "2px");
});

test("About menu skips inactive controls, recovers outside focus and leaves OS shortcuts alone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto("/gioi-thieu");
  const opener = page.getByRole("button", { name: "Mở menu điều hướng" });
  // Establish a keyboard opener: WebKit pointer clicks need not focus buttons,
  // while restoration deliberately preserves the element focused before open.
  await opener.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Menu HomeMind" });
  const brand = menu.getByRole("link", { name: "HomeMind — Trang chủ" });
  const close = menu.getByRole("button", { name: "Đóng menu điều hướng" });
  const trial = menu.getByRole("link", { name: "Dùng thử miễn phí", exact: true });
  // Exercise a dynamic disabled/hidden navigation state without changing routes
  // or relying on a browser's different native anchor-Tab preference.
  await menu.getByRole("navigation").evaluate(element => {
    const links = element.querySelectorAll("a");
    links[0].inert = true;
    links[1].hidden = true;
    links[2].tabIndex = -1;
    links[3].setAttribute("aria-disabled", "true");
    links[4].style.visibility = "hidden";
    links[5].style.display = "none";
  });
  await menu.getByRole("button", { name: "Đăng nhập", exact: true }).evaluate(element => { (element as HTMLButtonElement).disabled = true; });
  await close.focus();
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "Chính sách", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "Điều khoản", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(trial).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(brand).toBeFocused();
  for (const modifier of ["altKey", "ctrlKey", "metaKey"]) {
    expect(await menu.evaluate((element, key) => element.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", [key]: true, bubbles: true, cancelable: true })), modifier)).toBe(true);
    await expect(brand).toBeFocused();
  }
  await opener.focus();
  await page.keyboard.press("Tab");
  await expect(brand).toBeFocused();
  await opener.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(trial).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});
