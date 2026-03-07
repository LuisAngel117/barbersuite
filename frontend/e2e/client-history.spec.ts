import { expect, test } from "@playwright/test";
import {
  expectCookieValue,
  postJsonThroughBrowser,
  selectFirstBranch,
  signupAndReachDashboard,
  toTestIdSegment,
} from "./helpers";

test("open client detail page from clients table", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "client-history");
  const csrfToken = await expectCookieValue(page, "bs_csrf");
  const clientName = `Cliente Historial ${suffix}`;
  const clientRowId = `clients-row-${toTestIdSegment(clientName)}`;
  const clientLinkId = `clients-view-${toTestIdSegment(clientName)}`;

  await selectFirstBranch(page);

  const createdClient = await postJsonThroughBrowser(
    page,
    "/api/clients",
    {
      fullName: clientName,
      email: `${suffix}@client-history.example.com`,
      notes: "Cliente para detalle",
    },
    csrfToken,
  );

  expect(createdClient.status).toBe(201);

  await page.goto("/app/clients");
  await expect(page.getByTestId(clientRowId)).toBeVisible();

  await page.getByTestId(clientLinkId).click();
  await expect(page).toHaveURL(/\/app\/clients\/.+$/);
  await expect(page.getByTestId("client-detail-tabs")).toBeVisible();
  await expect(page.getByTestId("client-detail-tab-overview")).toBeVisible();
  await expect(page.getByTestId("client-detail-tab-appointments")).toBeVisible();
  await expect(page.getByTestId("client-detail-tab-receipts")).toBeVisible();
  await expect(page.getByTestId("client-overview")).toBeVisible();
});
