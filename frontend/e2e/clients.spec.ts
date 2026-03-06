import { expect, test } from "@playwright/test";
import {
  selectFirstBranch,
  signupAndReachDashboard,
  toTestIdSegment,
} from "./helpers";

test("select branch and operate clients", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "clients");
  const clientName = `Juan Perez ${suffix}`;
  const clientRowId = `clients-row-${toTestIdSegment(clientName)}`;

  await selectFirstBranch(page);

  await page.getByTestId("nav-clients").click();
  await expect(page).toHaveURL(/\/app\/clients$/);

  await page.getByTestId("clients-add").click();
  await page.getByTestId("client-fullName").fill(clientName);
  await page.getByTestId("client-phone").fill("0999999999");
  await page.getByTestId("client-email").fill(`${suffix}@clients.example.com`);
  await page.getByTestId("client-notes").fill("Cliente frecuente");
  await page.getByTestId("client-submit").click();

  const clientRow = page.getByTestId(clientRowId);
  await expect(clientRow).toBeVisible();
  await expect(clientRow).toContainText("Cliente frecuente");
  await expect(clientRow).toContainText("Activo");

  await page.getByTestId("clients-search").fill(clientName);
  await page.getByTestId("clients-search-submit").click();
  await expect(clientRow).toBeVisible();

  await page.getByTestId(`clients-edit-${toTestIdSegment(clientName)}`).click();
  await page.getByTestId("client-notes").fill("Actualizado por Playwright");
  await page.getByTestId("client-submit").click();

  await expect(clientRow).toContainText("Actualizado por Playwright");

  await page.getByTestId(`clients-toggle-${toTestIdSegment(clientName)}`).click();
  await expect(clientRow).toContainText("Inactivo");
});
