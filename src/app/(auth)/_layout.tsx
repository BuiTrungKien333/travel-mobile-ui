import { Stack } from "expo-router";
import { useMotionPreference } from "@/hooks/use-motion-preference";

export default function AuthLayout() {
  const reducedMotion = useMotionPreference();
  return (
    <Stack
      screenOptions={{
        animation: reducedMotion ? "none" : "slide_from_right",
        headerShown: false,
      }}
    />
  );
}
