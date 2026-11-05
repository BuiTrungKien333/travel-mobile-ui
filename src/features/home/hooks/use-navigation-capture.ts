import { router } from "expo-router";

export function useNavigationCapture() {
  return () => router.push("/memories/quick-capture");
}
