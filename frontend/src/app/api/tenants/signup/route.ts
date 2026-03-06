import { setCsrfCookie, createCsrfToken } from "@/lib/csrf-cookie";
import { NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth-cookie";
import {
  buildBackendUrl,
  readJson,
  resolveErrorMessage,
  type ProblemPayload,
  type SignupPayload,
  type SignupResultPayload,
} from "@/lib/backend";
import { resolveSessionTtlSeconds } from "@/lib/cookie-options";
import {
  isRequestSecurityError,
  requireSameOrigin,
} from "@/lib/security";
import { problemResponse } from "@/lib/problem-response";

export async function POST(request: Request) {
  const instance = new URL(request.url).pathname;

  try {
    requireSameOrigin(request);
  } catch (error) {
    if (isRequestSecurityError(error)) {
      return problemResponse(error.status, error.code, error.title, error.detail, instance);
    }

    throw error;
  }

  const body = await readJson<SignupPayload>(request);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "El cuerpo del request es inválido." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(buildBackendUrl("/tenants/signup"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await readJson<SignupResultPayload | ProblemPayload>(backendResponse);
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: resolveErrorMessage(payload, "No pudimos completar el onboarding."),
        },
        { status: backendResponse.status },
      );
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      !("accessToken" in payload) ||
      !("tenantId" in payload) ||
      !("branchId" in payload) ||
      !("userId" in payload)
    ) {
      return NextResponse.json(
        { ok: false, error: "El backend devolvió una respuesta incompleta." },
        { status: 502 },
      );
    }

    const response = NextResponse.json(
      {
        ok: true,
        tenantId: payload.tenantId,
        branchId: payload.branchId,
        userId: payload.userId,
      },
      { status: 201 },
    );

    const maxAgeSeconds = resolveSessionTtlSeconds(payload.expiresIn);
    setAuthCookie(response, payload.accessToken, maxAgeSeconds);
    setCsrfCookie(response, createCsrfToken(), maxAgeSeconds);
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "El backend no está disponible en este momento." },
      { status: 502 },
    );
  }
}
