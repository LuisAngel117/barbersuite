import { NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth-cookie";
import {
  buildBackendUrl,
  readJson,
  resolveErrorMessage,
  type LoginProxyPayload,
  type ProblemPayload,
  type TokenPayload,
} from "@/lib/backend";

export async function POST(request: Request) {
  const body = await readJson<LoginProxyPayload>(request);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "El cuerpo del request es inválido." },
      { status: 400 },
    );
  }

  if (!body.tenantId || !body.email || !body.password) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Tenant ID, email y password son obligatorios. El backend actual todavía requiere tenantId para login.",
      },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(buildBackendUrl("/auth/login"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await readJson<TokenPayload | ProblemPayload>(backendResponse);
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: resolveErrorMessage(payload, "No pudimos iniciar sesión."),
        },
        { status: backendResponse.status },
      );
    }

    if (!payload || typeof payload !== "object" || !("accessToken" in payload)) {
      return NextResponse.json(
        { ok: false, error: "El backend no devolvió un token válido." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ ok: true });
    setAuthCookie(response, payload.accessToken);
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "El backend no está disponible en este momento." },
      { status: 502 },
    );
  }
}
