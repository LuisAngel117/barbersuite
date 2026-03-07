import { cookies } from "next/headers";
import { forwardJson } from "@/lib/bff";
import { problemResponse } from "@/lib/problem-response";
import {
  isRequestSecurityError,
  requireCsrf,
  requireSameOrigin,
} from "@/lib/security";

export async function GET() {
  return forwardJson({
    method: "GET",
    path: "/branches",
  });
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

  return forwardJson({
    method: "POST",
    path: "/branches",
    request,
  });
}
