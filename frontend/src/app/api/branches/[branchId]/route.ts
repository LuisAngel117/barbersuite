import { cookies } from "next/headers";
import { forwardJson } from "@/lib/bff";
import { problemResponse } from "@/lib/problem-response";
import {
  isRequestSecurityError,
  requireCsrf,
  requireSameOrigin,
} from "@/lib/security";

type RouteContext = {
  params: Promise<{
    branchId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { branchId } = await context.params;

  return forwardJson({
    method: "GET",
    path: `/branches/${branchId}`,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const { branchId } = await context.params;

  return forwardJson({
    method: "PATCH",
    path: `/branches/${branchId}`,
    request,
  });
}
