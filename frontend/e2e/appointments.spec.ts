import { expect, test } from "@playwright/test";
import { selectFirstBranch, signupAndReachDashboard } from "./helpers";

test("appointments page loads and shows empty state without barbers", async ({ page }) => {
  await signupAndReachDashboard(page, "appointments");
  await selectFirstBranch(page);

  await page.goto("/app/appointments");

  await expect(page.getByTestId("appointments-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Agenda|Appointments/i })).toBeVisible();
  await expect(page.getByTestId("appointments-no-barbers")).toBeVisible();
});
