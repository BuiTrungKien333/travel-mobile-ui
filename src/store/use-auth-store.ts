import { create } from "zustand";
import type { AuthStatus, AuthUser } from "@/features/auth/types/auth-types";

export const useAuthStore = create<{
  status: AuthStatus;
  user: AuthUser | null;
}>(() => ({
  status: "restoring",
  user: null,
}));
