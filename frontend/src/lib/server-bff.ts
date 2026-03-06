import { cookies, headers } from "next/headers";
import {
  readJson,
  type ProblemPayload,
} from "@/lib/backend";
import type {
  AppointmentsResponse,
  BarbersResponse,
} from "@/lib/types/appointments";

function resolveProtocol(host: string | null, forwardedProtocol: string | null) {
  if (forwardedProtocol) {
    return forwardedProtocol;
  }

  if (!host) {
    return "http";
  }

  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return "http";
  }

  return "https";
}

function serializeCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function buildAppOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return null;
  }

  const protocol = resolveProtocol(
    host,
    headerStore.get("x-forwarded-proto"),
  );

  return `${protocol}://${host}`;
}

export async function fetchBffJson<T>(path: string) {
  const origin = await buildAppOrigin();
  if (!origin) {
    return {
      data: null,
      problem: null,
      status: 500,
    };
  }

  const cookieStore = await cookies();
  const response = await fetch(new URL(path, origin), {
    method: "GET",
    headers: {
      cookie: serializeCookies(cookieStore),
    },
    cache: "no-store",
  });

  const payload = await readJson<T | ProblemPayload>(response);
  if (response.ok) {
    return {
      data: payload as T | null,
      problem: null,
      status: response.status,
    };
  }

  return {
    data: null,
    problem: payload as ProblemPayload | null,
    status: response.status,
  };
}

export async function getBarbers() {
  return fetchBffJson<BarbersResponse>("/api/barbers");
}

export async function getAppointments(query?: string | URLSearchParams) {
  const search = typeof query === "string"
    ? query
    : query instanceof URLSearchParams
      ? query.toString()
      : "";
  const path = search ? `/api/appointments?${search}` : "/api/appointments";

  return fetchBffJson<AppointmentsResponse>(path);
}
