import { create } from "zustand";
import type { AuthStatus } from "@/features/auth/types/auth-types";

export const useAuthStore = create<{ status: AuthStatus }>(() => ({
  status: "restoring",
}));
