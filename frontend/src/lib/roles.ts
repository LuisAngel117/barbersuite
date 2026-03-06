import type { AppRole } from "@/config/app-nav";

export function hasAnyRole(roles: readonly string[], allowedRoles: readonly AppRole[]) {
  return allowedRoles.some((role) => roles.includes(role));
}
