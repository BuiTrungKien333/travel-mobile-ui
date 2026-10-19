import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { suggestedStops } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { HomeScenario, Trip } from "../types/home-types";
import { formatTripDates } from "../utils/select-home";
import { Badge, homeStyles, SurfaceCard } from "./home-primitives";
import { TripTimeline } from "./trip-timeline";
import { SampleItineraryPanel } from "./sample-itinerary-panel";
import { OngoingTripPanels } from "./ongoing-trip-panels";
import { sampleTrips } from "@/features/trip/data/sample-trips";
import { CreateTripModal } from "@/features/trip/components/create-trip-modal";

export function PreviewPanels() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { panel, closePanel, trips } = useTripPreview((state) => ({
    panel: state.panel,
    closePanel: state.closePanel,
    trips: state.trips,
  }));
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  if (!panel) return null;
  if (panel.kind === "create") {
    return <CreateTripModal visible onClose={closePanel} />;
  }
  if (
    panel.kind === "camera" ||
    panel.kind === "journal" ||
    panel.kind === "current-weather" ||
    panel.kind === "trip-details"
  ) {
    return (
      <OngoingTripPanels key={`${panel.kind}:${panel.tripId}`} panel={panel} />
    );
  }
  const titles = {
    scenarios: copy.previewTitle,
    create: copy.create,
    plan: copy.plan,
    sample: copy.exampleTitle,
    "capture-start": copy.capture,
    notifications: copy.notifications,
  };
  const trip =
    panel.kind === "plan"
      ? (trips.find((item) => item.id === panel.tripId) ??
        sampleTrips.find((item) => item.id === panel.tripId))
      : undefined;
  return (
    <Modal
      transparent
      visible
      animationType={reduceMotion ? "none" : "fade"}
      statusBarTranslucent
      onRequestClose={closePanel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.modal,
          {
            backgroundColor: theme.colors.overlay,
            paddingTop: insets.top + theme.spacing.lg,
            paddingLeft: insets.left + theme.spacing.sm,
            paddingRight: insets.right + theme.spacing.sm,
          },
        ]}
      >
        <Pressable
          accessible={false}
          onPress={closePanel}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              maxWidth: theme.layout.contentMaxWidth,
              borderTopLeftRadius: theme.radius.xxl,
              borderTopRightRadius: theme.radius.xxl,
              backgroundColor: theme.colors.background,
              paddingBottom: insets.bottom + theme.spacing.lg,
            },
          ]}
        >
          <View
            style={[
              homeStyles.row,
              {
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                gap: theme.spacing.md,
              },
            ]}
          >
            <AppText
              accessibilityRole="header"
              style={[
                homeStyles.grow,
                {
                  fontFamily: theme.typography.fontFamily.bold,
                  fontSize: theme.typography.fontSize.lg,
                  lineHeight: theme.typography.lineHeight.lg,
                },
              ]}
            >
              {titles[panel.kind]}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.close}
              onPress={closePanel}
              style={({ pressed }) => [
                styles.close,
                {
                  width: theme.layout.touchTarget,
                  height: theme.layout.touchTarget,
                  opacity: pressed ? theme.motion.pressOpacity : 1,
                },
              ]}
            >
              <AppIcon name="close" />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: theme.spacing.xl,
              gap: theme.spacing.lg,
            }}
          >
            {panel.kind === "scenarios" ? <ScenarioPicker /> : null}
            {panel.kind === "notifications" ? (
              <View
                style={{
                  alignItems: "center",
                  gap: theme.spacing.md,
                  paddingVertical: theme.spacing.xl,
                }}
              >
                <View
                  style={{
                    padding: theme.spacing.lg,
                    borderRadius: theme.radius.full,
                    backgroundColor: theme.colors.surfaceTint,
                  }}
                >
                  <AppIcon name="bell" size={theme.layout.iconLarge} />
                </View>
                <AppText variant="label" style={{ textAlign: "center" }}>
                  {copy.noNotifications}
                </AppText>
                <AppText tone="muted" style={{ textAlign: "center" }}>
                  {copy.noNotificationsHint}
                </AppText>
              </View>
            ) : null}
            {panel.kind === "sample" ? <SampleItineraryPanel /> : null}
            {panel.kind === "capture-start" ? (
              <>
                <AppIcon name="camera" size={theme.layout.iconLarge} />
                <AppText variant="label">{copy.cameraNeedsTrip}</AppText>
                <AppText tone="muted">{copy.cameraNeedsTripHint}</AppText>
                <AppButton
                  variant="gradient"
                  onPress={() => {
                    closePanel();
                    router.push("/tabs/trips");
                  }}
                >
                  {copy.trips}
                </AppButton>
              </>
            ) : null}
            {panel.kind === "plan" && trip ? (
              <PlanPanel
                key={trip.id}
                trip={trip}
                initialDay={panel.dayIndex ?? 0}
              />
            ) : null}
            {panel.kind !== "notifications" ? (
              <AppText variant="caption" tone="muted">
                {copy.sampleHint}
              </AppText>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScenarioPicker() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { scenario, changeScenario } = useTripPreview((state) => ({
    scenario: state.scenario,
    changeScenario: state.changeScenario,
  }));
  const options: { value: HomeScenario; title: string }[] = [
    { value: "new", title: copy.scenarioNew },
    { value: "upcoming", title: copy.scenarioUpcoming },
    { value: "ongoing", title: copy.scenarioOngoing },
    { value: "returning", title: copy.scenarioReturning },
  ];
  return (
    <>
      <AppText tone="muted">{copy.previewHint}</AppText>
      <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.sm }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: scenario === option.value }}
            onPress={() => changeScenario(option.value)}
            style={({ pressed }) => [
              homeStyles.row,
              {
                minHeight: theme.layout.touchTarget,
                padding: theme.spacing.lg,
                gap: theme.spacing.md,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor:
                  scenario === option.value
                    ? theme.colors.primaryText
                    : theme.colors.border,
                backgroundColor: theme.colors.surface,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppText variant="label" style={homeStyles.grow}>
              {option.title}
            </AppText>
            {scenario === option.value ? (
              <AppIcon name="check" />
            ) : (
              <AppIcon name="chevron" color={theme.colors.textSecondary} />
            )}
          </Pressable>
        ))}
      </View>
    </>
  );
}

