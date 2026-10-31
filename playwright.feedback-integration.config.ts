import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/feedback", testMatch: "integration.spec.ts", workers: 1, retries: 0, timeout: 60_000, expect: { timeout: 8_000 },
  reporter: [["list"], ["json", { outputFile: process.env.FEEDBACK_JSON_REPORT }]],
  use: { baseURL: process.env.FEEDBACK_BASE_URL ?? "http://127.0.0.1:3417", screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", timeout: 180_000, use: { ...devices["Desktop Safari"] } },
    { name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
  ],
});
