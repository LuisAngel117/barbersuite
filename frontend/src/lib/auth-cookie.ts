import { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "bs_access_token";

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setAuthCookie(response: NextResponse, accessToken: string) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, authCookieOptions);
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...authCookieOptions,
    maxAge: 0,
  });
}
