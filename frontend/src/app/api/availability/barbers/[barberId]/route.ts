import { cookies } from "next/headers";
import { forwardJson, requireBranchIdOrProblem } from "@/lib/bff";
import { problemResponse } from "@/lib/problem-response";
import {
  isRequestSecurityError,
  requireCsrf,
  requireSameOrigin,
} from "@/lib/security";

export async function PUT(request: Request, context: { params: Promise<{ barberId: string }> }) {
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

  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  const { barberId } = await context.params;
  return forwardJson({
    method: "PUT",
    path: `/availability/barbers/${barberId}`,
    request,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
