import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests/feedback", testMatch: ["real-contract.spec.ts", "admin-real-contract.spec.ts"], workers: 1, retries: 0, timeout: 45_000, reporter: "list", use: { trace: "off", screenshot: "off" } });
