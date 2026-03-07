import { expect, test } from "@playwright/test";
import { signupAndReachDashboard, toTestIdSegment } from "./helpers";

test("manage branches from branches module", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "branches");
  const initialName = `Sucursal ${suffix}`;
  const updatedName = `Sucursal editada ${suffix}`;
  const code = `BR${Date.now().toString().slice(-4)}`;
  const initialSegment = toTestIdSegment(initialName);
  const updatedSegment = toTestIdSegment(updatedName);

  await page.getByTestId("nav-branches").click();
  await expect(page).toHaveURL(/\/app\/branches$/);

  await page.getByTestId("branches-add").click();
  await page.getByTestId("branch-name").fill(initialName);
  await page.getByTestId("branch-code").fill(code);
  await page.getByTestId("branch-timeZone").fill("America/Guayaquil");
  await page.getByTestId("branch-submit").click();

  const initialRow = page.getByTestId(`branches-row-${initialSegment}`);
  await expect(initialRow).toBeVisible();
  await expect(initialRow).toContainText("Activa");

  await page.getByTestId(`branches-actions-${initialSegment}`).click();
  await page.getByTestId(`branches-edit-${initialSegment}`).click();
  await page.getByTestId("branch-name").fill(updatedName);
  await page.getByTestId("branch-submit").click();

  const updatedRow = page.getByTestId(`branches-row-${updatedSegment}`);
  await expect(updatedRow).toBeVisible();
  await expect(updatedRow).toContainText(code);

  await page.getByTestId(`branches-actions-${updatedSegment}`).click();
  await page.getByTestId(`branches-toggle-${updatedSegment}`).click();
  await page.getByTestId(`branches-toggle-${updatedSegment}-confirm`).click();
  await expect(updatedRow).toContainText("Inactiva");
});
