import { expect, test } from "@playwright/test";
import { signupAndReachDashboard } from "./helpers";

test("edit an email template from notifications", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "notification-templates");
  const nextSubject = `Confirmacion ${suffix}`;

  await page.getByTestId("nav-notifications").click();
  await expect(page).toHaveURL(/\/app\/notifications$/);

  await expect(page.getByTestId("notifications-templates-panel")).toBeVisible();

  await page.getByTestId("notification-template-edit-appointment_confirmation").click();
  await expect(page.getByTestId("notification-template-submit")).toBeVisible();

  await page.getByTestId("notification-template-subject").fill(nextSubject);
  await page.getByTestId("notification-template-submit").click();

  await expect(page.getByTestId("notification-template-card-appointment_confirmation")).toContainText(
    nextSubject,
  );
});
