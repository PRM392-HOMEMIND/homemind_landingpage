// Actual browser-computed colors; no hardcoded application colors or business data.
export async function assertPrimaryTextContrast(page) {
  const button = page.locator(".hm-primary").first();
  await button.waitFor();
  if (await button.isDisabled())
    throw new Error("Primary control not ready for contrast check");
  const measure = () =>
    button.evaluate((element) => {
      const style = getComputedStyle(element);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const paint = canvas.getContext("2d");
      const luminance = (color) => {
        paint.clearRect(0, 0, 1, 1);
        paint.fillStyle = color;
        paint.fillRect(0, 0, 1, 1);
        const channels = paint.getImageData(0, 0, 1, 1).data;
        if (channels[3] !== 255)
          throw new Error("Contrast sample must be opaque");
        const linear = Array.from(channels.slice(0, 3), (channel) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      const text = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
    });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  const normalRatio = await measure();
  await button.hover();
  await page.waitForTimeout(200);
  const hoverRatio = await measure();
  await page.mouse.move(0, 0);
  if (normalRatio < 4.5 || hoverRatio < 4.5)
    throw new Error("Primary control text contrast below 4.5:1");
  return { normalRatio, hoverRatio };
}
