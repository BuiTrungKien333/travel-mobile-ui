import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
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
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { formatForecastDate } from "../i18n/weather-copy";
import {
  useTripPreview,
  type JourneyPanel,
} from "../providers/trip-preview-provider";
import type { Memory } from "../types/home-types";
import { getDayProgress } from "../utils/day-progress";
import { formatTripDates } from "../utils/select-home";
import { CaptureMomentPreview } from "./capture-moment-preview";
import { homeStyles, TextAction } from "./home-primitives";
import { OngoingWeatherDetails } from "./ongoing-weather-details";

export function OngoingTripPanels({ panel }: { panel: JourneyPanel }) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const { trips, memories, visited, today, closePanel, openPanel } =
    useTripPreview((state) => ({
      trips: state.trips,
      memories: state.memories,
      visited: state.visited,
      today: state.today,
      closePanel: state.closePanel,
      openPanel: state.openPanel,
    }));
  const [date, setDate] = useState(
    panel.kind === "journal" ? panel.date : undefined,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const trip = trips.find((item) => item.id === panel.tripId);
  if (!trip)
    return (
      <JourneySheet title={copy.details} onClose={closePanel}>
        <AppText tone="muted">{copy.noTrip}</AppText>
      </JourneySheet>
    );
  if (panel.kind === "camera")
    return <CaptureMomentPreview panel={panel} trip={trip} />;
  if (panel.kind === "current-weather")
    return <JourneySheet title={copy.weatherNow} onClose={closePanel}>
      <OngoingWeatherDetails tripId={trip.id} today={today} destination={trip.destination} />
    </JourneySheet>;
  const journal = memories.filter(
    (memory) => memory.tripId === trip.id && (!date || memory.date === date),
  );
  return (
    <JourneySheet
      title={panel.kind === "journal" ? copy.tripJournal : copy.details}
      onClose={closePanel}
    >
      <View style={{ gap: theme.spacing.xs }}>
        <AppText accessibilityRole="header" variant="heading">
          {trip.destination}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatTripDates(trip, locale)}
        </AppText>
      </View>
      {panel.kind === "trip-details" ? (
        trip.days.map((day, index) => {
          const progress = getDayProgress(
            day.stops,
            visited[`${trip.id}:${day.date}`] ?? [],
          );
          return (
            <View
              key={day.date}
              style={{
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
              }}
            >
              <AppText variant="label">
                {copy.day} {index + 1} · {formatForecastDate(day.date, locale)}
              </AppText>
              <AppText variant="caption" tone="muted">
                {progress.visitedStops.length}/{day.stops.length}{" "}
                {copy.visited.toLocaleLowerCase(locale)}
              </AppText>
              <View
                style={[
                  homeStyles.row,
                  { flexWrap: "wrap", gap: theme.spacing.md },
                ]}
              >
                <TextAction
                  label={copy.fullDay}
                  onPress={() =>
                    openPanel({
                      kind: "plan",
                      tripId: trip.id,
                      dayIndex: index,
                    })
                  }
                />
                <TextAction
                  label={copy.allJournal}
                  onPress={() =>
                    openPanel({
                      kind: "journal",
                      tripId: trip.id,
                      date: day.date,
                    })
                  }
                />
              </View>
            </View>
          );
        })
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm }}
          >
            {[undefined, ...trip.days.map((day) => day.date)].map((value) => (
              <Pressable
                key={value ?? "all"}
                accessibilityRole="button"
                accessibilityState={{ selected: date === value }}
                onPress={() => {
                  setDate(value);
                  setEditingId(null);
                }}
                style={({ pressed }) => ({
                  minHeight: theme.layout.touchTarget,
                  justifyContent: "center",
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                  backgroundColor:
                    date === value
                      ? theme.colors.softActionSurface
                      : theme.colors.surface,
                  opacity: pressed ? theme.motion.pressOpacity : 1,
                })}
              >
                <AppText
                  variant="caption"
                  tone={date === value ? "primary" : "muted"}
                >
                  {value ? formatForecastDate(value, locale) : copy.allDays}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
          {journal.length ? (
            journal.map((memory) => (
              <View
                key={memory.id}
                style={{
                  gap: theme.spacing.sm,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
                  <AppIcon name="pin" size={theme.layout.iconSmall} />
                  <AppText variant="label" style={homeStyles.grow}>
                    {memory.place?.[locale] ?? memory.destination}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {memory.time}
                  </AppText>
                </View>
                {memory.date ? (
                  <AppText variant="caption" tone="muted">
                    {formatForecastDate(memory.date, locale)}
                  </AppText>
                ) : null}
                {memory.photo ? (
                  <Image
                    accessible
                    accessibilityLabel={
                      memory.place?.[locale] ?? memory.destination
                    }
                    source={memory.photo}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    style={{
                      width: "100%",
                      aspectRatio: 4 / 3,
                      borderRadius: theme.radius.sm,
                    }}
                  />
                ) : null}
                {memory.text ? <AppText>{memory.text}</AppText> : null}
                {editingId === memory.id ? (
                  <JournalNoteEditor
                    key={memory.id}
                    memory={memory}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <TextAction
                    label={memory.text ? copy.editNote : copy.addNote}
                    onPress={() => setEditingId(memory.id)}
                  />
                )}
              </View>
            ))
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              <AppText variant="label">{copy.journalEmpty}</AppText>
              <AppText tone="muted">{copy.journalEmptyHint}</AppText>
            </View>
          )}
          <AppButton
            variant="gradient"
            onPress={() =>
              openPanel({
                kind: "camera",
                tripId: trip.id,
                date:
                  date ??
                  (trip.days.some((day) => day.date === today)
                    ? today
                    : (trip.days[0]?.date ?? "")),
              })
            }
            leadingIcon={
              <AppIcon
                name="camera"
                size={theme.layout.iconSmall}
                color={theme.colors.onGradientAction}
              />
            }
          >
            {copy.capture}
          </AppButton>
          <AppText variant="caption" tone="muted">
            {copy.savedInSession}
          </AppText>
        </>
      )}
    </JourneySheet>
  );
}

function JournalNoteEditor({
  memory,
  onDone,
}: {
  memory: Memory;
  onDone: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useOngoingCopy();
  const updateMemoryNote = useTripPreview((state) => state.updateMemoryNote);
  const schema = z.object({
    text: z.string().trim().max(500, copy.noteTooLong),
  });
  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { text: memory.text },
    mode: "onTouched",
  });
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Controller
        control={control}
        name="text"
        render={({
          field: { ref, value, onBlur, onChange },
          fieldState: { error },
        }) => (
          <AppInput
            ref={ref}
            label={copy.note}
            placeholder={copy.notePlaceholder}
            multiline
            maxLength={500}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            style={{
              minHeight: theme.layout.journeyThumbnailSize,
              textAlignVertical: "top",
            }}
          />
        )}
      />
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppButton
          variant="soft"
          size="small"
          style={homeStyles.grow}
          onPress={handleSubmit(({ text }) => {
            updateMemoryNote(memory.id, text);
            Keyboard.dismiss();
            onDone();
          })}
        >
          {copy.saveNote}
        </AppButton>
        <AppButton
          variant="outline"
          size="small"
          onPress={() => {
            Keyboard.dismiss();
            onDone();
          }}
        >
          {copy.cancel}
        </AppButton>
      </View>
    </View>
  );
}

function JourneySheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  const { copy } = useOngoingCopy();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  return (
    <Modal
      visible
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.overlay,
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
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              maxWidth: theme.layout.contentMaxWidth,
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
            },
          ]}
        >
          <View
            style={[
              homeStyles.row,
              {
                gap: theme.spacing.sm,
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.sm,
              },
            ]}
          >
            <AppText
              accessibilityRole="header"
              variant="label"
              style={homeStyles.grow}
            >
              {title}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.close}
              onPress={onClose}
              style={({ pressed }) => [
                styles.center,
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
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.sm,
              paddingBottom: insets.bottom + theme.spacing.lg,
              gap: theme.spacing.lg,
            }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxHeight: "92%", overflow: "hidden", flexShrink: 1 },
  body: { flexGrow: 0, flexShrink: 1 },
  center: { alignItems: "center", justifyContent: "center" },
});
