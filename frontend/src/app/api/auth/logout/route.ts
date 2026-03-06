import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-cookie";
import { clearBranchCookie } from "@/lib/branch-cookie";

export async function GET(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next") || "/login";
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  clearAuthCookie(response);
  clearBranchCookie(response);
  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  clearBranchCookie(response);
  return response;
}
