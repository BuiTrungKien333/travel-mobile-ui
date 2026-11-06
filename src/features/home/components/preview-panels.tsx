import { router } from "expo-router";
import { TripDetailsRedirect } from "@/features/trip/components/trip-details-redirect";
import { CaptureScreenRedirect } from "@/features/camera/components/capture-screen-redirect";
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
import { useScreenInsets } from "@/hooks/use-screen-insets";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { HomeScenario } from "../types/home-types";
import { homeStyles } from "./home-primitives";
import { SampleItineraryPanel } from "./sample-itinerary-panel";
import { OngoingTripPanels } from "./ongoing-trip-panels";
import { CreateTripModal } from "@/features/trip/components/create-trip-modal";

export function PreviewPanels() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { panel, closePanel } = useTripPreview((state) => ({
    panel: state.panel,
    closePanel: state.closePanel,
  }));
  const insets = useScreenInsets();
  const reduceMotion = useReducedMotion();
  if (!panel) return null;
  if (panel.kind === "camera")
    return <CaptureScreenRedirect panel={panel} onClose={closePanel} />;
  if (panel.kind === "plan" || panel.kind === "trip-details")
    return (
      <TripDetailsRedirect
        tripId={panel.tripId}
        dayIndex={panel.kind === "plan" ? panel.dayIndex : undefined}
        onClose={closePanel}
      />
    );
  if (panel.kind === "create") {
    return (
      <CreateTripModal
        visible
        onClose={closePanel}
        onCreated={(tripId) => {
          closePanel();
          router.push({ pathname: "/trip/[tripId]", params: { tripId } });
        }}
      />
    );
  }
  if (panel.kind === "journal" || panel.kind === "current-weather") {
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
              borderTopLeftRadius:
                panel.kind === "capture-start"
                  ? theme.radius.xl
                  : theme.radius.xxl,
              borderTopRightRadius:
                panel.kind === "capture-start"
                  ? theme.radius.xl
                  : theme.radius.xxl,
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
              <View style={{ alignItems: "center", gap: theme.spacing.md }}>
                <View
                  style={{
                    padding: theme.spacing.lg,
                    borderRadius: theme.radius.lg,
                    backgroundColor: theme.colors.surfaceTint,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.softActionBorder,
                  }}
                >
                  <GlassBackdrop borderRadius={theme.radius.lg} />
                  <AppIcon
                    name="camera"
                    variant="light"
                    size={theme.layout.iconLarge}
                    color={theme.colors.primaryText}
                  />
                </View>
                <View style={{ gap: theme.spacing.sm }}>
                  <AppText
                    variant="label"
                    style={{
                      textAlign: "center",
                      fontSize: theme.typography.fontSize.md,
                    }}
                  >
                    {copy.cameraNeedsTrip}
                  </AppText>
                  <AppText tone="muted" style={{ textAlign: "center" }}>
                    {copy.cameraNeedsTripHint}
                  </AppText>
                </View>
                <View
                  style={{
                    width: "100%",
                    gap: theme.spacing.xs,
                    marginTop: theme.spacing.sm,
                  }}
                >
                  <AppButton
                    variant="soft"
                    size="small"
                    leadingIcon={
                      <AppIcon
                        name="trips"
                        variant="light"
                        size={theme.layout.iconSmall}
                        color={theme.colors.onSoftAction}
                      />
                    }
                    onPress={() => {
                      closePanel();
                      router.dismissTo("/tabs/trips");
                    }}
                  >
                    {copy.cameraViewTrips}
                  </AppButton>
                  <Pressable
                    accessibilityRole="button"
                    onPress={closePanel}
                    style={({ pressed }) => ({
                      minHeight: theme.layout.compactTouchTarget,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    })}
                  >
                    <AppText variant="caption" tone="muted">
                      {copy.cameraLater}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            ) : null}
            {panel.kind !== "notifications" &&
            panel.kind !== "capture-start" ? (
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

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxHeight: "92%", flexShrink: 1, overflow: "hidden" },
  close: { alignItems: "center", justifyContent: "center" },
});
