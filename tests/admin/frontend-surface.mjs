export async function createFrontendContext(
  engine,
  { production = false, local = "http://127.0.0.1:3300", ...options } = {},
) {
  if (!production) {
    try {
      const response = await fetch(`${local}/healthz`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error();
    } catch {
      throw new Error("BLOCKED: candidate frontend is not ready");
    }
  }
  const browser = await engine.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    ...options,
  });
  if (!production)
    await context.route("https://homemind.vn/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!["GET", "HEAD"].includes(request.method()))
        throw new Error(
          "Candidate frontend mapper accepts only real read resources",
        );
      const headers = { ...request.headers() };
      delete headers.host;
      delete headers.cookie;
      try {
        const response = await fetch(`${local}${url.pathname}${url.search}`, {
          method: request.method(),
          headers,
          redirect: "manual",
        });
        const output = Object.fromEntries(response.headers);
        for (const key of [
          "content-encoding",
          "content-length",
          "transfer-encoding",
        ])
          delete output[key];
        await route.fulfill({
          status: response.status,
          headers: output,
          body: Buffer.from(await response.arrayBuffer()),
        });
      } catch {
        await route.abort("failed");
      }
    });
  return { browser, context };
}
