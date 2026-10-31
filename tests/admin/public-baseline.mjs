import { chromium, firefox } from "@playwright/test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const directory = await mkdtemp(join(tmpdir(), "homemind-frontend-baseline-"));
const base = process.env.SMOKE_BASE_URL || "https://homemind.vn";
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const results = [];
for (const path of ["/", "/privacy-policy", "/terms-of-service"]) {
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 950 });
    const response = await page.goto(base + path, { waitUntil: "networkidle" });
    await page.screenshot({
      path: join(
        directory,
        `${path.replaceAll("/", "") || "home"}-${width}.png`,
      ),
      fullPage: true,
    });
    const layout = await page.evaluate(() => ({
      text: document.body.innerText,
      title: document.title,
      overflow: document.documentElement.scrollWidth > innerWidth,
      font: getComputedStyle(document.body).fontFamily,
      primary: getComputedStyle(document.documentElement).getPropertyValue(
        "--color-primary",
      ),
      headings: Array.from(document.querySelectorAll("h1,h2")).map(
        (n) => n.textContent,
      ),
      links: Array.from(document.querySelectorAll("a")).map((n) => ({
        text: n.textContent,
        href: n.getAttribute("href"),
      })),
    }));
    results.push({ path, width, status: response.status(), ...layout });
    console.log(
      JSON.stringify({
        path,
        width,
        status: response.status(),
        overflow: layout.overflow,
        font: layout.font,
        primary: layout.primary,
      }),
    );
  }
}
await writeFile(
  join(directory, "baseline.json"),
  JSON.stringify(results, null, 2),
);
console.log(`Public baseline: ${directory}`);
await browser.close();
try {
  const second = await firefox.launch();
  await second.close();
  console.log("Firefox engine available");
} catch {
  console.log(
    "Firefox engine unavailable; install required for second-engine acceptance",
  );
}
