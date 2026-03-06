import { expect, test } from "@playwright/test";
import { signupAndReachDashboard, toTestIdSegment } from "./helpers";

test("signup, operate services, and logout", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "services");
  const serviceName = `Corte ${suffix}`;
  const serviceRowId = `services-row-${toTestIdSegment(serviceName)}`;

  await page.getByTestId("nav-services").click();
  await expect(page).toHaveURL(/\/app\/services$/);

  await page.getByTestId("services-add").click();
  await page.getByTestId("services-name").fill(serviceName);
  await page.getByTestId("services-duration").fill("30");
  await page.getByTestId("services-price").fill("10.00");
  await page.getByTestId("services-submit").click();

  const serviceRow = page.getByTestId(serviceRowId);
  await expect(serviceRow).toBeVisible();
  await expect(serviceRow).toContainText("30 min");
  await expect(serviceRow).toContainText("Activa");

  await page.getByTestId(`services-edit-${toTestIdSegment(serviceName)}`).click();
  await page.getByTestId("services-duration").fill("45");
  await page.getByTestId("services-submit").click();

  await expect(serviceRow).toContainText("45 min");

  await page.getByTestId(`services-toggle-${toTestIdSegment(serviceName)}`).click();
  await expect(serviceRow).toContainText("Inactiva");

  await page.getByTestId("nav-logout").click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/app/services");
  await expect(page).toHaveURL(/\/login/);
});
