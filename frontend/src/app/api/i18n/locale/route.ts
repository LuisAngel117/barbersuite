import { NextResponse } from "next/server";
import { cookieSecureEnabled } from "@/lib/cookie-options";
import { problemResponse } from "@/lib/problem-response";
import { readJson } from "@/lib/backend";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_TTL_SECONDS,
  isSupportedLocale,
} from "@/i18n/config";

type LocalePayload = {
  locale?: string;
};

export async function POST(request: Request) {
  const payload = await readJson<LocalePayload>(request);
  const instance = new URL(request.url).pathname;

  if (!payload || !isSupportedLocale(payload.locale)) {
    return problemResponse(
      400,
      "VALIDATION_ERROR",
      "Validation error",
      "Locale must be one of: es, en.",
      instance,
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE, payload.locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: cookieSecureEnabled(),
    path: "/",
    maxAge: LOCALE_COOKIE_TTL_SECONDS,
  });

  return response;
}
