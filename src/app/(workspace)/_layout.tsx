import { Stack } from "expo-router";
import { PreviewPanels } from "@/features/home/components/preview-panels";
import { TripPreviewProvider } from "@/features/home/providers/trip-preview-provider";
import { useAppTheme } from "@/hooks/use-app-theme";

/** One session store across the tabs and pushed trip screens, inside the auth guard. */
export default function WorkspaceLayout() {
  const theme = useAppTheme();
  return (
    <TripPreviewProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="tabs" />
        <Stack.Screen name="trip/[tripId]" />
        <Stack.Screen name="trip/add-places" />
        <Stack.Screen name="trip/place-details" />
      </Stack>
      <PreviewPanels />
    </TripPreviewProvider>
  );
}
