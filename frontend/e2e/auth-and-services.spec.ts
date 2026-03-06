import { expect, test } from "@playwright/test";
import {
  expectCookieValue,
  postJsonThroughBrowser,
  signupAndReachDashboard,
  toTestIdSegment,
} from "./helpers";

test("signup, operate services, and logout", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "services");
  const csrfToken = await expectCookieValue(page, "bs_csrf");
  const apiServiceName = `Api Corte ${suffix}`;
  const serviceName = `Corte ${suffix}`;
  const apiServiceRowId = `services-row-${toTestIdSegment(apiServiceName)}`;
  const serviceRowId = `services-row-${toTestIdSegment(serviceName)}`;

  const blockedCreate = await postJsonThroughBrowser(page, "/api/services", {
    name: apiServiceName,
    durationMinutes: 25,
    price: 9.5,
  });
  expect(blockedCreate.status).toBe(403);
  expect(blockedCreate.body?.code).toBe("CSRF_REQUIRED");

  const allowedCreate = await postJsonThroughBrowser(
    page,
    "/api/services",
    {
      name: apiServiceName,
      durationMinutes: 25,
      price: 9.5,
    },
    csrfToken,
  );
  expect(allowedCreate.status).toBe(201);

  await page.getByTestId("nav-services").click();
  await expect(page).toHaveURL(/\/app\/services$/);
  await expect(page.getByTestId(apiServiceRowId)).toBeVisible();

  await page.getByTestId("services-add").click();
  await page.getByTestId("services-name").fill(serviceName);
  await page.getByTestId("services-duration").fill("30");
  await page.getByTestId("services-price").fill("10.00");
  await page.getByTestId("services-submit").click();

  const serviceRow = page.getByTestId(serviceRowId);
  await expect(serviceRow).toBeVisible();
  await expect(serviceRow).toContainText("30 min");
  await expect(serviceRow).toContainText("Activa");

  await page.getByTestId(`services-actions-${toTestIdSegment(serviceName)}`).click();
  await page.getByTestId(`services-edit-${toTestIdSegment(serviceName)}`).click();
  await page.getByTestId("services-duration").fill("45");
  await page.getByTestId("services-submit").click();

  await expect(serviceRow).toContainText("45 min");

  await page.getByTestId(`services-actions-${toTestIdSegment(serviceName)}`).click();
  await page.getByTestId(`services-toggle-${toTestIdSegment(serviceName)}`).click();
  await page.getByTestId(`services-toggle-${toTestIdSegment(serviceName)}-confirm`).click();
  await expect(serviceRow).toContainText("Inactiva");

  await page.getByTestId("nav-user-menu").click();
  await page.getByTestId("nav-logout").click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/app/services");
  await expect(page).toHaveURL(/\/login/);
});
