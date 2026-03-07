import { expect, test } from "@playwright/test";

test("marketing landing renders and navigates public pages", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "BarberSuite opera la barbería completa sin cambiar de herramientas." })).toBeVisible();

  await page.getByTestId("marketing-nav-features").click();
  await expect(page.getByRole("heading", { name: "Todo lo que ya puedes operar hoy." })).toBeVisible();

  await page.getByTestId("marketing-nav-pricing").click();
  await expect(page.getByRole("heading", { name: "Planes claros por sucursal, sin letra pequeña." })).toBeVisible();

  await page.goto("/");
  await page.getByTestId("marketing-cta-signup").click();
  await expect(page).toHaveURL(/\/signup$/);
});
