import { requireOptionalNativeModule } from "expo";
import { router } from "expo-router";
import { Platform, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripQuery, useTripPlacesQuery } from "@/features/trip/api/trip-hooks";
import { useTripItineraryQuery } from "@/features/trip/api/itinerary-hooks";
import { toTrip } from "@/features/trip/api/trip-adapters";
import { useMemoriesQuery } from "@/features/home/api/memory-hooks";
import { todayCalendarDate } from "@/utils/calendar-date";
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
  const tripQuery = useTripQuery(tripId);
  const placesQuery = useTripPlacesQuery(tripId);
  const itineraryQuery = useTripItineraryQuery(tripId);
  const memoriesQuery = useMemoriesQuery(tripId);
  const trip = tripQuery.data
    ? toTrip(tripQuery.data, placesQuery.data ?? [], itineraryQuery.data)
    : undefined;
  const count = memoriesQuery.data?.content.reduce((total, memory) => total + memory.mediaCount, 0) ?? 0;
  const today = todayCalendarDate();
  const date = day ?? today;
  if (tripQuery.isPending || placesQuery.isPending || itineraryQuery.isPending)
    return <ScreenSafeArea style={{ flex: 1, justifyContent: "center", backgroundColor: theme.colors.photoViewerBackdrop }}><AppText style={{ color: theme.colors.photoViewerText, textAlign: "center" }}>{copy.ready}</AppText></ScreenSafeArea>;
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
    onJournal: () => router.push("/tabs/memories"),
  };
  const available =
    Platform.OS === "web" ||
    ["ExpoCamera", "ExpoImageManipulator", "ExponentImagePicker"].every(
      (name) => !!requireOptionalNativeModule(name),
    );
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
