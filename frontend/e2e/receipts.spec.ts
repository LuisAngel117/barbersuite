import { expect, test } from "@playwright/test";
import { selectFirstBranch, signupAndReachDashboard } from "./helpers";

test("create and void a receipt from cash module", async ({ page }) => {
  await signupAndReachDashboard(page, "receipts");
  await selectFirstBranch(page);

  await page.getByTestId("nav-receipts").click();
  await expect(page).toHaveURL(/\/app\/receipts$/);

  await page.getByTestId("receipts-add").click();
  await page.getByTestId("receipt-item-description-0").fill("Venta Playwright");
  await page.getByTestId("receipt-item-quantity-0").fill("1");
  await page.getByTestId("receipt-item-unitPrice-0").fill("12.00");
  await page.getByTestId("receipt-payment-amount-0").fill("12.00");
  await page.getByTestId("receipt-submit").click();

  const receiptRow = page.locator('[data-testid^="receipts-row-"]').first();
  await expect(receiptRow).toBeVisible();
  await expect(receiptRow).toContainText(/BR-DEMO-\d{4}-000001/);
  await expect(receiptRow).toContainText(/Emitido|Issued/);

  await receiptRow.locator('[data-testid^="receipts-actions-"]').click();
  await page.locator('[data-testid^="receipts-void-"]').click();
  await page.getByTestId("receipt-void-reason").fill("Anulado por prueba E2E");
  await page.getByTestId("receipt-void-submit").click();

  await expect(receiptRow).toContainText(/Anulado|Voided/);
});
