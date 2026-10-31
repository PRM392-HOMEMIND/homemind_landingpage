import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Reuse Sharp from Next's existing image pipeline; no extra dependency.
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/app/logo.png", root));
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let left = info.width, top = info.height, right = 0, bottom = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    // Ignore almost transparent export noise outside the real symbol.
    if (data[(y * info.width + x) * 4 + 3] <= 32) continue;
    left = Math.min(left, x); top = Math.min(top, y);
    right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
  }
}
if (right <= left || bottom <= top) throw new Error("Logo has no visible artwork");
const cropped = await sharp(source).extract({ left, top, width: right - left, height: bottom - top }).png().toBuffer();
const sizes = [16, 24, 32, 48, 64, 128, 256];
const frames = [];
const previewDirectory = process.argv[2];
if (previewDirectory) await mkdir(previewDirectory, { recursive: true });

for (const size of sizes) {
  // Supersampling preserves the gradient and smooth edges at native tab size.
  const scale = 4;
  // Leave room for the tiny-frame stroke expansion and its antialiasing.
  const strokeInset = size === 16 ? 1 : size === 24 ? 2 : 0;
  const width = Math.round((size * 0.875 - strokeInset) * scale);
  const resized = await sharp(cropped).resize({ width, kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const canvasSize = size * scale;
  const canvas = Buffer.alloc(canvasSize * canvasSize * 4);
  const offsetX = Math.round((canvasSize - resized.info.width) / 2);
  const offsetY = Math.round((canvasSize - resized.info.height) / 2);
  for (let y = 0; y < resized.info.height; y++) {
    resized.data.copy(canvas, ((offsetY + y) * canvasSize + offsetX) * 4, y * resized.info.width * 4, (y + 1) * resized.info.width * 4);
  }
  let rendered = canvas;
  if (size <= 24) {
    // Grow the tiny outline by 0.25px per side, copying existing RGB colors.
    // This changes only the favicon; the official navbar logo stays untouched.
    rendered = Buffer.from(canvas);
    for (let y = 1; y < canvasSize - 1; y++) {
      for (let x = 1; x < canvasSize - 1; x++) {
        const target = (y * canvasSize + x) * 4;
        let best = target;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighbor = ((y + dy) * canvasSize + x + dx) * 4;
            if (canvas[neighbor + 3] > canvas[best + 3]) best = neighbor;
          }
        }
        canvas.copy(rendered, target, best, best + 4);
      }
    }
  }
  const png = await sharp(rendered, { raw: { width: canvasSize, height: canvasSize, channels: 4 } }).resize(size, size, { kernel: "lanczos3" }).png().toBuffer();
  frames.push(png);
  if (previewDirectory) await writeFile(`${previewDirectory}/favicon-${size}.png`, png);
}

// ICO directory with explicit RGBA PNG entries, including a real 16px frame.
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let index = 0; index < sizes.length; index++) {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = sizes[index] === 256 ? 0 : sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frames[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frames[index].length;
}
await writeFile(new URL("src/app/favicon.ico", root), Buffer.concat([header, ...frames]));
console.log(JSON.stringify({ source: fileURLToPath(new URL("src/app/logo.png", root)), crop: { left, top, right, bottom }, sizes, targetWidthRatio: 0.875 }));
