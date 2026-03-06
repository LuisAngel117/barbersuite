import { expect, test } from "@playwright/test";
import { signupAndReachDashboard, toTestIdSegment } from "./helpers";

test("manage barbers from staff admin", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "staff");
  const barberName = `Barbero ${suffix}`;
  const barberEmail = `${suffix}@staff.example.com`;
  const barberRowId = `staff-row-${toTestIdSegment(barberName)}`;

  await page.getByTestId("nav-staff").click();
  await expect(page).toHaveURL(/\/app\/staff$/);

  await page.getByTestId("staff-add").click();
  await page.getByTestId("barber-fullName").fill(barberName);
  await page.getByTestId("barber-email").fill(barberEmail);
  await page.getByTestId("barber-phone").fill("0999999997");
  await page.getByTestId("barber-password").fill("DemoPass123!");
  await page.getByTestId("barber-submit").click();

  const barberRow = page.getByTestId(barberRowId);
  await expect(barberRow).toBeVisible();
  await expect(barberRow).toContainText("Activo");

  await page.getByTestId("staff-search").fill(barberName);
  await page.getByTestId("staff-search-submit").click();
  await expect(barberRow).toBeVisible();

  await page.getByTestId(`staff-actions-${toTestIdSegment(barberName)}`).click();
  await page.getByTestId(`staff-toggle-${toTestIdSegment(barberName)}`).click();
  await page.getByTestId(`staff-toggle-${toTestIdSegment(barberName)}-confirm`).click();
  await expect(barberRow).toContainText("Inactivo");
});
