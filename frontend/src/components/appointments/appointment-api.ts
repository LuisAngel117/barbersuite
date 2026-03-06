"use client";

import {
  type ClientPagePayload,
  type ClientPayload,
  type ServicePayload,
} from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { readApiResponse } from "@/lib/problem";
import type {
  Appointment,
  AppointmentsResponse,
  BarberItem,
  BarbersResponse,
  CreateAppointmentRequest,
  PatchAppointmentRequest,
} from "@/lib/types/appointments";

type ApiResult<T> = {
  data: T | null;
  problem: Awaited<ReturnType<typeof readApiResponse<T>>>["problem"];
  status: number;
};

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  const result = await readApiResponse<T>(response);

  return {
    data: result.data,
    problem: result.problem,
    status: response.status,
  };
}

export async function fetchBarbers() {
  const response = await fetch("/api/barbers", {
    cache: "no-store",
  });
  const result = await parseResponse<BarbersResponse>(response);

  return {
    ...result,
    data: result.data?.items ?? null,
  } satisfies ApiResult<BarberItem[]>;
}

export async function fetchServices() {
  const response = await fetch("/api/services", {
    cache: "no-store",
  });
  return parseResponse<ServicePayload[]>(response);
}

export async function fetchAppointments(params: {
  from: string;
  to: string;
  barberId?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  if (params.barberId) {
    searchParams.set("barberId", params.barberId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const response = await fetch(`/api/appointments?${searchParams.toString()}`, {
    cache: "no-store",
  });
  const result = await parseResponse<AppointmentsResponse>(response);

  return {
    ...result,
    data: result.data?.items ?? null,
  } satisfies ApiResult<Appointment[]>;
}

export async function createAppointment(payload: CreateAppointmentRequest) {
  const response = await apiFetch("/api/appointments", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Appointment>(response);
}

export async function patchAppointment(id: string, payload: PatchAppointmentRequest) {
  const response = await apiFetch(`/api/appointments/${id}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Appointment>(response);
}

export async function fetchClientOptions(query: string) {
  const searchParams = new URLSearchParams({
    q: query,
    page: "0",
    size: "10",
  });
  const response = await fetch(`/api/clients?${searchParams.toString()}`, {
    cache: "no-store",
  });
  const result = await parseResponse<ClientPagePayload>(response);

  return {
    ...result,
    data: result.data?.items ?? null,
  } satisfies ApiResult<ClientPayload[]>;
}

export async function fetchClientById(clientId: string) {
  const response = await fetch(`/api/clients/${clientId}`, {
    cache: "no-store",
  });
  return parseResponse<ClientPayload>(response);
}
