import { SessionGate } from "@/features/auth/components/session-gate";
import { useAuthStore } from "@/store/use-auth-store";
import { Redirect } from "expo-router";

export default function IndexRoute() {
  const status = useAuthStore((state) => state.status);
  if (status === "restoring" || status === "restore-error")
    return <SessionGate failed={status === "restore-error"} />;
  return (
    <Redirect
      href={status === "authenticated" ? "/tabs/profile" : "/(auth)/login"}
    />
  );
}
