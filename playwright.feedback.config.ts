import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/feedback",
  testMatch: "popup.spec.ts",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: process.env.FEEDBACK_JSON_REPORT }]],
  use: {
    baseURL: process.env.FEEDBACK_BASE_URL ?? "http://127.0.0.1:3408",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // Windows WebKit actionability polling measured ~2s/action on this host.
    // Keep all UI assertions; the ten-cycle test needs a larger execution budget.
    { name: "webkit", timeout: 120_000, use: { ...devices["Desktop Safari"] } },
    { name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
  ],
});
