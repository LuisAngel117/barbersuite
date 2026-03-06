import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  cookieSecureEnabled,
  DEFAULT_SESSION_TTL_SECONDS,
} from "@/lib/cookie-options";

export const CSRF_COOKIE = "bs_csrf";

const csrfCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: cookieSecureEnabled(),
  path: "/",
};

export function createCsrfToken() {
  return randomBytes(32).toString("hex");
}

export function setCsrfCookie(
  response: NextResponse,
  csrfToken: string,
  maxAgeSeconds = DEFAULT_SESSION_TTL_SECONDS,
) {
  response.cookies.set(CSRF_COOKIE, csrfToken, {
    ...csrfCookieOptions,
    maxAge: maxAgeSeconds,
  });
}

export function clearCsrfCookie(response: NextResponse) {
  response.cookies.set(CSRF_COOKIE, "", {
    ...csrfCookieOptions,
    maxAge: 0,
  });
}
