import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth-cookie";
import { clearBranchCookie } from "@/lib/branch-cookie";
import { clearCsrfCookie } from "@/lib/csrf-cookie";
import { problemResponse } from "@/lib/problem-response";
import {
  isRequestSecurityError,
  requireCsrf,
  requireSameOrigin,
} from "@/lib/security";

export async function GET(request: Request) {
  return problemResponse(
    405,
    "METHOD_NOT_ALLOWED",
    "Method not allowed",
    "Use POST /api/auth/logout for this operation.",
    new URL(request.url).pathname,
  );
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const instance = new URL(request.url).pathname;

  try {
    requireSameOrigin(request);
    requireCsrf(request, cookieStore);
  } catch (error) {
    if (isRequestSecurityError(error)) {
      return problemResponse(error.status, error.code, error.title, error.detail, instance);
    }

    throw error;
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  clearBranchCookie(response);
  clearCsrfCookie(response);
  return response;
}
