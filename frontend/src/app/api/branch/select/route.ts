import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setBranchCookie } from "@/lib/branch-cookie";
import { isUuid } from "@/lib/bff";
import { readJson } from "@/lib/backend";
import { problemResponse } from "@/lib/problem-response";
import {
  isRequestSecurityError,
  requireCsrf,
  requireSameOrigin,
} from "@/lib/security";

type SelectBranchPayload = {
  branchId?: string;
};

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

  const payload = await readJson<SelectBranchPayload>(request);

  if (!payload || !payload.branchId) {
    return problemResponse(
      400,
      "VALIDATION_ERROR",
      "Bad Request",
      "branchId is required.",
      instance,
    );
  }

  if (!isUuid(payload.branchId)) {
    return problemResponse(
      400,
      "VALIDATION_ERROR",
      "Bad Request",
      "branchId must be a valid UUID.",
      instance,
    );
  }

  const response = NextResponse.json({ ok: true });
  setBranchCookie(response, payload.branchId);
  return response;
}
