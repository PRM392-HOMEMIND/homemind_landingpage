import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/feedback",
  testMatch: "*.unit.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { screenshot: "off", trace: "off", video: "off" },
});

// Handled by Bao Thach
