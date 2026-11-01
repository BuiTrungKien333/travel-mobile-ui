import { requireOptionalNativeModule } from "expo";
import { router } from "expo-router";
import { Platform, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { CameraLayout } from "../components/camera-layout";
import { useCameraCopy } from "../i18n/camera-copy";

function back() {
  if (router.canGoBack()) router.back();
  else router.replace("/tabs");
}

/** Native-module check happens before evaluating camera imports, for older development builds. */
export function TripCameraScreen({
  tripId,
  day,
  stopId,
}: {
  tripId?: string;
  day?: string;
  stopId?: string;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useCameraCopy();
  const trip = useTripPreview((state) =>
    state.trips.find((entry) => entry.id === tripId),
  );
  const today = useTripPreview((state) => state.today);
  const count = useTripPreview(
    (state) =>
      state.memories.filter((entry) => entry.tripId === tripId && !!entry.photo)
        .length,
  );
  const openPanel = useTripPreview((state) => state.openPanel);
  const date = day ?? today;
  if (
    !trip ||
    trip.status === "cancelled" ||
    !trip.days.some((entry) => entry.date === date)
  )
    return (
      <ScreenSafeArea
        style={{ flex: 1, backgroundColor: theme.colors.photoViewerBackdrop }}
      >
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <AppText style={{ color: theme.colors.photoViewerText }}>
            {copy.missing}
          </AppText>
          <AppButton variant="gradient" onPress={back}>
            {copy.back}
          </AppButton>
        </View>
      </ScreenSafeArea>
    );
  const props = {
    title: getTripTitle(trip, locale),
    count,
    onBack: back,
    onHome: () => router.dismissTo("/tabs"),
    onDetails: () =>
      router.dismissTo({
        pathname: "/trip/[tripId]",
        params: { tripId: trip.id, day: date },
      }),
    onJournal: () => openPanel({ kind: "journal", tripId: trip.id }),
  };
  const available =
    Platform.OS === "web" ||
    !!requireOptionalNativeModule("ExpoCamera");
  if (!available)
    return (
      <CameraLayout
        {...props}
        frame={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
            }}
          >
            <AppIcon
              name="camera"
              size={theme.layout.iconLarge}
              color={theme.colors.primary}
            />
            <AppText
              variant="label"
              style={{
                color: theme.colors.photoViewerText,
                textAlign: "center",
              }}
            >
              {copy.build}
            </AppText>
            <AppText
              variant="caption"
              style={{
                color: theme.colors.photoViewerMuted,
                textAlign: "center",
              }}
            >
              {copy.buildHint}
            </AppText>
          </View>
        }
      />
    );
  const native: typeof import("../components/native-trip-camera") = require("../components/native-trip-camera");
  return (
    <native.NativeTripCamera
      key={`${trip.id}:${date}`}
      {...props}
      tripId={trip.id}
      date={date}
      stopId={stopId}
    />
  );
}
