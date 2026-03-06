import { readApiResponse } from "@/lib/problem";
import type {
  AppointmentsSummary,
  BarbersSummary,
  SalesDaily,
  SalesSummary,
  TopServices,
} from "@/lib/types/reports";

async function fetchReport<T>(path: string) {
  const response = await fetch(path, {
    cache: "no-store",
  });
  const result = await readApiResponse<T>(response);

  return {
    status: response.status,
    ...result,
  };
}

function toQueryString(params: URLSearchParams | string) {
  const search = typeof params === "string" ? params : params.toString();
  return search ? `?${search}` : "";
}

export function fetchSalesSummary(params: URLSearchParams | string) {
  return fetchReport<SalesSummary>(`/api/reports/sales/summary${toQueryString(params)}`);
}

export function fetchSalesDaily(params: URLSearchParams | string) {
  return fetchReport<SalesDaily>(`/api/reports/sales/daily${toQueryString(params)}`);
}

export function fetchTopServices(params: URLSearchParams | string) {
  return fetchReport<TopServices>(`/api/reports/services/top${toQueryString(params)}`);
}

export function fetchAppointmentsSummary(params: URLSearchParams | string) {
  return fetchReport<AppointmentsSummary>(
    `/api/reports/appointments/summary${toQueryString(params)}`,
  );
}

export function fetchBarbersSummary(params: URLSearchParams | string) {
  return fetchReport<BarbersSummary>(`/api/reports/barbers/summary${toQueryString(params)}`);
}
