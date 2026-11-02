import { useReducedMotion } from "react-native-reanimated";
import { useController, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
} from "react-native";
import { useScreenInsets } from "@/hooks/use-screen-insets";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { TripPreference } from "@/features/home/types/home-types";
import { dayDistance } from "@/features/home/utils/select-home";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, typography, layout } from "@/theme/tokens";
import { tripFormLimits, tripPreferenceIds } from "../constants/trip-form";
import { useTripCopy } from "../i18n/trip-copy";
import {
  createTripSchema,
  type CreateTripInput,
  type CreateTripOutput,
} from "../schemas/create-trip-schema";
import { confirmDiscard } from "../utils/confirm-discard";
import {
  destinationRegion,
  formatBudget,
  formatDisplayDate,
  generateDefaultTitle,
  tripMessage,
} from "../utils/create-trip-formatters";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { router } from "expo-router";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { ApiError } from "@/services/api/api-error";
import { useCreateTripMutation } from "../api/trip-queries";
import {
  createTripRequestId,
  tripLocalToday,
  type CreateTripPayload,
} from "../api/trip-contract";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";
import { DateRangeSheet } from "./date-range-sheet";
import { DestinationPickerSheet } from "./destination-picker-sheet";
import { PlacePickerScreen } from "../screens/place-picker-screen";

type CreateTripModalProps = {
  visible: boolean;
  onClose: () => void;
};

const webInputReset: TextStyle = Platform.select({
  web: { outlineWidth: 0 },
  default: {},
});

export function CreateTripModal(props: CreateTripModalProps) {
  return props.visible ? <CreateTripForm onClose={props.onClose} /> : null;
}

