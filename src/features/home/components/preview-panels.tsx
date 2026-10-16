import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
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
import { z } from "zod";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { suggestedStops } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { HomeScenario, Trip } from "../types/home-types";
import { dayDistance, formatTripDates } from "../utils/select-home";
import { Badge, homeStyles, SurfaceCard } from "./home-primitives";
import { TripTimeline } from "./trip-timeline";
import { SampleItineraryPanel } from "./sample-itinerary-panel";
import { OngoingTripPanels } from "./ongoing-trip-panels";

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
    weather: copy.rainTitle,
    moment: copy.capture,
    plan: copy.plan,
    sample: copy.exampleTitle,
    "capture-start": copy.capture,
  };
  const trip =
    panel.kind === "plan"
      ? trips.find((item) => item.id === panel.tripId)
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
            {panel.kind === "create" ? <CreateTripForm /> : null}
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
            {panel.kind === "weather" ? (
              <>
                <Badge label={copy.example} icon="rain" />
                <AppText>{copy.rainDetail}</AppText>
                <AppButton variant="outline" onPress={closePanel}>
                  {copy.close}
                </AppButton>
              </>
            ) : null}
            {panel.kind === "moment" ? (
              <MomentForm destination={panel.destination} />
            ) : null}
            <AppText variant="caption" tone="muted">
              {copy.sampleHint}
            </AppText>
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

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function CreateTripForm() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { createDraft, today } = useTripPreview((state) => ({
    createDraft: state.createDraft,
    today: state.today,
  }));
  const schema = z
    .object({
      destination: z
        .string()
        .trim()
        .min(1, copy.required)
        .max(80, copy.required),
      startDate: z.string().refine(validDate, copy.invalidDate),
      endDate: z.string().refine(validDate, copy.invalidDate),
    })
    .superRefine((values, context) => {
      if (validDate(values.startDate) && values.startDate < today)
        context.addIssue({
          code: "custom",
          path: ["startDate"],
          message: copy.datePast,
        });
      if (
        validDate(values.startDate) &&
        validDate(values.endDate) &&
        (values.endDate < values.startDate ||
          dayDistance(values.startDate, values.endDate) >= 30)
      )
        context.addIssue({
          code: "custom",
          path: ["endDate"],
          message: copy.dateOrder,
        });
    });
  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { destination: "", startDate: "", endDate: "" },
    mode: "onTouched",
  });
  const fields = [
    {
      name: "destination",
      label: copy.destination,
      placeholder: copy.destinationPlaceholder,
    },
    { name: "startDate", label: copy.start, placeholder: "2026-10-24" },
    { name: "endDate", label: copy.end, placeholder: "2026-10-27" },
  ] as const;
  const submit = handleSubmit((values) => {
    Keyboard.dismiss();
    if (!createDraft(values)) setError("root", { message: copy.capacity });
  });
  return (
    <>
      <AppText tone="muted">{copy.createHint}</AppText>
      <View style={{ gap: theme.spacing.lg }}>
        {fields.map((item) => (
          <Controller
            key={item.name}
            control={control}
            name={item.name}
            render={({
              field: { ref, onBlur, onChange, value },
              fieldState: { error },
            }) => (
              <AppInput
                ref={ref}
                label={item.label}
                placeholder={item.placeholder}
                autoCorrect={false}
                autoCapitalize={item.name === "destination" ? "words" : "none"}
                maxLength={item.name === "destination" ? 80 : 10}
                error={error?.message}
                helperText={
                  item.name === "startDate" ? copy.dateHint : undefined
                }
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType={item.name === "endDate" ? "done" : "next"}
                onSubmitEditing={
                  item.name === "endDate"
                    ? submit
                    : () =>
                        setFocus(
                          item.name === "destination" ? "startDate" : "endDate",
                        )
                }
              />
            )}
          />
        ))}
      </View>
      {errors.root ? (
        <AppText accessibilityRole="alert" tone="error">
          {errors.root.message}
        </AppText>
      ) : null}
      <AppButton loading={isSubmitting} onPress={submit}>
        {copy.saveDraft}
      </AppButton>
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

function MomentForm({ destination }: { destination: string }) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { saveMoment } = useTripPreview((state) => ({
    saveMoment: state.saveMoment,
  }));
  const [saved, setSaved] = useState(false);
  const schema = z.object({
    text: z
      .string()
      .trim()
      .min(1, copy.momentRequired)
      .max(500, copy.momentRequired),
  });
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { text: "" },
  });
  if (saved)
    return (
      <SurfaceCard tinted>
        <AppIcon name="check" size={theme.layout.iconLarge} />
        <AppText accessibilityRole="alert">{copy.saved}</AppText>
      </SurfaceCard>
    );
  return (
    <>
      <Badge label={destination} icon="pin" />
      <AppText tone="muted">{copy.noteOnly}</AppText>
      <Controller
        name="text"
        control={control}
        render={({
          field: { ref, onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <AppInput
            ref={ref}
            label={copy.note}
            placeholder={copy.notePlaceholder}
            multiline
            maxLength={500}
            style={{
              minHeight: theme.layout.heroImageHeight,
              textAlignVertical: "top",
            }}
            error={error?.message}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.root ? (
        <AppText accessibilityRole="alert" tone="error">
          {errors.root.message}
        </AppText>
      ) : null}
      <AppButton
        loading={isSubmitting}
        onPress={handleSubmit(({ text }) => {
          if (saveMoment(destination, text)) setSaved(true);
          else setError("root", { message: copy.capacity });
        })}
      >
        {copy.saveMoment}
      </AppButton>
    </>
  );
}
const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxHeight: "92%", flexShrink: 1, overflow: "hidden" },
  close: { alignItems: "center", justifyContent: "center" },
});
