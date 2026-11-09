import { requireOptionalNativeModule } from "expo";
import { router } from "expo-router";
import { BottomTabBarHeightContext } from "expo-router/js-tabs";
import { lazy, Suspense, useContext, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { CameraLayout } from "@/features/camera/components/camera-layout";
import { useCameraCopy } from "@/features/camera/i18n/camera-copy";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MemoryCapturePicker } from "../components/memory-capture-picker";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { getMemoryCaptureTarget } from "../utils/memory-albums";
import { useMemories } from "../hooks/use-memories";
import { todayCalendarDate } from "@/utils/calendar-date";
import { MemoryLoadState } from "../components/memory-load-state";

const NativeMemoryCamera = lazy(async () => {
  const { NativeTripCamera } =
    await import("@/features/camera/components/native-trip-camera");
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
  const library = useMemories();
  const { trips, memories } = library;
  const today = todayCalendarDate();
  const [choosing, setChoosing] = useState(false);
  const target =
    params.quick && !params.tripId
      ? null
      : getMemoryCaptureTarget(trips, today, params);
  const history = () => router.push("/memories/history");
  const props = {
    title: target ? getTripTitle(target.trip, locale) : copy.chooseTrip,
    subtitle: target
      ? `${target.stop?.name[locale] ?? copy.noPlace} · ${target.day.date}`
      : copy.cameraHint,
    count: target
      ? memories.filter(
          (item) => item.tripId === target.trip.id && !!item.photo,
        ).length
      : params.quick
        ? memories.filter((item) => !!item.local && !item.tripId).length
        : memories.filter((item) => !!item.photo).length,
    embeddedBottomInset: params.quick ? undefined : (bottomInset ?? undefined),
    journalLabel: params.quick && !target ? cameraCopy.later : copy.history,
    onSelectTrip: () => setChoosing(true),
    onBack: () =>
      router.canGoBack() ? router.back() : router.navigate("/tabs"),
    onHome: () => router.navigate("/tabs"),
    onDetails: target
      ? () =>
          router.push({
            pathname: "/trip/[tripId]",
            params: { tripId: target.trip.id, day: target.day.date },
          })
      : () => router.navigate("/tabs/trips"),
    onJournal:
      params.quick && !target
        ? () => router.push("/memories/saved-later")
        : history,
  };
  const available =
    Platform.OS === "web" || !!requireOptionalNativeModule("ExpoCamera");
  const loadingTarget =
    (!!params.tripId || !params.quick) &&
    (library.isPending || library.isError);
  const invalidTarget =
    !!(params.tripId || params.day || params.stopId) && !target;
  return (
    <>
      {available && !loadingTarget && !invalidTarget ? (
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
            quick={params.quick && !target}
            requestOnOpen={params.quick}
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
            loadingTarget ? (
              <MemoryLoadState
                loading={library.isPending}
                error={library.isError}
                onRetry={() => void library.refetch()}
              />
            ) : invalidTarget ? (
              <View
                style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
              >
                <AppText
                  accessibilityRole="alert"
                  style={{ color: theme.colors.photoViewerText }}
                >
                  {cameraCopy.missing}
                </AppText>
                <AppButton onPress={() => setChoosing(true)}>
                  {copy.chooseTrip}
                </AppButton>
              </View>
            ) : (
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
            )
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
