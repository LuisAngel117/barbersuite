import { NextResponse } from "next/server";
import {
  cookieSecureEnabled,
  DEFAULT_SESSION_TTL_SECONDS,
} from "@/lib/cookie-options";

export const ACCESS_TOKEN_COOKIE = "bs_access_token";

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: cookieSecureEnabled(),
  path: "/",
};

export function setAuthCookie(
  response: NextResponse,
  accessToken: string,
  maxAgeSeconds = DEFAULT_SESSION_TTL_SECONDS,
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...authCookieOptions,
    maxAge: maxAgeSeconds,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...authCookieOptions,
    maxAge: 0,
  });
}
