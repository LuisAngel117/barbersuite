import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";
import { BRANCH_COOKIE } from "@/lib/branch-cookie";
import { buildBackendUrl } from "@/lib/backend";
import { problemResponse } from "@/lib/problem-response";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type ForwardJsonOptions = {
  method: string;
  path: string;
  request?: Request;
  body?: BodyInit | null;
  extraHeaders?: HeadersInit;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getTokenFromCookies(cookieStore?: CookieReader) {
  const store = cookieStore ?? (await cookies());
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getBranchIdFromCookies(cookieStore?: CookieReader) {
  const store = cookieStore ?? (await cookies());
  return store.get(BRANCH_COOKIE)?.value ?? null;
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export async function requireBranchIdOrProblem(request: Request) {
  const branchId = await getBranchIdFromCookies();
  const instance = new URL(request.url).pathname;

  if (!branchId) {
    return {
      branchId: null,
      response: problemResponse(
        400,
        "BRANCH_REQUIRED",
        "Bad Request",
        "Header X-Branch-Id is required for this endpoint.",
        instance,
      ),
    };
  }

  if (!isUuid(branchId)) {
    return {
      branchId: null,
      response: problemResponse(
        400,
        "VALIDATION_ERROR",
        "Bad Request",
        "Header X-Branch-Id must be a valid UUID.",
        instance,
      ),
    };
  }

  return {
    branchId,
    response: null,
  };
}

export async function forwardJson({
  method,
  path,
  request,
  body,
  extraHeaders,
}: ForwardJsonOptions) {
  const headers = new Headers(extraHeaders);
  const accessToken = await getTokenFromCookies();
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  let requestBody = body;
  if (request && requestBody === undefined && method !== "GET" && method !== "HEAD") {
    requestBody = await request.text();
    const contentType = request.headers.get("content-type");
    if (contentType && !headers.has("content-type")) {
      headers.set("content-type", contentType);
    }
  }

  const backendResponse = await fetch(buildBackendUrl(path), {
    method,
    headers,
    body: requestBody,
    cache: "no-store",
  });

  const forwardedHeaders = new Headers();
  for (const headerName of ["content-type", "www-authenticate", "location"]) {
    const headerValue = backendResponse.headers.get(headerName);
    if (headerValue) {
      forwardedHeaders.set(headerName, headerValue);
    }
  }

  return new NextResponse(await backendResponse.text(), {
    status: backendResponse.status,
    headers: forwardedHeaders,
  });
}
