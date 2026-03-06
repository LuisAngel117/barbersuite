import { CSRF_COOKIE } from "@/lib/csrf-cookie";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

class RequestSecurityError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly detail: string;

  constructor(status: number, code: string, title: string, detail: string) {
    super(detail);
    this.status = status;
    this.code = code;
    this.title = title;
    this.detail = detail;
  }
}

export class OriginForbiddenError extends RequestSecurityError {
  constructor() {
    super(
      403,
      "ORIGIN_FORBIDDEN",
      "Origin forbidden",
      "This request origin is not allowed for the current application origin.",
    );
  }
}

export class CsrfRequiredError extends RequestSecurityError {
  constructor() {
    super(
      403,
      "CSRF_REQUIRED",
      "CSRF token required",
      "The X-CSRF-Token header and bs_csrf cookie are required for this request.",
    );
  }
}

export class CsrfFailedError extends RequestSecurityError {
  constructor() {
    super(
      403,
      "CSRF_FAILED",
      "CSRF token mismatch",
      "The provided CSRF token did not match the current session cookie.",
    );
  }
}

export function isRequestSecurityError(error: unknown): error is RequestSecurityError {
  return error instanceof RequestSecurityError;
}

export function getAppOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (forwardedHost) {
    return `${forwardedProto ?? url.protocol.replace(":", "")}://${forwardedHost}`;
  }

  return url.origin;
}

export function requireSameOrigin(request: Request) {
  const appOrigin = getAppOrigin(request);
  const originHeader = request.headers.get("origin");

  if (originHeader && originHeader !== appOrigin) {
    throw new OriginForbiddenError();
  }

  if (!originHeader) {
    const refererHeader = request.headers.get("referer");
    if (refererHeader) {
      try {
        if (new URL(refererHeader).origin !== appOrigin) {
          throw new OriginForbiddenError();
        }
      } catch {
        throw new OriginForbiddenError();
      }
    }
  }
}

export function requireCsrf(request: Request, cookieStore: CookieReader) {
  const csrfCookie = cookieStore.get(CSRF_COOKIE)?.value ?? null;
  const csrfHeader = request.headers.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader) {
    throw new CsrfRequiredError();
  }

  if (csrfCookie !== csrfHeader) {
    throw new CsrfFailedError();
  }
}
