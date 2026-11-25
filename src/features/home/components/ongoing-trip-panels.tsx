import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { z } from "zod";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { journalPhotoCredits } from "../data/ongoing-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { formatForecastDate } from "../i18n/weather-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { JourneyPanel } from "../types/preview-state";
import type { Memory } from "../types/home-types";
import { formatTripDates } from "../utils/select-home";
import { homeStyles, TextAction } from "./home-primitives";
import { OngoingWeatherDetails } from "./ongoing-weather-details";
import { WeatherAtmosphere } from "./weather-atmosphere";

export function OngoingTripPanels({
  panel,
}: {
  panel: Exclude<JourneyPanel, { kind: "trip-details" | "camera" }>;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const { trips, memories, today, closePanel, openPanel } = useTripPreview(
    (state) => ({
      trips: state.trips,
      memories: state.memories,
      today: state.today,
      closePanel: state.closePanel,
      openPanel: state.openPanel,
    }),
  );

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

  if (panel.kind === "current-weather")
    return (
      <JourneySheet
        title={copy.weatherNow}
        onClose={closePanel}
        glass
        hideHeader
      >
        <OngoingWeatherDetails
          tripId={trip.id}
          today={today}
          destination={trip.destination}
        />
      </JourneySheet>
    );

  const journal = memories.filter(
    (memory) => memory.tripId === trip.id && (!date || memory.date === date),
  );

  return (
    <JourneySheet title={copy.tripJournal} onClose={closePanel}>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText accessibilityRole="header" variant="heading">
          {trip.destination}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatTripDates(trip, locale)}
        </AppText>
      </View>
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
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="caption" tone="muted">
            {copy.photoCredit}
          </AppText>
          {journalPhotoCredits.map((credit) => (
            <AppText key={credit.source} variant="caption" tone="muted">
              <Link href={credit.source}>{credit.author}</Link>
              {" · "}
              <Link href={credit.licenseUrl}>{credit.license}</Link>
            </AppText>
          ))}
        </View>
      </>
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

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof schema>>({
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
          loading={isSubmitting}
          onPress={handleSubmit(async ({ text }) => {
            try {
              await updateMemoryNote(memory.id, text);
              Keyboard.dismiss();
              onDone();
            } catch {
              setError("text", { message: copy.photoUnavailable });
            }
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

export function JourneySheet({
  title,
  onClose,
  children,
  glass = false,
  hideHeader = false,
  restrained = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  glass?: boolean;
  hideHeader?: boolean;
  restrained?: boolean;
}) {
  const theme = useAppTheme();
  const { copy } = useOngoingCopy();
  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const dismissDistance = theme.layout.sheetDismissDistance;
  const dismissVelocity = theme.motion.sheetDismissVelocity;
  const snapDuration = theme.motion.tabTransitionDuration;
  const minimumSwipe = theme.spacing.md;
  const sheetMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  useEffect(() => () => cancelAnimation(translateY), [translateY]);
  const dragGesture = Gesture.Pan()
    .enabled(glass)
    .activeOffsetY(theme.spacing.sm)
    .failOffsetX([-theme.spacing.lg, theme.spacing.lg])
    .onUpdate((event) => {
      translateY.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (
        event.translationY >= dismissDistance ||
        (event.translationY > minimumSwipe &&
          event.velocityY >= dismissVelocity)
      ) {
        scheduleOnRN(onClose);
      } else {
        translateY.set(
          withTiming(0, {
            duration: snapDuration,
            reduceMotion: ReduceMotion.System,
          }),
        );
      }
    })
    .onFinalize((_event, success) => {
      if (!success)
        translateY.set(
          withTiming(0, {
            duration: snapDuration,
            reduceMotion: ReduceMotion.System,
          }),
        );
    });

  return (
    <Modal
      visible
      transparent
      animationType={reduceMotion ? "none" : glass ? "slide" : "fade"}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
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
          <Animated.View
            accessibilityViewIsModal
            onAccessibilityEscape={onClose}
            accessibilityActions={
              hideHeader ? [{ name: "escape", label: copy.close }] : undefined
            }
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === "escape") onClose();
            }}
            style={[
              styles.sheet,
              sheetMotion,
              {
                maxWidth: theme.layout.contentMaxWidth,
                height: glass
                  ? windowHeight * theme.layout.weatherSheetHeightRatio
                  : undefined,
                backgroundColor:
                  glass && !restrained
                    ? theme.colors.weatherGlassSurface
                    : theme.colors.background,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                borderWidth: glass ? StyleSheet.hairlineWidth : 0,
                borderColor: restrained
                  ? theme.colors.border
                  : theme.colors.glassClockBorder,
                boxShadow: glass
                  ? [
                      {
                        ...theme.elevation.floating,
                        color: theme.colors.glassShadow,
                      },
                    ]
                  : undefined,
              },
            ]}
          >
            {glass && !restrained ? <WeatherAtmosphere /> : null}
            <GestureDetector gesture={dragGesture}>
              <View collapsable={false}>
                {glass ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.close}
                    accessibilityHint={copy.weatherDismissHint}
                    onPress={onClose}
                    style={({ pressed }) => ({
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: theme.layout.compactTouchTarget,
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    })}
                  >
                    <View
                      aria-hidden
                      style={{
                        width: theme.layout.sheetDragHandleWidth,
                        height: theme.layout.sheetDragHandleHeight,
                        borderRadius: theme.radius.full,
                        backgroundColor: theme.colors.textDisabled,
                      }}
                    />
                  </Pressable>
                ) : null}
                {!hideHeader ? (
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
                      style={[
                        homeStyles.grow,
                        glass
                          ? {
                              fontSize: theme.typography.fontSize.lg,
                              lineHeight: theme.typography.lineHeight.lg,
                            }
                          : null,
                      ]}
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
                          borderRadius: theme.radius.md,
                          backgroundColor: glass
                            ? theme.colors.glassInset
                            : undefined,
                          opacity: pressed ? theme.motion.pressOpacity : 1,
                        },
                      ]}
                    >
                      <AppIcon name="close" />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </GestureDetector>
            <ScrollView
              style={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: glass ? theme.spacing.none : theme.spacing.sm,
                paddingBottom:
                  insets.bottom + (glass ? theme.spacing.md : theme.spacing.lg),
                gap: glass ? theme.spacing.sm : theme.spacing.lg,
              }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxHeight: "92%", overflow: "hidden", flexShrink: 1 },
  body: { flexGrow: 0, flexShrink: 1 },
  center: { alignItems: "center", justifyContent: "center" },
});
