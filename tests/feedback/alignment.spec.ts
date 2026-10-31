import { test, expect, type Page } from "@playwright/test";
import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { campaign } from "./contract-fixtures";

const API = "https://api.homemind.vn/v1/public/feedback-popup";
const popup = (page: Page) => page.locator("dialog[data-feedback-dialog][open]");
const panel = (page: Page) => popup(page).locator("fieldset").locator("..");
const footer = (page: Page) => popup(page).locator("footer");
const content = (page: Page) => popup(page).locator("header").locator("..");
const failures = new WeakMap<Page, { errors: string[]; posts: number }>();
async function fixture(page: Page) {
  const state = { errors: [] as string[], posts: 0 }; failures.set(page, state);
  page.on("pageerror", e => state.errors.push(e.message));
  await page.route("https://api.homemind.vn/**", async route => {
    const request = route.request();
    if (request.method() === "POST") state.posts++;
    if (request.url() === API && request.method() === "GET") await route.fulfill({ json: campaign });
    else await route.abort();
  });
}
test.beforeEach(async ({ page }) => { await fixture(page); });
test.afterEach(async ({ page }) => {
  expect(failures.get(page)!.errors, "No modal/runtime errors").toEqual([]);
  expect(failures.get(page)!.posts, "No automatic or invalid submission POST").toBe(0);
});

async function geometry(page: Page) {
  const rect = async (selector: ReturnType<typeof panel>) => selector.evaluate(element => {
    const r = element.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });
  const [container, form, actions, mint, scroll] = await Promise.all([
    rect(popup(page)), rect(panel(page)), rect(footer(page)), rect(popup(page).locator("header")),
    content(page).evaluate((e: HTMLElement) => ({ gutter: e.offsetWidth - e.clientWidth, height: e.clientHeight, scrollHeight: e.scrollHeight, scrollTop: e.scrollTop })),
  ]);
  return { container, form, actions, mint, scroll, deltaLeft: Math.abs(form.left - actions.left), deltaRight: Math.abs(form.right - actions.right) };
}

