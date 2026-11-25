import { canUseWorkspace } from "@/features/auth/utils/authorization";
import { SessionGate } from "@/features/auth/components/session-gate";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { useAuthStore } from "@/store/use-auth-store";
import { Redirect } from "expo-router";

export default function IndexRoute() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  if (UI_PREVIEW_ENABLED) return <Redirect href="/tabs" />;
  if (status === "restoring" || status === "restore-error")
    return <SessionGate failed={status === "restore-error"} />;

  return (
    <Redirect
      href={
        status === "authenticated"
          ? canUseWorkspace(user)
            ? "/tabs"
            : "/explore"
          : "/(auth)/login"
      }
    />
  );
}
