import { NextResponse } from "next/server";

export const BRANCH_COOKIE = "bs_branch_id";

function cookieSecureEnabled() {
  return process.env.COOKIE_SECURE === "true";
}

const branchCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: cookieSecureEnabled(),
  path: "/",
};

export function setBranchCookie(response: NextResponse, branchId: string) {
  response.cookies.set(BRANCH_COOKIE, branchId, branchCookieOptions);
}

export function clearBranchCookie(response: NextResponse) {
  response.cookies.set(BRANCH_COOKIE, "", {
    ...branchCookieOptions,
    maxAge: 0,
  });
}
