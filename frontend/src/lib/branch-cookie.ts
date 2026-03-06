import { NextResponse } from "next/server";

export const BRANCH_COOKIE = "bs_branch_id";

const branchCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
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
