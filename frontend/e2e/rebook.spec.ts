import { expect, test } from "@playwright/test";
import {
  expectCookieValue,
  requestJsonThroughBrowser,
  selectFirstBranch,
  signupAndReachDashboard,
} from "./helpers";

test("rebook from client history opens appointments prefilled", async ({ page }) => {
  const { suffix } = await signupAndReachDashboard(page, "rebook");
  const branchId = await selectFirstBranch(page);
  const csrfToken = await expectCookieValue(page, "bs_csrf");
  const serviceName = `Servicio Rebook ${suffix}`;
  const barberName = `Barbero Rebook ${suffix}`;
  const clientName = `Cliente Rebook ${suffix}`;
  const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const createdService = await requestJsonThroughBrowser(
    page,
    "/api/services",
    "POST",
    {
      name: serviceName,
      durationMinutes: 30,
      price: 18,
      active: true,
    },
    csrfToken,
  );
  expect(createdService.status).toBe(201);
  const serviceId = createdService.body?.id as string;

  const createdBarber = await requestJsonThroughBrowser(
    page,
    "/api/staff/barbers",
    "POST",
    {
      fullName: barberName,
      email: `${suffix}@rebook-staff.example.com`,
      phone: "0999999997",
      password: "DemoPass123!",
      branchIds: [branchId],
      active: true,
    },
    csrfToken,
  );
  expect(createdBarber.status).toBe(201);
  const barberId = createdBarber.body?.id as string;

  const availabilityUpdate = await requestJsonThroughBrowser(
    page,
    `/api/availability/barbers/${barberId}`,
    "PUT",
    {
      weekly: Array.from({ length: 7 }, (_, index) => ({
        dayOfWeek: index + 1,
        start: "09:00",
        end: "12:00",
      })),
      exceptions: [],
    },
    csrfToken,
  );
  expect(availabilityUpdate.status).toBe(200);

  const createdClient = await requestJsonThroughBrowser(
    page,
    "/api/clients",
    "POST",
    {
      fullName: clientName,
      email: `${suffix}@rebook-client.example.com`,
      notes: "Cliente para rebook",
    },
    csrfToken,
  );
  expect(createdClient.status).toBe(201);
  const clientId = createdClient.body?.id as string;

  const createdAppointment = await requestJsonThroughBrowser(
    page,
    "/api/appointments",
    "POST",
    {
      clientId,
      barberId,
      serviceId,
      startAtLocal: `${appointmentDate}T10:00`,
      durationMinutes: 30,
      notes: "Cita base para rebook",
    },
    csrfToken,
  );
  expect(createdAppointment.status).toBe(201);
  const appointmentId = createdAppointment.body?.id as string;

  const completedAppointment = await requestJsonThroughBrowser(
    page,
    `/api/appointments/${appointmentId}`,
    "PATCH",
    {
      status: "completed",
    },
    csrfToken,
  );
  expect(completedAppointment.status).toBe(200);

  await page.goto(`/app/clients/${clientId}`);
  await page.getByTestId("client-detail-tab-appointments").click();
  await page.getByTestId(`client-rebook-${appointmentId}`).click();

  await expect(page).toHaveURL(/\/app\/appointments(?:\?.*)?$/);
  await expect.poll(() => page.url()).not.toContain("create=1");
  await expect(page.getByTestId("appointment-prefill-banner")).toBeVisible();
  await expect(page.getByTestId("appointment-client-selected")).toContainText(clientName);
  await expect(page.getByTestId("appointment-barber")).toContainText(barberName);
  await expect(page.getByTestId("appointment-service")).toContainText(serviceName);
  await expect(page.getByTestId("appointment-submit")).toBeVisible();
});