function CreateTripForm({ onClose }: Omit<CreateTripModalProps, "visible">) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const reduceMotion = useReducedMotion();
  const { copy, locale } = useTripCopy();
  const { copy: detailsCopy } = useTripDetailsCopy();
  const { copy: integrationCopy } = useTripIntegrationCopy();
  const createMutation = useCreateTripMutation();
  const createAttempt = useRef<{ fingerprint: string; id: string } | null>(
    null,
  );
  const scrollRef = useRef<ScrollView>(null);
  const { today: previewToday, createDraft } = useTripPreview((state) => ({
    today: state.today,
    createDraft: state.createDraft,
  }));
  const today = UI_PREVIEW_ENABLED ? previewToday : tripLocalToday();
  const { control, setValue, handleSubmit, setError, setFocus, formState } =
    useForm<CreateTripInput, unknown, CreateTripOutput>({
      resolver: zodResolver(createTripSchema(copy, today)),
      defaultValues: {
        destination: "",
        destinationProvinceId: null,
        startDate: "",
        endDate: "",
        title: "",
        budget: "",
        preferences: [],
        initialStops: [],
      },
      mode: "onTouched",
    });
  const titleField = useController({ name: "title", control }).field;
  const titleEdited = useRef(false);
  const budgetField = useController({ name: "budget", control }).field;
  const {
    destination = "",
    destinationProvinceId = null,
    startDate = "",
    endDate = "",
    title: tripTitle = "",
    budget: budgetDigits = "",
    preferences: selectedTags = [],
  } = useWatch({ control });
  const selectedStops = useController({ name: "initialStops", control }).field
    .value;
  const budget = formatBudget(budgetDigits, locale);
  const { errors, isSubmitting, isDirty } = formState;
  const error = errors.root?.message;
  const [notice, setNotice] = useState("");
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [showDestSheet, setShowDestSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showPlaceSheet, setShowPlaceSheet] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);
  const durationDays =
    startDate && endDate && endDate >= startDate
      ? dayDistance(startDate, endDate) + 1
      : 0;

  const requestClose = () => {
    if (isSubmitting) return;
    Keyboard.dismiss();
    if (isDirty) confirmDiscard(copy, onClose);
    else onClose();
  };
  const handleSelectDestination = (
    newDest: string,
    provinceId: string | null = null,
  ) => {
    const previousCity = destination.split(",")[0].trim().toLowerCase();
    const nextCity = newDest.split(",")[0].trim().toLowerCase();
    if (previousCity !== nextCity && selectedStops.length) {
      setValue("initialStops", [], { shouldDirty: true });
      setNotice(copy.destinationChanged);
    }
    setValue("destination", newDest, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("destinationProvinceId", provinceId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!titleEdited.current)
      setValue(
        "title",
        generateDefaultTitle(newDest, startDate, endDate, copy),
      );
  };
  const handleApplyDateRange = (start: string, end: string) => {
    setValue("startDate", start, { shouldDirty: true, shouldValidate: true });
    setValue("endDate", end, { shouldDirty: true, shouldValidate: true });
    if (!titleEdited.current)
      setValue("title", generateDefaultTitle(destination, start, end, copy));
  };
  const handleRemoveStop = (id: string) =>
    setValue(
      "initialStops",
      selectedStops.filter((stop) => stop.id !== id),
      { shouldDirty: true },
    );
  const toggleTag = (tag: TripPreference) =>
    setValue(
      "preferences",
      selectedTags.includes(tag)
        ? selectedTags.filter((value) => value !== tag)
        : [...selectedTags, tag],
      { shouldDirty: true },
    );
  const handleBudgetChange = (text: string) =>
    budgetField.onChange(text.replace(/\D/g, ""));
  const submit = handleSubmit(
    async (values) => {
      Keyboard.dismiss();
      if (!UI_PREVIEW_ENABLED) {
        const payload: Omit<CreateTripPayload, "clientRequestId"> = {
          title:
            values.title ||
            generateDefaultTitle(
              values.destination,
              values.startDate,
              values.endDate,
              copy,
            ),
          destination: {
            name: values.destination,
            provinceId: values.destinationProvinceId,
          },
          startDate: values.startDate,
          endDate: values.endDate,
          timeZone: "Asia/Ho_Chi_Minh",
          budget:
            values.budget === undefined
              ? null
              : { amount: values.budget, currency: "VND" },
          preferences: values.preferences,
          initialPlaceIds: [],
        };
        if (values.initialStops.length) {
          setError("root", { message: integrationCopy.placesPending });
          return;
        }
        const fingerprint = JSON.stringify(payload);
        if (createAttempt.current?.fingerprint !== fingerprint)
          createAttempt.current = { fingerprint, id: createTripRequestId() };
        try {
          const read = await createMutation.mutateAsync({
            ...payload,
            clientRequestId: createAttempt.current.id,
          });
          onClose();
          router.push({
            pathname: "/trip/[tripId]",
            params: { tripId: read.trip.id },
          });
        } catch (failure) {
          if (failure instanceof ApiError && failure.fields) {
            for (const key of [
              "title",
              "startDate",
              "endDate",
              "budget",
              "preferences",
            ] as const) {
              if (failure.fields[key])
                setError(key, { message: integrationCopy.invalid });
            }
            if (failure.fields["destination.name"])
              setError("destination", { message: integrationCopy.invalid });
            if (
              failure.fields["budget.amount"] ||
              failure.fields["budget.currency"]
            )
              setError("budget", { message: integrationCopy.invalid });
          }
          setError("root", {
            message: tripApiErrorMessage(failure, integrationCopy),
          });
        }
        return;
      }
      const success = createDraft({
        ...values,
        title:
          values.title ||
          generateDefaultTitle(
            values.destination,
            values.startDate,
            values.endDate,
            copy,
          ),
      });
      // The store switches directly from this form to the created trip's plan.
      if (!success) setError("root", { message: copy.capacity });
    },
    (fieldErrors) => {
      Keyboard.dismiss();
      if (fieldErrors.destination) setShowDestSheet(true);
      else if (fieldErrors.startDate || fieldErrors.endDate)
        setShowDateSheet(true);
      else if (fieldErrors.title) setFocus("title");
      else if (fieldErrors.budget) {
        setIsAccordionOpen(true);
        requestAnimationFrame(() => setFocus("budget"));
      }
      if (
        fieldErrors.destination ||
        fieldErrors.startDate ||
        fieldErrors.endDate
      )
        scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    },
  );

  return (
    <Modal
      visible
      animationType={reduceMotion ? "none" : "slide"}
      statusBarTranslucent
      onRequestClose={
        showPlaceSheet ? () => setShowPlaceSheet(false) : requestClose
      }
    >
      {showPlaceSheet ? (
        <PlacePickerScreen
          destination={destination}
          initialSelected={selectedStops}
          onApply={(stops) => {
            setValue("initialStops", stops, { shouldDirty: true });
            setNotice("");
            setShowPlaceSheet(false);
          }}
          onClose={() => setShowPlaceSheet(false)}
        />
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + theme.spacing.xxl,
              paddingBottom: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.back}
            onPress={requestClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppIcon name="back" size={20} color={theme.colors.text} />
          </Pressable>

          <View style={styles.headerTextCol}>
            <AppText
              variant="heading"
              style={[
                styles.headerTitle,
                {
                  fontFamily: theme.typography.fontFamily.medium,
                  color: theme.colors.text,
                  marginTop: spacing.xxs,
                },
              ]}
            >
              {copy.createTrip}
            </AppText>
          </View>
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: insets.bottom + 100,
              gap: theme.spacing.md,
            },
          ]}
        >
          {/* Card 1: Điểm đến chính */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${copy.destination}: ${destination || copy.chooseDestination}`}
            onPress={() => setShowDestSheet(true)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceTint },
                ]}
              >
                <AppIcon
                  name="pin"
                  size={20}
                  color={theme.colors.primaryText}
                />
              </View>

              <View style={styles.cardInfoCol}>
                <AppText variant="caption" tone="muted">
                  {copy.destination}
                </AppText>
                <AppText
                  style={[
                    styles.destinationTitle,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: destination
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {destination || copy.chooseDestination}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {destinationRegion(destination, copy)}
                </AppText>
              </View>

              <AppIcon
                name="chevron"
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
          </Pressable>

          {errors.destination ? (
            <AppText accessibilityRole="alert" tone="error" variant="caption">
              {errors.destination.message}
            </AppText>
          ) : null}
          {notice ? (
            <AppText
              accessibilityLiveRegion="polite"
              variant="caption"
              tone="muted"
            >
              {notice}
            </AppText>
          ) : null}
          {/* Card 2: Thời gian chuyến đi */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tripMessage(copy.dateSummary, {
              start: formatDisplayDate(startDate, locale),
              end: formatDisplayDate(endDate, locale),
              count: durationDays,
            })}
            onPress={() => setShowDateSheet(true)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <View style={styles.dateHeaderRow}>
              <View style={styles.dateHeaderLeft}>
                <View
                  style={[
                    styles.iconCircleSmall,
                    { backgroundColor: theme.colors.surfaceTint },
                  ]}
                >
                  <AppIcon
                    name="calendar"
                    size={15}
                    color={theme.colors.primaryText}
                  />
                </View>
                <AppText
                  style={[
                    styles.dateCardTitle,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {copy.tripDates}
                </AppText>
              </View>

              {/* Duration badge */}
              <View
                style={[
                  styles.durationBadge,
                  { backgroundColor: theme.colors.surfaceTint },
                ]}
              >
                <AppText
                  style={[
                    styles.durationText,
                    {
                      color: theme.colors.primaryText,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                >
                  {durationDays > 0 ? `${durationDays} ${copy.days}` : "--"}
                </AppText>
              </View>
            </View>

            {/* 2 separate columns with middle divider */}
            <View
              style={[
                styles.dateColumnsContainer,
                {
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              {/* Ngày đi */}
              <View style={styles.dateColumnBlock}>
                <AppText variant="caption" tone="muted">
                  {copy.startDate}
                </AppText>
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.dateValueText,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: startDate
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {formatDisplayDate(startDate, locale)}
                </AppText>
              </View>

              {/* Vertical divider */}
              <View
                style={[
                  styles.dateVerticalDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              {/* Ngày về */}
              <View
                style={[styles.dateColumnBlock, { paddingLeft: spacing.sm }]}
              >
                <AppText variant="caption" tone="muted">
                  {copy.endDate}
                </AppText>
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.dateValueText,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: endDate
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {formatDisplayDate(endDate, locale)}
                </AppText>
              </View>
            </View>
          </Pressable>

          {errors.startDate || errors.endDate ? (
            <AppText accessibilityRole="alert" tone="error" variant="caption">
              {errors.startDate?.message || errors.endDate?.message}
            </AppText>
          ) : null}
          {/* Section 3: Tên chuyến đi */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                gap: theme.spacing.xs,
              },
            ]}
          >
            <AppText
              variant="label"
              style={{
                fontFamily: theme.typography.fontFamily.medium,
                color: theme.colors.text,
              }}
            >
              {copy.tripTitle}
            </AppText>
            <View
              style={[
                styles.titleInputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isTitleFocused
                    ? theme.colors.focus
                    : theme.colors.borderStrong,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <TextInput
                value={tripTitle}
                onChangeText={(text) => {
                  titleEdited.current = true;
                  titleField.onChange(text);
                }}
                ref={titleField.ref}
                accessibilityLabel={copy.tripTitle}
                maxLength={tripFormLimits.title}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => {
                  setIsTitleFocused(false);
                  titleField.onBlur();
                }}
                placeholder={copy.titlePlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                cursorColor={theme.colors.primaryText}
                selectionColor={theme.colors.surfaceTint}
                underlineColorAndroid="transparent"
                style={[
                  styles.titleInput,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                  webInputReset,
                ]}
              />
              {tripTitle.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.clearTitle}
                  onPress={() => {
                    titleEdited.current = true;
                    titleField.onChange("");
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.clearTitleButton,
                    { opacity: pressed ? theme.motion.pressOpacity : 1 },
                  ]}
                >
                  <AppIcon
                    name="close"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>
            <AppText variant="caption" tone="muted">
              {errors.title ? (
                <AppText accessibilityRole="alert" tone="error">
                  {errors.title.message}
                </AppText>
              ) : (
                copy.titleHint
              )}
            </AppText>
          </View>

          {/* Section 4: Địa điểm dự kiến */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <AppText
                style={[
                  styles.sectionHeading,
                  {
                    fontFamily: theme.typography.fontFamily.bold,
                    color: theme.colors.text,
                  },
                ]}
              >
                {copy.plannedPlaces}
              </AppText>

              {selectedStops.length > 0 ? (
                <AppText
                  variant="caption"
                  style={{
                    color: theme.colors.primaryText,
                    fontFamily: theme.typography.fontFamily.medium,
                  }}
                >
                  {tripMessage(copy.selectedPlaces, {
                    count: selectedStops.length,
                  })}
                </AppText>
              ) : null}
            </View>

            {selectedStops.length === 0 ? (
              /* State 01: Empty state button */
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.addPlace}
                onPress={() => {
                  if (!UI_PREVIEW_ENABLED) {
                    setNotice(integrationCopy.placesPending);
                    return;
                  }
                  if (!destination.trim()) {
                    setShowDestSheet(true);
                  } else {
                    Keyboard.dismiss();
                    setShowPlaceSheet(true);
                  }
                }}
                style={({ pressed }) => [
                  styles.addPlaceDashedCard,
                  {
                    borderColor: theme.colors.borderStrong,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.addPlaceIconCircle,
                    { backgroundColor: theme.colors.surfaceTint },
                  ]}
                >
                  <AppIcon
                    name="plus"
                    size={16}
                    color={theme.colors.primaryText}
                  />
                </View>
                <View style={styles.addPlaceTextCol}>
                  <AppText
                    style={[
                      styles.addPlaceTitle,
                      {
                        fontFamily: theme.typography.fontFamily.medium,
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    {copy.addPlace}
                  </AppText>
                </View>
                <AppIcon
                  name="chevron"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            ) : (
              /* State 04: Populated stops list */
              <View style={styles.stopsList}>
                {selectedStops.map((stop, index) => {
                  const stopName = stop.name[locale];

                  return (
                    <View
                      key={stop.id}
                      style={[
                        styles.stopItemRow,
                        {
                          backgroundColor: theme.colors.surfaceTint,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.stopIndexBadge,
                          { backgroundColor: theme.colors.surface },
                        ]}
                      >
                        <AppText
                          style={[
                            styles.stopIndexText,
                            {
                              color: theme.colors.primaryText,
                              fontFamily: theme.typography.fontFamily.bold,
                            },
                          ]}
                        >
                          {index + 1}
                        </AppText>
                      </View>

                      <View style={styles.stopInfoCol}>
                        <AppText
                          numberOfLines={1}
                          style={[
                            styles.stopNameText,
                            {
                              fontFamily: theme.typography.fontFamily.regular,
                              color: theme.colors.text,
                            },
                          ]}
                        >
                          {stopName}
                        </AppText>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={tripMessage(copy.removePlace, {
                          place: stopName,
                        })}
                        onPress={() => handleRemoveStop(stop.id)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.removeStopBtn,
                          {
                            opacity: pressed ? theme.motion.pressOpacity : 1,
                          },
                        ]}
                      >
                        <AppIcon
                          name="close"
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  );
                })}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.addMorePlaces}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowPlaceSheet(true);
                  }}
                  style={({ pressed }) => [
                    styles.addMoreStopsBtn,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    },
                  ]}
                >
                  <AppIcon
                    name="plus"
                    size={14}
                    color={theme.colors.primaryText}
                  />
                  <AppText
                    style={[
                      styles.addMoreStopsText,
                      {
                        color: theme.colors.primaryText,
                        fontFamily: theme.typography.fontFamily.medium,
                      },
                    ]}
                  >
                    {copy.addMorePlaces}
                  </AppText>
                </Pressable>
              </View>
            )}
          </View>

          <AppText variant="caption" tone="muted">
            {detailsCopy.savedPoolHint}
          </AppText>
          {/* Section 5: Accordion (Tùy chọn thêm) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${copy.moreOptions}: ${copy.moreOptionsHint}`}
              accessibilityState={{ expanded: isAccordionOpen }}
              onPress={() => setIsAccordionOpen((prev) => !prev)}
              style={({ pressed }) => [
                styles.accordionHeader,
                { opacity: pressed ? theme.motion.pressOpacity : 1 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceTint },
                ]}
              >
                <AppIcon
                  name="tune"
                  size={18}
                  color={theme.colors.primaryText}
                />
              </View>

              <View style={styles.cardInfoCol}>
                <AppText
                  style={[
                    styles.accordionTitle,
                    {
                      fontFamily: theme.typography.fontFamily.medium,
                      color: theme.colors.text,
                    },
                  ]}
                >
                  {copy.moreOptions}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {copy.moreOptionsHint}
                </AppText>
              </View>

              <View
                style={{
                  transform: [{ rotate: isAccordionOpen ? "-90deg" : "90deg" }],
                }}
              >
                <AppIcon
                  name="chevron"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </View>
            </Pressable>

            {/* Expanded Content (State 04) */}
            {isAccordionOpen ? (
              <View
                style={[
                  styles.accordionBody,
                  {
                    borderTopColor: theme.colors.border,
                    paddingTop: theme.spacing.md,
                    gap: theme.spacing.md,
                  },
                ]}
              >
                {/* Ngân sách */}
                <View style={{ gap: theme.spacing.xs }}>
                  <AppText
                    variant="label"
                    style={{
                      fontFamily: theme.typography.fontFamily.medium,
                      color: theme.colors.text,
                    }}
                  >
                    {copy.budget}
                  </AppText>
                  <View
                    style={[
                      styles.budgetInputWrapper,
                      {
                        borderColor: isBudgetFocused
                          ? theme.colors.focus
                          : theme.colors.borderStrong,
                        borderRadius: theme.radius.md,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <TextInput
                      value={budget}
                      onChangeText={handleBudgetChange}
                      ref={budgetField.ref}
                      accessibilityLabel={copy.budget}
                      maxLength={20}
                      onFocus={() => setIsBudgetFocused(true)}
                      onBlur={() => {
                        setIsBudgetFocused(false);
                        budgetField.onBlur();
                      }}
                      keyboardType="numeric"
                      placeholder={copy.budgetPlaceholder}
                      placeholderTextColor={theme.colors.textSecondary}
                      cursorColor={theme.colors.primaryText}
                      selectionColor={theme.colors.surfaceTint}
                      underlineColorAndroid="transparent"
                      style={[
                        styles.budgetInput,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.typography.fontFamily.regular,
                        },
                        webInputReset,
                      ]}
                    />
                    <AppText
                      style={[
                        styles.budgetSuffix,
                        {
                          color: theme.colors.primaryText,
                          fontFamily: theme.typography.fontFamily.bold,
                        },
                      ]}
                    >
                      VND
                    </AppText>
                  </View>
                  <AppText variant="caption" tone="muted">
                    {errors.budget ? (
                      <AppText accessibilityRole="alert" tone="error">
                        {errors.budget.message}
                      </AppText>
                    ) : (
                      copy.budgetHint
                    )}
                  </AppText>
                </View>

                {/* Sở thích trải nghiệm */}
                <View style={{ gap: theme.spacing.xs }}>
                  <AppText
                    variant="label"
                    style={{
                      fontFamily: theme.typography.fontFamily.medium,
                      color: theme.colors.text,
                    }}
                  >
                    {copy.preferencesTitle}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {copy.preferencesHint}
                  </AppText>

                  <View style={styles.chipsContainer}>
                    {tripPreferenceIds.map((chip) => {
                      const isSelected = selectedTags.includes(chip);
                      return (
                        <Pressable
                          key={copy.preferences[chip]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => toggleTag(chip)}
                          style={({ pressed }) => [
                            styles.chip,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.surfaceTint
                                : theme.colors.surface,
                              borderColor: isSelected
                                ? theme.colors.primaryText
                                : theme.colors.border,
                              borderRadius: theme.radius.full,
                              opacity: pressed ? theme.motion.pressOpacity : 1,
                            },
                          ]}
                        >
                          {isSelected ? (
                            <AppText
                              style={[
                                styles.chipCheck,
                                { color: theme.colors.primaryText },
                              ]}
                            >
                              ✓{" "}
                            </AppText>
                          ) : null}
                          <AppText
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? theme.colors.primaryText
                                  : theme.colors.textSecondary,
                                fontFamily: isSelected
                                  ? theme.typography.fontFamily.medium
                                  : theme.typography.fontFamily.regular,
                              },
                            ]}
                          >
                            {copy.preferences[chip]}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* Error Message Banner */}
          {error ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderColor: theme.colors.error,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText
                accessibilityRole="alert"
                tone="error"
                style={styles.errorText}
              >
                {error}
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky Bottom Action Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
            },
          ]}
        >
          <AppButton
            variant="raised"
            loading={isSubmitting}
            onPress={submit}
            style={styles.createButton}
          >
            {copy.createTrip}
          </AppButton>
          <AppText variant="caption" tone="muted" style={styles.bottomHintText}>
            {copy.createHint}
          </AppText>
        </View>

        {/* Modal Pickers */}
        <DestinationPickerSheet
          visible={showDestSheet}
          currentDestination={destination}
          currentProvinceId={destinationProvinceId}
          onSelect={handleSelectDestination}
          onClose={() => setShowDestSheet(false)}
        />

        <DateRangeSheet
          visible={showDateSheet}
          startDate={startDate}
          endDate={endDate}
          today={today}
          onApply={handleApplyDateRange}
          onClose={() => setShowDateSheet(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  backButton: {
    width: layout.compactTouchTarget,
    height: layout.compactTouchTarget,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.md,
  },
  headerSubtitle: {
    marginTop: spacing.xxs,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md + spacing.xxs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfoCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  destinationTitle: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
  },
  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCardTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.compactAction,
  },
  dateColumnsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + spacing.xxs,
  },
  dateColumnBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  dateVerticalDivider: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.sm + spacing.xxs,
  },
  dateValueText: {
    fontSize: typography.fontSize.compactAction,
    lineHeight: typography.lineHeight.compactAction,
  },
  durationBadge: {
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
  },
  titleInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  titleInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    height: "100%",
  },
  clearTitleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeading: {
    fontSize: typography.fontSize.md,
  },
  addPlaceDashedCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md + spacing.xxs,
    gap: spacing.md,
  },
  addPlaceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addPlaceTextCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  addPlaceTitle: {
    fontSize: typography.fontSize.sm,
  },
  stopsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stopItemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm + spacing.xxs,
    gap: spacing.sm + spacing.xxs,
  },
  stopIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stopIndexText: {
    fontSize: typography.fontSize.navigationLabel,
  },
  stopInfoCol: {
    flex: 1,
    justifyContent: "center",
  },
  stopNameText: {
    fontSize: typography.fontSize.sm,
  },
  removeStopBtn: {
    width: layout.compactTouchTarget,
    height: layout.compactTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreStopsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: layout.compactTouchTarget,
    gap: spacing.xs + spacing.xxs,
    marginTop: spacing.xs,
  },
  addMoreStopsText: {
    fontSize: typography.fontSize.compactAction,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md + spacing.xxs,
  },
  accordionTitle: {
    fontSize: typography.fontSize.md,
  },
  accordionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md + spacing.xxs,
  },
  budgetInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  budgetInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    height: "100%",
  },
  budgetSuffix: {
    fontSize: typography.fontSize.compactAction,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    minHeight: layout.compactTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    borderWidth: 1,
  },
  chipCheck: {
    fontSize: typography.fontSize.xs,
    fontWeight: "bold",
  },
  chipText: {
    fontSize: typography.fontSize.compactAction,
  },
  errorBanner: {
    borderWidth: 1,
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.compactAction,
    textAlign: "center",
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  createButton: {
    width: "100%",
    height: 48,
  },
  bottomHintText: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
