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
    kind: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
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

  const { kind } = await context.params;

  return forwardJson({
    method: "PUT",
    path: `/notifications/email/templates/${kind}`,
    request,
  });
}
