import type { AuthUser } from "../types/auth-types";

export function canUseWorkspace(
  user: Pick<AuthUser, "role"> | null | undefined,
) {
  return user?.role === "USER" || user?.role === "ADMIN";
}

export function canAdminister(user: Pick<AuthUser, "role"> | null | undefined) {
  return user?.role === "ADMIN";
}
