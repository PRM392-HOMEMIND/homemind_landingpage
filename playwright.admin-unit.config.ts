import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/admin/unit",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { screenshot: "off", trace: "off", video: "off" },
});