const viewports = [
  [320, 900], [360, 900], [390, 900], [768, 900], [899, 900], [900, 900],
  [1024, 900], [1280, 900], [1366, 900], [1440, 900], [1920, 900],
  [390, 320], [768, 390], [1366, 768], [390, 420], [683, 384],
] as const;
for (const [width, height] of viewports) test(`ALIGN-01/02 shared panel geometry ${width}x${height}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height }); await page.goto("/", { waitUntil: "networkidle" });
  await expect(popup(page)).toBeVisible();
  const evidence: unknown[] = [];
  try {
    for (const mode of ["initial", "errors", "long-scroll"] as const) await test.step(mode, async () => {
      if (mode === "errors") {
        await footer(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true }).click();
        await expect(panel(page).locator('[role="alert"]')).toHaveCount(4);
      }
      if (mode === "long-scroll") {
        // Explicit layout fixture: long rendered error copy and a user-resized
        // textarea. This is not represented as a real server/business response.
        await panel(page).locator('[role="alert"]').evaluateAll(elements => {
          for (const element of elements) element.textContent = element.textContent!.repeat(24);
        });
        await panel(page).locator("textarea").evaluate(e => { e.style.height = "800px"; });
      }
      const value = await geometry(page); evidence.push({ mode, ...value });
      await page.screenshot({ path: info.outputPath(`${mode}.png`), animations: "disabled" });
      await page.screenshot({ path: info.outputPath(`${mode}-seam.png`), animations: "disabled", clip: {
        x: value.container.left, y: Math.max(0, value.actions.top - 16), width: value.container.width,
        height: Math.min(height - Math.max(0, value.actions.top - 16), value.actions.height + 32),
      } });
      expect(value.deltaLeft, "Top/bottom left edges share one grid geometry").toBeLessThanOrEqual(1);
      expect(value.deltaRight, "Top/bottom right edges share one grid geometry").toBeLessThanOrEqual(1);
      if (width >= 900) {
        expect(Math.abs(value.mint.right - value.form.left), "Mint/white boundary has no gap or overlap").toBeLessThanOrEqual(1);
        expect(Math.abs(value.mint.right - value.actions.left)).toBeLessThanOrEqual(1);
      }
      expect(value.actions.bottom).toBeLessThanOrEqual(value.container.bottom + 1);
      expect(value.actions.top).toBeGreaterThanOrEqual(value.container.top - 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.body.style.position)).toBe("fixed");
      await expect(footer(page).getByRole("button")).toBeInViewport({ ratio: 1 });
      if (mode === "long-scroll") {
        expect(value.scroll.scrollHeight).toBeGreaterThan(value.scroll.height);
        await content(page).evaluate(e => { e.scrollTop = e.scrollHeight; });
        const bottom = await panel(page).locator('[role="alert"]').last().boundingBox();
        const cta = await footer(page).boundingBox();
        expect(bottom!.y + bottom!.height, "Last content can scroll clear of the pinned CTA").toBeLessThanOrEqual(cta!.y + 1);
        await expect(footer(page).getByRole("button")).toBeInViewport({ ratio: 1 });
      }
    });
  } finally { writeFileSync(info.outputPath("geometry.json"), JSON.stringify({ width, height, engine: info.project.name, evidence }, null, 2)); }
});

test("LOGO-01/02 badge uses the official mark and preserves the large gift", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto("/", { waitUntil: "networkidle" }); await expect(popup(page)).toBeVisible();
  const badge = popup(page).getByText("HomeMind Premium", { exact: true }), image = badge.locator("img");
  await expect(image).toHaveCount(1); await expect(image).toHaveAttribute("alt", "");
  await expect(image).toHaveAttribute("width", "20"); await expect(image).toHaveAttribute("height", "20");
  await expect(badge.locator("svg")).toHaveCount(0);
  await expect(image).toBeVisible(); await expect.poll(() => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const brand = page.getByRole("link", { name: "HomeMind — Trang chủ", exact: true }).first().locator("img");
  const source = (src: string) => { const url = new URL(src, "http://localhost"); return url.searchParams.get("url") ?? url.pathname; };
  const asset = source((await image.getAttribute("src"))!);
  expect(asset).toBe(source((await brand.getAttribute("src"))!));
  const response = await page.request.get(asset); expect(response.status()).toBe(200);
  const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
  expect(digest(await response.body())).toBe(digest(readFileSync(join(process.cwd(), "src/app/logo.png"))));
  const gift = popup(page).locator('header > div').nth(1);
  await expect(gift.locator("svg.lucide-gift")).toHaveCount(1);
  await expect(gift.locator("svg")).toHaveAttribute("width", "40"); await expect(gift.locator("svg")).toHaveAttribute("stroke-width", "1.5");
  await expect(gift).toHaveCSS("width", "72px"); await expect(gift).toHaveCSS("height", "72px");
  await expect(gift).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(gift).toHaveCSS("box-shadow", "rgba(16, 185, 129, 0.15) 0px 8px 30px 0px");
  writeFileSync(info.outputPath("brand.json"), JSON.stringify({ asset, pngSha256: digest(await response.body()), gift: await gift.innerHTML(), badgeRect: await image.boundingBox() }, null, 2));
});

test("LOGO-03 delayed Retina image reserves its box without shifting the badge", async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce", baseURL });
  const page = await context.newPage(); await fixture(page);
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/_next/image?*', async route => {
    if (Number(new URL(route.request().url()).searchParams.get("w")) <= 48) await gate;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" }); await expect(popup(page)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const badge = popup(page).getByText("HomeMind Premium", { exact: true }), image = badge.locator("img");
    await expect(image).toHaveCount(1);
    const before = { badge: await badge.boundingBox(), image: await image.boundingBox(), panel: await panel(page).boundingBox() };
    expect(before.image!.width).toBe(20); expect(before.image!.height).toBe(20);
    expect(await image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBe(0);
    release(); await expect.poll(() => image.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const after = { badge: await badge.boundingBox(), image: await image.boundingBox(), panel: await panel(page).boundingBox() };
    expect(after).toEqual(before);
    const current = await image.evaluate(e => (e as HTMLImageElement).currentSrc);
    expect(Number(new URL(current).searchParams.get("w"))).toBeGreaterThanOrEqual(40);
    const response = await page.request.get(current); expect(response.status()).toBe(200);
    writeFileSync(info.outputPath("retina.json"), JSON.stringify({ before, after, current, status: response.status(), deviceScaleFactor: 2 }, null, 2));
    expect(failures.get(page)!.posts).toBe(0); expect(failures.get(page)!.errors).toEqual([]);
  } finally { release(); await context.close(); }
});
