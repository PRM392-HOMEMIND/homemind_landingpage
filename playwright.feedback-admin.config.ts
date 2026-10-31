import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
const tlsFile = process.env.FEEDBACK_LOCAL_HTTPS_PROXY;
if (tlsFile && !/^H:[\\/]/i.test(tlsFile)) throw new Error("Task-owned HTTPS fixture manifest required");
const tls = tlsFile ? JSON.parse(readFileSync(tlsFile, "utf8")) : undefined;
if (tls && (tls.productionDatabaseAccess !== false || !/^http:\/\/127\.0\.0\.1:\d+$/.test(tls.url))) throw new Error("Owned loopback HTTPS transport required");
export default defineConfig({
  testDir: "./tests/feedback", testMatch: "admin-integration.spec.ts", workers: 1, retries: 0,
  timeout: 60000, expect: { timeout: 10000 },
  reporter: [["list"], ["json", { outputFile: process.env.FEEDBACK_JSON_REPORT }]],
  use: { trace: "off", screenshot: "off", video: "off" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", timeout: 180000, use: { ...devices["Desktop Safari"], ...(tls ? { proxy: { server: tls.url }, ignoreHTTPSErrors: true } : {}) } },
    { name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
  ],
});
