export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60;
export const BRANCH_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

export function cookieSecureEnabled() {
  if (process.env.COOKIE_SECURE) {
    return process.env.COOKIE_SECURE === "true";
  }

  return process.env.NODE_ENV === "production";
}

export function resolveSessionTtlSeconds(candidate?: number | null) {
  if (typeof candidate !== "number" || !Number.isFinite(candidate) || candidate <= 0) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  return Math.floor(candidate);
}
