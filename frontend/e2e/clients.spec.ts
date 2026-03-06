import { expect, test } from "@playwright/test";
import {
  expectCookieValue,
  postJsonThroughBrowser,
  selectFirstBranch,
  signupAndReachDashboard,
  toTestIdSegment,
} from "./helpers";

test("select branch and operate clients", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "clients");
  const csrfToken = await expectCookieValue(page, "bs_csrf");
  const apiClientName = `Api Juan ${suffix}`;
  const clientName = `Juan Perez ${suffix}`;
  const apiClientRowId = `clients-row-${toTestIdSegment(apiClientName)}`;
  const clientRowId = `clients-row-${toTestIdSegment(clientName)}`;

  await selectFirstBranch(page);

  const blockedCreate = await postJsonThroughBrowser(page, "/api/clients", {
    fullName: apiClientName,
    phone: "0999999998",
    email: `${suffix}@api-clients.example.com`,
    notes: "Intento sin CSRF",
  });
  expect(blockedCreate.status).toBe(403);
  expect(blockedCreate.body?.code).toBe("CSRF_REQUIRED");

  const allowedCreate = await postJsonThroughBrowser(
    page,
    "/api/clients",
    {
      fullName: apiClientName,
      phone: "0999999998",
      email: `${suffix}@api-clients.example.com`,
      notes: "Creado con CSRF",
    },
    csrfToken,
  );
  expect(allowedCreate.status).toBe(201);

  await page.getByTestId("nav-clients").click();
  await expect(page).toHaveURL(/\/app\/clients$/);
  await expect(page.getByTestId(apiClientRowId)).toBeVisible();

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

  await page.getByTestId(`clients-actions-${toTestIdSegment(clientName)}`).click();
  await page.getByTestId(`clients-edit-${toTestIdSegment(clientName)}`).click();
  await page.getByTestId("client-notes").fill("Actualizado por Playwright");
  await page.getByTestId("client-submit").click();

  await expect(clientRow).toContainText("Actualizado por Playwright");

  await page.getByTestId(`clients-actions-${toTestIdSegment(clientName)}`).click();
  await page.getByTestId(`clients-toggle-${toTestIdSegment(clientName)}`).click();
  await page.getByTestId(`clients-toggle-${toTestIdSegment(clientName)}-confirm`).click();
  await expect(clientRow).toContainText("Inactivo");
});
