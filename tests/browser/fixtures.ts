import { test as base, type Page } from "@playwright/test";
import { localFixture } from "../feedback/local-fixture";
import { campaign } from "../feedback/contract-fixtures";
export { expect } from "@playwright/test";
export async function handleInvitations(page: Page) {
  await page.addLocatorHandler(page.locator('dialog[data-feedback-dialog][open]'), async dialog => {
    await dialog.getByRole("button", { name: "Đóng cửa sổ góp ý", exact: true }).click();
  });
}
// Image smoke on loopback defaults to a disabled fixture; a named enabled
// fixture exercises invitations across engines without shared DB toggles. The real
// production origin allowlist intentionally denies localhost. Local integration
// selects the owned released backend. Production website smoke stays read-only
// and uses its real public GET configuration without this interception.
export const test = base.extend({
  page: async ({ page, baseURL }, runWithPage) => {
    if (process.env.FEEDBACK_LOCAL_FIXTURE || ["127.0.0.1", "localhost", "[::1]"].includes(new URL(baseURL!).hostname)) {
      const fixture = process.env.FEEDBACK_LOCAL_FIXTURE ? localFixture() : undefined;
      await page.route("https://api.homemind.vn/**", async route => {
        if (route.request().method() !== "GET" || route.request().url() !== "https://api.homemind.vn/v1/public/feedback-popup") {
          await route.abort(); throw new Error("Unverified regression API call");
        }
        if (fixture) {
          const response = await route.fetch({ url: `${fixture.baseUrl}/public/feedback-popup` }); await route.fulfill({ response });
        } else await route.fulfill({ json: { ...campaign, enabled: process.env.SMOKE_CAMPAIGN_FIXTURE === "enabled" } });
      });
    }
    // An enabled production campaign now opens immediately and reopens after
    // 120s. Regression smoke closes the actual invitation as a visitor would;
    // it does not disable config, submit data or suppress the product timer.
    await handleInvitations(page);
    await runWithPage(page);
  },
});
