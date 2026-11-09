import { Stack } from "expo-router";

export { RouteErrorScreen as ErrorBoundary } from "@/components/common/route-error-screen";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        headerShown: false,
      }}
    />
  );
}
