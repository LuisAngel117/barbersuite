import { expect, test } from "@playwright/test";
import { selectFirstBranch, signupAndReachDashboard, toTestIdSegment } from "./helpers";

test("configure weekly availability for a barber", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "availability");
  const barberName = `Barbero ${suffix}`;
  const barberEmail = `${suffix}@availability.example.com`;
  const barberRowId = `staff-row-${toTestIdSegment(barberName)}`;

  await selectFirstBranch(page);
  await page.goto("/app/staff");

  await page.getByTestId("staff-add").click();
  await page.getByTestId("barber-fullName").fill(barberName);
  await page.getByTestId("barber-email").fill(barberEmail);
  await page.getByTestId("barber-phone").fill("0999999997");
  await page.getByTestId("barber-password").fill("DemoPass123!");
  await page.getByTestId("barber-submit").click();

  await expect(page.getByTestId(barberRowId)).toBeVisible();

  await page.goto("/app/staff/availability");
  await expect(page.getByTestId("availability-barber-select")).toBeVisible();

  await page.getByTestId("availability-barber-select").click();
  await page.getByRole("option", { name: barberName }).click();

  await page.getByTestId("availability-day-1-add").click();
  await page.getByTestId("availability-weekly-1-0-start").fill("09:00");
  await page.getByTestId("availability-weekly-1-0-end").fill("12:00");

  const saveResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/api/availability/barbers/"),
  );
  await page.getByTestId("availability-save").click();
  const saveResponse = await saveResponsePromise;
  expect(saveResponse.status()).toBe(200);

  await expect(page.getByTestId("availability-save")).toBeDisabled();

  await page.reload();
  await expect(page.getByTestId("availability-weekly-1-0-start")).toHaveValue("09:00");
  await expect(page.getByTestId("availability-weekly-1-0-end")).toHaveValue("12:00");
});
