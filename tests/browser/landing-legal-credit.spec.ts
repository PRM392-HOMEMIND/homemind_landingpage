import { expect, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

async function focusByKeyboard(page: Page, target: Locator) {
  // Closing the real invitation uses pointer input. Programmatic focus alone
  // must not be mistaken for keyboard :focus-visible in that input modality.
  await target.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(target).toBeFocused();
}

test("Credit remains one-time across subscription periods and checkout stays unavailable", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", request => {
    if (!["GET", "HEAD"].includes(request.method())) mutations.push(request.method() + " " + new URL(request.url()).pathname);
  });
  expect((await page.goto("/", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const pricing = page.locator("#pricing");
  await pricing.scrollIntoViewIfNeeded();
  for (const name of ["Gói Free", "Gói Premium", "Gói Family", "Credit", "Gói Micro-POS Tạp Hóa"])
    await expect(pricing.getByRole("heading", { name, exact: true })).toHaveCount(1);
  await expect(pricing.locator('[data-offer="CREDIT"]')).toHaveCount(1);
  const credit = pricing.locator('[data-offer="CREDIT"]');
  const free = pricing.locator('[data-offer="FREE"]');
  const family = pricing.locator('[data-offer="SUBSCRIPTION"]').filter({ has: page.getByRole("heading", { name: "Gói Family", exact: true }) });
  const monthlyFree = await free.innerText();
  await expect(free).toContainText("0đ");
  const monthlyCredit = await credit.innerText();
  await expect(credit).toContainText("50.000đ");
  await expect(credit).toContainText("/ 100 Credit");
  await expect(credit).toContainText("Giá tham khảo");
  await expect(credit).toContainText("tài khoản cá nhân");
  await expect(credit).toContainText("Không tự gia hạn");
  await expect(credit).toContainText("không hết hạn theo gói");
  for (const price of ["29.000đ", "59.000đ", "149.000đ"])
    await expect(pricing.getByText(price, { exact: true })).toHaveCount(1);
  await expect(family.getByText("59.000đ", { exact: true })).toBeVisible();
  await expect(pricing.getByText(/20%|23\.200|47\.200|119\.000/)).toHaveCount(0);
  const period = pricing.getByRole("switch", { name: "Xem gói năm" });
  await focusByKeyboard(page, period);
  await expect(period).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Space");
  await expect(period).toHaveAttribute("aria-checked", "true");
  expect(await credit.innerText()).toBe(monthlyCredit);
  for (const price of ["299.000đ", "599.000đ", "1.499.000đ"])
    await expect(pricing.getByText(price, { exact: true })).toHaveCount(1);
  await expect(family.getByText("599.000đ", { exact: true })).toBeVisible();
  await expect(pricing.getByText("/ năm", { exact: true })).toHaveCount(3);
  await expect(pricing.getByText("Chưa công bố", { exact: true })).toHaveCount(0);
  expect(await free.innerText()).toBe(monthlyFree);
  for (const button of await pricing.getByRole("button", { name: "Chưa mở mua", exact: true }).all())
    await expect(button).toBeDisabled();
  await expect(credit.getByText(/\/ tháng|\/ năm|Tự động gia hạn/)).toHaveCount(0);
  await period.click();
  await expect(period).toHaveAttribute("aria-checked", "false");
  expect(await credit.innerText()).toBe(monthlyCredit);
  expect(await free.innerText()).toBe(monthlyFree);
  for (const price of ["29.000đ", "59.000đ", "149.000đ"])
    await expect(pricing.getByText(price, { exact: true })).toHaveCount(1);
  await expect(family.getByText("59.000đ", { exact: true })).toBeVisible();
  await period.click();
  await expect(period).toHaveAttribute("aria-checked", "true");
  await expect(family.getByText("599.000đ", { exact: true })).toBeVisible();
  for (const price of ["299.000đ", "1.499.000đ"])
    await expect(pricing.getByText(price, { exact: true })).toHaveCount(1);
  expect(await credit.innerText()).toBe(monthlyCredit);
  await period.click();
  await expect(period).toHaveAttribute("aria-checked", "false");
  await expect(family.getByText("59.000đ", { exact: true })).toBeVisible();
  const paid = pricing.getByRole("button", { name: "Chưa mở mua", exact: true });
  await expect(paid).toHaveCount(4);
  for (const button of await paid.all()) await expect(button).toBeDisabled();
  await expect(pricing.locator("#pricing-availability")).toContainText("giá thực tế được cửa hàng ứng dụng hiển thị");
  await expect(pricing.locator("#pricing-availability")).toContainText("không phải báo giá Apple/Google");
  await expect(credit.getByRole("link", { name: "Điều kiện Credit" })).toHaveAttribute("href", "/terms-of-service#credit");
  await expect(credit.getByRole("link", { name: "Dữ liệu giao dịch" })).toHaveAttribute("href", "/privacy-policy#thanh-toan");
  await expect(pricing.locator('a[href*="payos"],a[href*="checkout"],form')).toHaveCount(0);
  expect(mutations).toEqual([]);
});

test("Privacy discloses actual processors, purchase metadata and account-deletion limits", async ({ page }) => {
  expect((await page.goto("/privacy-policy", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const article = page.locator("article");
  for (const text of ["Apple/Google", "Infobip", "Google Gemini", "Credit", "giữ chỗ", "Cookie", "chưa đồng nghĩa", "không tự hủy gia hạn"])
    await expect(article).toContainText(text);
  await expect(article.getByText("Xác thực OTP dự kiến", { exact: true })).toHaveCount(0);
  await expect(article.getByText("PayOS và dữ liệu thanh toán", { exact: true })).toHaveCount(0);
  const deletion = article.locator("#xoa-tai-khoan");
  await expect(deletion).toContainText("không cần cài lại ứng dụng");
  await expect(deletion).toContainText("chưa đồng nghĩa toàn bộ hồ sơ");
  await expect(deletion.locator('a[href="mailto:homemind.support@gmail.com"]')).toHaveCount(1);
  await expect(deletion).toContainText("không phải điều kiện buộc phải hủy trước");
  await expect(article.getByRole("navigation", { name: "Mục lục" }).getByRole("link", { name: /Yêu cầu xóa tài khoản/ })).toHaveAttribute("href", "#xoa-tai-khoan");
});

test("Terms distinguish subscription, one-time Credit, Store remedies and receipt processing", async ({ page }) => {
  expect((await page.goto("/terms-of-service", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const article = page.locator("article");
  for (const text of ["100 Credit", "mua một lần", "không tự gia hạn", "không có thời hạn hết hạn", "tài khoản cá nhân", "chưa được mở", "không loại trừ quyền hoàn tiền theo luật"])
    await expect(article).toContainText(text);
  await expect(article.locator("#credit")).toContainText("hạn mức định kỳ đủ điều kiện được dùng trước");
  await expect(article.locator("#credit")).toContainText("không chuyển sang tài khoản khác");
  await expect(article.locator("#trang-thai-thanh-toan")).toContainText("chưa phải xác nhận quyền lợi đã được cấp");
  for (const url of ["https://apps.apple.com/account/subscriptions/", "https://play.google.com/store/account/subscriptions", "https://reportaproblem.apple.com/", "https://support.google.com/googleplay/answer/2479637?hl=vi"])
    await expect(article.locator(`a[href="${url}"]`)).toHaveCount(1);
  await expect(article.locator("#cham-dut")).toContainText("không cần hủy gia hạn trước");
  const plans = article.locator("#goi-dich-vu");
  for (const value of ["29.000đ/tháng", "59.000đ/tháng", "149.000đ/tháng", "299.000đ/năm", "599.000đ/năm", "1.499.000đ/năm"])
    await expect(plans).toContainText(value);
  await expect(plans).toContainText("chưa phải giá Store được xác nhận");
  await expect(plans).not.toContainText("Giá năm chưa được công bố");
  await expect(article.locator("#han-muc-tro-ly")).toContainText("gói năm không có nghĩa toàn bộ hạn mức được cấp một lần cho cả năm");
  await expect(article.getByText(/không hoàn tiền trong mọi trường hợp|đã được Apple phê duyệt|đã được Google phê duyệt/)).toHaveCount(0);
});

for (const scenario of [
  { width: 1440, textScale: 1 },
  { width: 390, textScale: 1 },
  { width: 320, textScale: 1 },
  { width: 390, textScale: 2 },
  { width: 320, textScale: 2 },
]) {
  test(`annual pricing-only render ${scenario.width}px text${scenario.textScale}`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Focused responsive rendering once; interaction also runs on mobile.");
    await page.setViewportSize({ width: scenario.width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const pricing = page.locator("#pricing");
    if (scenario.textScale === 2) {
      await pricing.evaluate(root => {
        const elements = [...root.querySelectorAll<HTMLElement>("h2,h3,p,li,span,a,button")];
        const sizes = elements.map(el => parseFloat(getComputedStyle(el).fontSize));
        elements.forEach((el, i) => { el.style.fontSize = `${sizes[i] * 2}px`; el.style.lineHeight = "1.5"; });
      });
    }
    for (const yearly of [false, true]) {
      if (yearly) await pricing.getByRole("switch", { name: "Xem gói năm" }).click();
      for (const [index, amount] of (yearly ? ["299.000đ", "599.000đ"] : ["29.000đ", "59.000đ"]).entries()) {
        const card = pricing.locator('[data-offer="SUBSCRIPTION"]').nth(index);
        await expect(card.getByText(amount, { exact: true })).toBeVisible();
        await expect(card.getByText(yearly ? "/ năm" : "/ tháng", { exact: true })).toBeVisible();
        const cardBox = (await card.boundingBox())!;
        const priceBox = (await card.getByText(amount, { exact: true }).boundingBox())!;
        expect(priceBox.x).toBeGreaterThanOrEqual(cardBox.x);
        expect(priceBox.x + priceBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
      }
      const micro = pricing.getByRole("heading", { name: "Gói Micro-POS Tạp Hóa", exact: true }).locator("xpath=../..");
      const microPrice = micro.getByText(yearly ? "1.499.000đ" : "149.000đ", { exact: true });
      await expect(microPrice).toBeVisible();
      const microBox = (await micro.boundingBox())!;
      const microPriceBox = (await microPrice.boundingBox())!;
      expect(microPriceBox.x).toBeGreaterThanOrEqual(microBox.x);
      expect(microPriceBox.x + microPriceBox.width).toBeLessThanOrEqual(microBox.x + microBox.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await pricing.screenshot({ path: info.outputPath(`pricing-${yearly ? "annual" : "monthly"}.png`), animations: "disabled" });
      if (yearly && scenario.textScale === 2) {
        await pricing.locator('[data-offer="SUBSCRIPTION"]').first().screenshot({ path: info.outputPath("premium-annual-text200.png"), animations: "disabled" });
        await micro.screenshot({ path: info.outputPath("micro-annual-text200.png"), animations: "disabled" });
      }
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390, 320]) {
  test(`legal/pricing visual and semantic matrix ${width}px`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Run viewport matrix once; interaction tests also run mobile.");
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const route of ["/", "/privacy-policy", "/terms-of-service"]) {
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://homemind.vn${route === "/" ? "" : route}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /HomeMind/);
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const footer = page.getByRole("contentinfo");
      for (const legal of ["/privacy-policy", "/terms-of-service"])
        await expect(footer.locator(`a[href="${legal}"]`)).toHaveCount(1);
      if (route === "/") {
        const pricing = page.locator("#pricing"); await pricing.scrollIntoViewIfNeeded();
        await pricing.screenshot({ path: info.outputPath("pricing.png"), animations: "disabled" });
        const credit = pricing.locator('[data-offer="CREDIT"]');
        await focusByKeyboard(page, credit.getByRole("link", { name: "Điều kiện Credit" }));
        await expect(credit.getByRole("link", { name: "Điều kiện Credit" })).toHaveCSS("outline-style", "solid");
      } else {
        await expect(page.locator('article time[datetime="2026-10-28"]')).toHaveCount(2);
        for (const anchor of await page.locator('nav[aria-label="Mục lục"] a').evaluateAll(links => links.map(link => link.getAttribute("href"))))
          await expect(page.locator(anchor!)).toHaveCount(1);
        await page.screenshot({ path: info.outputPath(route.slice(1) + ".png"), animations: "disabled" });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("200% text and dark preference preserve readable legal/pricing layout", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Run accessibility matrix once.");
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const route of ["/", "/privacy-policy", "/terms-of-service"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    // Double actual text sizes without changing non-text geometry or shared CSS.
    await page.evaluate(() => {
      const root = document.querySelector(location.pathname === "/" ? "#pricing" : "article")!;
      const elements = [...root.querySelectorAll<HTMLElement>("h1,h2,h3,p,li,span,a,button,dt,dd")];
      const sizes = elements.map(el => parseFloat(getComputedStyle(el).fontSize));
      elements.forEach((el, i) => { el.style.fontSize = `${sizes[i] * 2}px`; el.style.lineHeight = "1.5"; });
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (route === "/") {
      const credit = page.locator('[data-offer="CREDIT"]');
      const box = (await credit.boundingBox())!;
      const price = (await credit.getByText("50.000đ", { exact: true }).boundingBox())!;
      expect(price.x).toBeGreaterThanOrEqual(box.x);
      expect(price.x + price.width).toBeLessThanOrEqual(box.x + box.width);
    }
    const target = page.locator(route === "/" ? "#pricing" : "article");
    await target.screenshot({ path: info.outputPath((route === "/" ? "pricing" : route.slice(1)) + "-text200-dark.png"), animations: "disabled" });
  }
});
