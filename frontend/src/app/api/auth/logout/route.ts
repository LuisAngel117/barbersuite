import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-cookie";
import { clearBranchCookie } from "@/lib/branch-cookie";
import { buildPublicUrl } from "@/lib/public-url";

export async function GET(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next") || "/login";
  const response = NextResponse.redirect(buildPublicUrl(request, nextPath));
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
