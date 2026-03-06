import { cookies } from "next/headers";
import { forwardJson, requireBranchIdOrProblem } from "@/lib/bff";
import { problemResponse } from "@/lib/problem-response";
import {
  isRequestSecurityError,
  requireCsrf,
  requireSameOrigin,
} from "@/lib/security";

type RouteContext = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { clientId } = await context.params;
  const { branchId, response } = await requireBranchIdOrProblem(request);
  if (response) {
    return response;
  }

  return forwardJson({
    method: "GET",
    path: `/clients/${clientId}`,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { clientId } = await context.params;
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

  return forwardJson({
    method: "PATCH",
    path: `/clients/${clientId}`,
    request,
    extraHeaders: {
      "X-Branch-Id": branchId,
    },
  });
}
