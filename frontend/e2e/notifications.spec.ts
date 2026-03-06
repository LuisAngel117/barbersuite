import { expect, test } from "@playwright/test";
import { signupAndReachDashboard } from "./helpers";

test("enqueue a test email and show it in outbox", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "notifications");
  const toEmail = `demo+${suffix}@example.com`;
  const subject = `Test ${suffix}`;

  await page.getByTestId("nav-notifications").click();
  await expect(page).toHaveURL(/\/app\/notifications$/);

  await page.getByTestId("notif-test-to").fill(toEmail);
  await page.getByTestId("notif-test-subject").fill(subject);
  await page.getByTestId("notif-test-bodyText").fill("Hello from Playwright");
  await page.getByTestId("notif-test-submit").click();

  await expect(page.getByTestId("notifications-outbox-table")).toBeVisible();

  const row = page
    .locator('[data-testid^="notifications-row-"]')
    .filter({ hasText: subject })
    .first();

  await expect(row).toBeVisible();
  await expect(row).toContainText(/Pendiente|Enviado|Pending|Sent/);
});
