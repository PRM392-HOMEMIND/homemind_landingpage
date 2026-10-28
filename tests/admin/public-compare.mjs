import { chromium } from "@playwright/test";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const baselinePath = process.env.ADMIN_PUBLIC_BASELINE;
if (!baselinePath)
  throw new Error(
    "Set ADMIN_PUBLIC_BASELINE to the pre-change baseline.json outside the repository",
  );
const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3300";
const directory = await mkdtemp(join(tmpdir(), "homemind-public-comparison-"));
const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: "reduce" });
const results = [];
async function colorsAndGeometry() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  const rgba = (color) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  };
  return [
    ...document.querySelectorAll("header, header a, header button, main h1"),
  ].map((element) => {
    const css = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      tag: element.tagName,
      text: element.textContent,
      color: rgba(css.color),
      background: rgba(css.backgroundColor),
      font: css.fontFamily,
      weight: css.fontWeight,
      size: css.fontSize,
      radius: css.borderRadius,
      width: Number(box.width.toFixed(3)),
      height: Number(box.height.toFixed(3)),
    };
  });
}
const reference = await browser.newPage({ reducedMotion: "reduce" });
for (const before of baseline) {
  await page.setViewportSize({ width: before.width, height: 950 });
  const response = await page.goto(base + before.path, {
    waitUntil: "networkidle",
  });
  const after = await page.evaluate(() => ({
    title: document.title,
    overflow: document.documentElement.scrollWidth > innerWidth,
    font: getComputedStyle(document.body).fontFamily,
    primary: getComputedStyle(document.documentElement).getPropertyValue(
      "--color-primary",
    ),
    headings: [...document.querySelectorAll("h1,h2")].map((n) => n.textContent),
    links: [...document.querySelectorAll("a")].map((n) => ({
      text: n.textContent,
      href: n.getAttribute("href"),
    })),
  }));
  // Tailwind may emit an additional root declaration when new sources are scanned.
  // Verify actual public element colors/geometry against the still-active baseline
  // release instead of treating an unused declaration as a visual regression.
  await reference.setViewportSize({ width: before.width, height: 950 });
  await reference.goto("https://homemind.vn" + before.path, {
    waitUntil: "networkidle",
  });
  const expectedStyles = await reference.evaluate(colorsAndGeometry);
  const actualStyles = await page.evaluate(colorsAndGeometry);
  const changes = Object.keys(after).filter(
    (key) =>
      key !== "primary" &&
      JSON.stringify(after[key]) !== JSON.stringify(before[key]),
  );
  if (JSON.stringify(expectedStyles) !== JSON.stringify(actualStyles)) {
    changes.push("actual-colors-or-geometry");
    console.log(
      JSON.stringify({
        styleDifferences: expectedStyles.flatMap((row, index) =>
          Object.keys(row)
            .filter((key) => row[key] !== actualStyles[index]?.[key])
            .map((key) => ({
              index,
              key,
              ...(key !== "text"
                ? { before: row[key], after: actualStyles[index]?.[key] }
                : {}),
            })),
        ),
      }),
    );
  }
  const result = {
    path: before.path,
    width: before.width,
    status: response.status(),
    changes,
    rootVariableDeclarationChanged: after.primary !== before.primary,
    result: response.status() === 200 && !changes.length ? "PASS" : "FAIL",
  };
  results.push(result);
  console.log(JSON.stringify(result));
  await page.screenshot({
    path: join(
      directory,
      `${before.path.replaceAll("/", "") || "home"}-${before.width}.png`,
    ),
    fullPage: true,
  });
}
await browser.close();
await writeFile(
  join(directory, "comparison.json"),
  JSON.stringify(results, null, 2),
);
console.log(`Public comparison: ${directory}`);
if (results.some((r) => r.result === "FAIL")) process.exitCode = 1;
