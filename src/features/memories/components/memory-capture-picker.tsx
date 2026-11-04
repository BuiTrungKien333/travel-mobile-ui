import { useState } from "react";
import { z } from "zod";
import { FlatList, Modal, Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { MemoryEmpty, MemoryIconButton, MemoryPage } from "./memory-primitives";
import { useMemoryTrips } from "../hooks/use-memories";
import { MemoryLoadState } from "./memory-load-state";
import { getMemoryCaptureDays } from "../utils/memory-albums";
import { useCreateServerTrip } from "@/features/trip/hooks/use-create-server-trip";
import { currentCalendarDate } from "@/utils/calendar-date";

export function MemoryCapturePicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (params: { tripId: string; day: string; stopId: string }) => void;
}) {
  const theme = useAppTheme();
  const reducedMotion = useReducedMotion();
  const { copy, locale } = useMemoriesCopy();
  const library = useMemoryTrips();
  const { trips } = library;
  const openPanel = useTripPreview((state) => state.openPanel);
  const linkTrip = useTripPreview((state) => state.linkTrip);
  const sync = useCreateServerTrip();
  const [syncError, setSyncError] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const today = currentCalendarDate();
  const trip = trips.find((item) => item.id === tripId);
  const options = trip && getMemoryCaptureDays(trip, today).flatMap((day) => [
    {
      id: `${day.date}:general`,
      day: day.date,
      stopId: "",
      title: copy.chooseDay,
    },
    ...day.stops.map((stop) => ({
      id: `${day.date}:${stop.id}`,
      day: day.date,
      stopId: stop.id,
      title: stop.name[locale],
    })),
  ]);
  return (
    <Modal
      visible
      animationType={reducedMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      <View
        role="dialog"
        aria-modal
        accessibilityViewIsModal
        accessibilityLabel={trip ? copy.choosePlace : copy.chooseTrip}
        onAccessibilityEscape={onClose}
        style={{ flex: 1 }}
      >
        <MemoryPage
          title={trip ? copy.choosePlace : copy.chooseTrip}
          subtitle={trip ? getTripTitle(trip, locale) : copy.chooseHint}
          onBack={() => (trip ? setTripId(null) : onClose())}
          action={
            <MemoryIconButton
              icon="close"
              label={copy.close}
              onPress={onClose}
            />
          }
        >
          <MemoryLoadState loading={library.isPending} error={library.isError} onRetry={() => void library.refetch()} />
          {syncError ? <AppText accessibilityRole="alert" tone="error" style={{ padding: theme.spacing.lg }}>{copy.tripSyncError}</AppText> : null}
          {sync.isPending ? <AppText accessibilityLiveRegion="polite" style={{ padding: theme.spacing.lg }}>{copy.syncingTrip}</AppText> : null}
          {trip ? (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                padding: theme.spacing.lg,
                gap: theme.spacing.sm,
                maxWidth: theme.layout.contentMaxWidth,
                width: "100%",
                alignSelf: "center",
              }}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    onSelect({
                      tripId: trip.id,
                      day: item.day,
                      stopId: item.stopId,
                    })
                  }
                  style={({ pressed }) => ({
                    padding: theme.spacing.lg,
                    minHeight: theme.layout.touchTarget,
                    borderRadius: theme.radius.xl,
                    backgroundColor: pressed
                      ? theme.colors.softActionPressed
                      : theme.colors.surfaceTint,
                    gap: theme.spacing.xs,
                  })}
                >
                  <AppText variant="label">{item.title}</AppText>
                  <AppText variant="caption" tone="muted">
                    {item.day}
                  </AppText>
                </Pressable>
              )}
            />
          ) : (
            <FlatList
              data={trips.filter(
                (item) => item.status !== "cancelled",
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                padding: theme.spacing.lg,
                gap: theme.spacing.sm,
                maxWidth: theme.layout.contentMaxWidth,
                width: "100%",
                alignSelf: "center",
              }}
              ListEmptyComponent={
                !library.isPending && !library.isError ? <MemoryEmpty title={copy.emptyTrips} hint={copy.emptyTripsHint}>
                  <AppButton
                    onPress={() => {
                      onClose();
                      openPanel({ kind: "create" });
                    }}
                  >
                    {copy.createTrip}
                  </AppButton>
                </MemoryEmpty> : null
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: sync.isPending }}
                  disabled={sync.isPending}
                  onPress={() => {
                    setSyncError(false);
                    if (z.guid().safeParse(item.id).success) {
                      setTripId(item.id);
                      return;
                    }
                    void sync.mutateAsync({ localId: item.id, trip: item })
                      .then(async (id) => {
                        await linkTrip(item.id, id);
                        setTripId(id);
                      })
                      .catch(() => setSyncError(true));
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.md,
                    minHeight: theme.layout.touchTarget,
                    padding: theme.spacing.lg,
                    borderRadius: theme.radius.xl,
                    backgroundColor: pressed
                      ? theme.colors.softActionPressed
                      : theme.colors.surfaceTint,
                  })}
                >
                  <AppIcon name="compass" variant="outline" />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">
                      {getTripTitle(item, locale)}
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      {item.destination}
                    </AppText>
                  </View>
                  <AppIcon name="chevron" variant="light" />
                </Pressable>
              )}
            />
          )}
        </MemoryPage>
      </View>
    </Modal>
  );
}
