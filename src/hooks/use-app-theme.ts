import { useTheme } from "expo-router/react-navigation";

import type { AppTheme } from "@/theme";

export function useAppTheme(): AppTheme {
  return useTheme() as AppTheme;
}

