import { requireOptionalNativeModule } from "expo";
import { router } from "expo-router";
import { BottomTabBarHeightContext } from "expo-router/js-tabs";
import { lazy, Suspense, useContext, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { CameraLayout } from "@/features/camera/components/camera-layout";
import { useCameraCopy } from "@/features/camera/i18n/camera-copy";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MemoryCapturePicker } from "../components/memory-capture-picker";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { getMemoryCaptureTarget } from "../utils/memory-albums";

const NativeMemoryCamera = lazy(async () => {
  const { NativeTripCamera } = await import(
    "@/features/camera/components/native-trip-camera"
  );
  return { default: NativeTripCamera };
});

export function MemoriesCameraScreen(params: {
  tripId?: string;
  day?: string;
  stopId?: string;
  quick?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const { copy: cameraCopy } = useCameraCopy();
  const bottomInset = useContext(BottomTabBarHeightContext);
  const trips = useTripPreview((state) => state.trips);
  const today = useTripPreview((state) => state.today);
  const memories = useTripPreview((state) => state.memories);
  const [choosing, setChoosing] = useState(false);
  const target = params.quick
    ? null
    : getMemoryCaptureTarget(trips, today, params);
  const history = () => router.push("/memories/history");
  const props = {
    title: params.quick
      ? cameraCopy.quick
      : target
        ? getTripTitle(target.trip, locale)
        : copy.chooseTrip,
    subtitle: params.quick
      ? cameraCopy.quickHint
      : target
        ? `${target.stop?.name[locale] ?? copy.noPlace} · ${target.day.date}`
        : copy.cameraHint,
    count: params.quick
      ? memories.filter(
          (item) =>
            item.local &&
            (!item.tripId || !trips.some((trip) => trip.id === item.tripId)),
        ).length
      : memories.filter((item) => !!item.photo).length,
    embeddedBottomInset: bottomInset ?? undefined,
    journalLabel: params.quick ? cameraCopy.later : copy.history,
    onSelectTrip: params.quick ? undefined : () => setChoosing(true),
    onBack: () =>
      router.canGoBack() ? router.back() : router.navigate("/tabs"),
    onHome: () => router.navigate("/tabs"),
    onDetails: history,
    onJournal: params.quick
      ? () => router.push("/memories/saved-later")
      : history,
  };
  const available =
    Platform.OS === "web" || !!requireOptionalNativeModule("ExpoCamera");
  return (
    <>
      {available ? (
        <Suspense
          fallback={
            <CameraLayout
              {...props}
              frame={
                <ActivityIndicator
                  style={{ flex: 1 }}
                  color={theme.colors.primary}
                />
              }
            />
          }
        >
          <NativeMemoryCamera
            {...props}
            quick={params.quick}
            suspended={choosing}
            tripId={target?.trip.id}
            date={target?.day.date ?? today}
            stopId={target?.stop?.id}
          />
        </Suspense>
      ) : (
        <CameraLayout
          {...props}
          frame={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                padding: theme.spacing.xl,
                gap: theme.spacing.md,
              }}
            >
              <AppText
                variant="label"
                style={{
                  color: theme.colors.photoViewerText,
                  textAlign: "center",
                }}
              >
                {cameraCopy.build}
              </AppText>
              <AppText
                style={{
                  color: theme.colors.photoViewerMuted,
                  textAlign: "center",
                }}
              >
                {cameraCopy.buildHint}
              </AppText>
            </View>
          }
        />
      )}
      {choosing ? (
        <MemoryCapturePicker
          onClose={() => setChoosing(false)}
          onSelect={(selection) => {
            router.setParams(selection);
            setChoosing(false);
          }}
        />
      ) : null}
    </>
  );
}
