import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/api/api-error";
import type { UpdateProfile } from "../types/auth-types";

import { useAuthStore } from "@/store/use-auth-store";
import { authApi } from "../api/auth-api";
import { authQueryKeys } from "../api/auth-query-keys";
import type { LoginFormValues } from "../schemas/auth-schemas";
import { authSession } from "../services/auth-session";

export function useLogin() {
  return useMutation({
    mutationFn: (values: LoginFormValues) =>
      authSession.authenticate(() => authApi.login(values)),
  });
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register });
}

export function useLogout() {
  return useMutation({ mutationFn: authSession.logout });
}

export function useEmailRequest(purpose: "verify" | "reset") {
  return useMutation({
    mutationFn: (email: string) => authApi.requestEmail(email, purpose),
  });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: authApi.verifyEmail });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (values: { token: string; password: string }) => {
      await authApi.resetPassword(values);
      await authSession.expire();
    },
  });
}

export function useProfile() {
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );

  return useQuery({
    queryKey: authQueryKeys.profile,
    queryFn: ({ signal }) => authApi.profile(signal),
    enabled: authenticated,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (values: UpdateProfile) => {
      const version = authSession.getVersion();
      const user = await authApi.updateProfile(values);
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
      return user;
    },
    onSuccess: (user) => {
      client.setQueryData(authQueryKeys.profile, user);
    },
  });
}
