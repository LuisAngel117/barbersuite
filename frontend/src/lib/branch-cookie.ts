import { NextResponse } from "next/server";
import {
  BRANCH_COOKIE_TTL_SECONDS,
  cookieSecureEnabled,
} from "@/lib/cookie-options";

export const BRANCH_COOKIE = "bs_branch_id";

const branchCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: cookieSecureEnabled(),
  path: "/",
};

export function setBranchCookie(response: NextResponse, branchId: string) {
  response.cookies.set(BRANCH_COOKIE, branchId, {
    ...branchCookieOptions,
    maxAge: BRANCH_COOKIE_TTL_SECONDS,
  });
}

export function clearBranchCookie(response: NextResponse) {
  response.cookies.set(BRANCH_COOKIE, "", {
    ...branchCookieOptions,
    maxAge: 0,
  });
}
