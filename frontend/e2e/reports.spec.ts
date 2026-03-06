import { expect, test } from "@playwright/test";
import { selectFirstBranch, signupAndReachDashboard } from "./helpers";

test("reports dashboard loads for admin users", async ({ page }) => {
  await signupAndReachDashboard(page, "reports");
  await selectFirstBranch(page);

  await page.getByTestId("nav-reports").click();

  await expect(page).toHaveURL(/\/app\/reports$/);
  await expect(page.getByTestId("reports-filters")).toBeVisible();
  await expect(page.getByTestId("reports-sales-summary")).toBeVisible();
  await expect(page.getByTestId("reports-daily-chart")).toBeVisible();
  await expect(page.getByTestId("reports-top-services")).toBeVisible();
  await expect(page.getByTestId("reports-barbers-summary")).toBeVisible();
});
