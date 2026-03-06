import { NextResponse } from "next/server";
import { setBranchCookie } from "@/lib/branch-cookie";
import { isUuid, problemResponse } from "@/lib/bff";
import { readJson } from "@/lib/backend";

type SelectBranchPayload = {
  branchId?: string;
};

export async function POST(request: Request) {
  const payload = await readJson<SelectBranchPayload>(request);
  const instance = new URL(request.url).pathname;

  if (!payload || !payload.branchId) {
    return problemResponse(
      400,
      "Bad Request",
      "branchId is required.",
      "VALIDATION_ERROR",
      instance,
    );
  }

  if (!isUuid(payload.branchId)) {
    return problemResponse(
      400,
      "Bad Request",
      "branchId must be a valid UUID.",
      "VALIDATION_ERROR",
      instance,
    );
  }

  const response = NextResponse.json({ ok: true });
  setBranchCookie(response, payload.branchId);
  return response;
}
