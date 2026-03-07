import { expect, test } from "@playwright/test";
import { signupAndReachDashboard } from "./helpers";

test("settings page shows profile and admin tabs", async ({ page }) => {
  const { email } = await signupAndReachDashboard(page, "settings");

  await page.getByTestId("nav-settings").click();
  await expect(page).toHaveURL(/\/app\/settings$/);

  await expect(page.getByTestId("settings-tabs")).toBeVisible();
  await expect(page.getByTestId("settings-tab-profile")).toBeVisible();
  await expect(page.getByTestId("settings-tab-preferences")).toBeVisible();
  await expect(page.getByTestId("settings-tab-workspace")).toBeVisible();
  await expect(page.getByTestId("settings-tab-integrations")).toBeVisible();
  await expect(page.getByTestId("settings-user-email")).toContainText(email);
});