function PlanPanel({ trip, initialDay }: { trip: Trip; initialDay: number }) {
  const theme = useAppTheme();
  const { copy, locale } = useHomeCopy();
  const { addStop } = useTripPreview((state) => ({ addStop: state.addStop }));
  const [dayIndex, setDayIndex] = useState(
    Math.min(Math.max(0, initialDay), Math.max(0, trip.days.length - 1)),
  );
  const day = trip.days[dayIndex];
  const hasSuggestion =
    day &&
    suggestedStops(trip.destination).some(
      (stop) => !day.stops.some((existing) => existing.id === stop.id),
    );
  return (
    <>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="heading">{trip.destination}</AppText>
        <AppText tone="muted">{formatTripDates(trip, locale)}</AppText>
        <Badge
          label={
            trip.status === "draft"
              ? copy.draft
              : trip.status === "completed"
                ? copy.completed
                : copy.planned
          }
        />
      </View>
      <View
        accessibilityLabel={copy.chooseDay}
        style={[homeStyles.row, { flexWrap: "wrap", gap: theme.spacing.sm }]}
      >
        {trip.days.map((item, index) => (
          <Pressable
            key={item.date}
            accessibilityRole="button"
            accessibilityLabel={`${copy.day} ${index + 1}`}
            accessibilityState={{ selected: dayIndex === index }}
            onPress={() => setDayIndex(index)}
            style={({ pressed }) => ({
              minHeight: theme.layout.touchTarget,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderRadius: theme.radius.full,
              borderWidth: 1,
              borderColor:
                dayIndex === index
                  ? theme.colors.primaryText
                  : theme.colors.borderStrong,
              backgroundColor:
                dayIndex === index
                  ? theme.colors.surfaceTint
                  : theme.colors.surface,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppText
              variant="label"
              tone={dayIndex === index ? "primary" : "muted"}
            >
              {copy.day} {index + 1}
            </AppText>
          </Pressable>
        ))}
      </View>
      <SurfaceCard>
        {day?.stops.length ? (
          <TripTimeline stops={day.stops} />
        ) : (
          <AppText tone="muted">{copy.emptyDay}</AppText>
        )}
      </SurfaceCard>
      {trip.status !== "completed" && day ? (
        <AppButton
          disabled={!hasSuggestion}
          leadingIcon={
            <AppIcon
              name={hasSuggestion ? "plus" : "check"}
              color={theme.colors.onPrimary}
            />
          }
          onPress={() => addStop(trip.id, day.date)}
        >
          {hasSuggestion ? copy.addSuggestion : copy.allAdded}
        </AppButton>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxHeight: "92%", flexShrink: 1, overflow: "hidden" },
  close: { alignItems: "center", justifyContent: "center" },
});
