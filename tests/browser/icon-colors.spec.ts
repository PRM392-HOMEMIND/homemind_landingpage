import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures";

test("colored favicon is the single served browser icon, including a cache-free refresh", async ({ page, request, baseURL }, info) => {
  const expected = readFileSync("src/app/favicon.ico");
  const expectedHash = createHash("sha256").update(expected).digest("hex");
  expect(expected.readUInt16LE(0)).toBe(0);
  expect(expected.readUInt16LE(2)).toBe(1);
  const sizes = Array.from({ length: expected.readUInt16LE(4) }, (_, index) => {
    const offset = 6 + index * 16;
    return [expected[offset] || 256, expected[offset + 1] || 256];
  });
  expect(sizes).toEqual([16, 24, 32, 48, 64, 128, 256].map(size => [size, size]));
  const embeddedFrames = sizes.map(([size], index) => {
    const entry = 6 + index * 16;
    const length = expected.readUInt32LE(entry + 8);
    const offset = expected.readUInt32LE(entry + 12);
    const png = expected.subarray(offset, offset + length);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    return { size, url: `data:image/png;base64,${png.toString("base64")}` };
  });

  const origin = new URL(baseURL!).origin;
  const errors: string[] = [];
  const iconResponses: { url: string; status: number; type: string | undefined }[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
  });
  page.on("requestfailed", request => {
    if (request.failure()?.errorText === "net::ERR_ABORTED" && request.isNavigationRequest()) return;
    if (new URL(request.url()).origin === origin) errors.push(`${request.url()} ${request.failure()?.errorText}`);
  });
  page.on("response", response => {
    if (new URL(response.url()).origin !== origin) return;
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    if (new URL(response.url()).pathname === "/favicon.ico") {
      iconResponses.push({ url: response.url(), status: response.status(), type: response.headers()["content-type"] });
    }
  });
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  await session.send("Network.clearBrowserCache");

  for (const path of ["/", "/privacy-policy", "/terms-of-service"]) {
    expect((await page.goto(path, { waitUntil: "networkidle" }))?.status()).toBe(200);
    const icons = page.locator('head link[rel~="icon"]');
    await expect(icons).toHaveCount(1);
    const href = await icons.getAttribute("href");
    const iconURL = new URL(href!, baseURL!);
    expect(iconURL.origin).toBe(origin);
    expect(iconURL.pathname).toBe("/favicon.ico");
    expect(iconURL.search, "Next's content-specific favicon URL busts the previous tab cache").toContain("favicon.");
    const response = await request.get(iconURL.href);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\/(x-icon|vnd\.microsoft\.icon)/);
    expect(createHash("sha256").update(await response.body()).digest("hex")).toBe(expectedHash);
  }
  const direct = await request.get("/favicon.ico");
  expect(direct.status()).toBe(200);
  expect(createHash("sha256").update(await direct.body()).digest("hex")).toBe(expectedHash);
  expect((await page.reload({ waitUntil: "networkidle" }))?.status()).toBe(200);

  // Decode the actual head-selected ICO in Chromium, keeping its alpha/RGB.
  const pixels = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('head link[rel~="icon"]')!.href;
    const response = await fetch(href, { cache: "reload" });
    const bytes = await response.arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), byte => byte.toString(16).padStart(2, "0")).join("");
    const image = new Image();
    image.src = href;
    await image.decode();
    const results = [16, 32].map(size => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size).data;
      let green = 0, transparent = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] === 0) transparent++;
        if (pixels[index + 3] > 32 && pixels[index + 1] > pixels[index] + 15 && pixels[index + 1] > pixels[index + 2] + 5) green++;
      }
      return { size, green, transparent, preview: canvas.toDataURL() };
    });
    return { hash, results };
  });
  expect(pixels.hash).toBe(expectedHash);
  for (const result of pixels.results) {
    expect(result.green, `HomeMind RGB green remains at ${result.size}px`).toBeGreaterThan(10);
    expect(result.transparent).toBeGreaterThan(10);
    await info.attach(`favicon-${result.size}px`, { body: Buffer.from(result.preview.split(",")[1], "base64"), contentType: "image/png" });
  }
  // Inspect every native ICO frame, especially the strengthened 16px bitmap.
  const nativeFrames = await page.evaluate(async frames => {
    return Promise.all(frames.map(async frame => {
      const image = new Image();
      image.src = frame.url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = frame.size;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, frame.size, frame.size).data;
      let left = frame.size, top = frame.size, right = 0, bottom = 0, strong = 0;
      for (let y = 0; y < frame.size; y++) {
        for (let x = 0; x < frame.size; x++) {
          const alpha = data[(y * frame.size + x) * 4 + 3];
          if (alpha > 128) strong++;
          if (alpha <= 32) continue;
          left = Math.min(left, x); top = Math.min(top, y);
          right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
        }
      }
      return { size: frame.size, left, top, right, bottom, strong };
    }));
  }, embeddedFrames);
  for (const frame of nativeFrames) {
    expect((frame.right - frame.left) / frame.size, `artwork fills ${frame.size}px canvas`).toBeGreaterThanOrEqual(0.8);
    expect((frame.right - frame.left) / frame.size).toBeLessThanOrEqual(0.9);
    expect((frame.bottom - frame.top) / frame.size).toBeGreaterThanOrEqual(0.7);
    expect(frame.left).toBeGreaterThan(0);
    expect(frame.top).toBeGreaterThan(0);
    expect(frame.right).toBeLessThan(frame.size);
    expect(frame.bottom).toBeLessThan(frame.size);
    expect(Math.abs(frame.left + frame.right - frame.size)).toBeLessThanOrEqual(1);
    expect(Math.abs(frame.top + frame.bottom - frame.size)).toBeLessThanOrEqual(1);
    if (frame.size === 16) expect(frame.strong, "16px outline remains legible").toBeGreaterThan(40);
  }
  await info.attach("favicon-native-frame-bounds", { body: JSON.stringify(nativeFrames, null, 2), contentType: "application/json" });
  expect(iconResponses.length).toBeGreaterThan(0);
  expect(iconResponses.every(response => response.status === 200 && response.type?.startsWith("image/"))).toBe(true);
  await info.attach("favicon-network", { body: JSON.stringify({ hash: pixels.hash, iconResponses, sizes }, null, 2), contentType: "application/json" });
  expect(errors).toEqual([]);
});
