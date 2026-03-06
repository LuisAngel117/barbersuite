import { expect, type Page } from "@playwright/test";

type SignupCredentials = {
  email: string;
  password: string;
  suffix: string;
};

export function createUniqueSuffix(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export async function signupAndReachDashboard(
  page: Page,
  prefix: string,
): Promise<SignupCredentials> {
  const suffix = createUniqueSuffix(prefix);
  const email = `${suffix}@example.com`;
  const password = "DemoPass123!";

  await page.goto("/signup");
  await page.getByTestId("signup-tenantName").fill(`BarberSuite ${suffix}`);
  await page.getByTestId("signup-branchName").fill("Sucursal Demo");
  await page.getByTestId("signup-branchCode").fill("DEMO");
  await page.getByTestId("signup-timeZone").fill("America/Guayaquil");
  await page.getByTestId("signup-adminFullName").fill("Demo Admin");
  await page.getByTestId("signup-adminEmail").fill(email);
  await page.getByTestId("signup-adminPassword").fill(password);
  await page.getByTestId("signup-submit").click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId("branch-selector")).toBeVisible();

  return {
    email,
    password,
    suffix,
  };
}

export async function getCookieValue(page: Page, name: string) {
  const cookies = await page.context().cookies("http://localhost:3000");
  return cookies.find((cookie) => cookie.name === name)?.value ?? null;
}

export async function expectCookieValue(page: Page, name: string) {
  await expect.poll(async () => getCookieValue(page, name)).not.toBeNull();
  return (await getCookieValue(page, name)) as string;
}

export async function postJsonThroughBrowser(
  page: Page,
  path: string,
  payload: unknown,
  csrfToken?: string,
) {
  return page.evaluate(
    async ({ innerPath, innerPayload, innerCsrfToken }) => {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };

      if (innerCsrfToken) {
        headers["X-CSRF-Token"] = innerCsrfToken;
      }

      const response = await fetch(innerPath, {
        method: "POST",
        headers,
        body: JSON.stringify(innerPayload),
        credentials: "same-origin",
      });

      return {
        status: response.status,
        body: await response.json().catch(() => null),
      };
    },
    {
      innerPath: path,
      innerPayload: payload,
      innerCsrfToken: csrfToken ?? null,
    },
  );
}

export async function selectFirstBranch(page: Page) {
  const selector = page.getByTestId("branch-selector");
  await expect(selector).toBeVisible();

  const branchId = await selector.locator("option").evaluateAll((options) => {
    const selectable = options
      .map((option) => option as HTMLOptionElement)
      .find((option) => !option.disabled && option.value);

    return selectable?.value ?? "";
  });

  if (!branchId) {
    throw new Error("No active branch option was available for selection.");
  }

  await selector.selectOption(branchId);
  await expect.poll(async () => {
    const cookies = await page.context().cookies("http://localhost:3000");
    return cookies.find((cookie) => cookie.name === "bs_branch_id")?.value ?? "";
  }).toBe(branchId);

  await page.reload();
  await expect(selector).toHaveValue(branchId);

  return branchId;
}
