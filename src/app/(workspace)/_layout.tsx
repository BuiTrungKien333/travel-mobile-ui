import { Stack } from "expo-router";
import { PreviewPanels } from "@/features/home/components/preview-panels";
import { TripPreviewProvider } from "@/features/home/providers/trip-preview-provider";
import { useAppTheme } from "@/hooks/use-app-theme";

export { RouteErrorScreen as ErrorBoundary } from "@/components/common/route-error-screen";

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
        <Stack.Screen name="memories/history" />
        <Stack.Screen
          name="memories/quick-capture"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="memories/saved-later" />
        <Stack.Screen name="memories/[tripId]" />
        <Stack.Screen name="memories/photo/[memoryId]" />
        <Stack.Screen
          name="trip/camera"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
      <PreviewPanels />
    </TripPreviewProvider>
  );
}
