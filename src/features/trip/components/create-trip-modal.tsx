import { useReducedMotion } from "react-native-reanimated";
import { useController, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { TripPreference } from "@/features/home/types/home-types";
import { dayDistance } from "@/features/home/utils/select-home";
import { useAppTheme } from "@/hooks/use-app-theme";

import { useTripCopy } from "../i18n/trip-copy";
import { createTripSchema, type CreateTripInput, type CreateTripOutput } from "../schemas/create-trip-schema";
import { confirmDiscard } from "../utils/confirm-discard";
import { formatBudget, generateDefaultTitle } from "../utils/create-trip-formatters";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { router } from "expo-router";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { ApiError } from "@/services/api/api-error";
import { useCreateTripMutation } from "../api/trip-queries";
import { createTripRequestId, tripLocalToday, type CreateTripPayload } from "../api/trip-contract";
import { tripApiErrorMessage, useTripIntegrationCopy } from "../i18n/trip-integration-copy";
import { DateRangeSheet } from "./date-range-sheet";
import { DestinationPickerSheet } from "./destination-picker-sheet";
import { PlacePickerScreen } from "../screens/place-picker-screen";
import { ConnectedPlacePickerScreen } from "../screens/connected-place-picker-screen";
import { createTripStyles as styles } from "./create-trip-styles";
import { CreateTripDestinationCard } from "./create-trip-destination-card";
import { CreateTripDatesCard } from "./create-trip-dates-card";
import { CreateTripNameCard } from "./create-trip-name-card";
import { CreateTripStopsCard } from "./create-trip-stops-card";
import { CreateTripOptionsCard } from "./create-trip-options-card";

type CreateTripModalProps = {
  visible: boolean;
  onClose: () => void;
};

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
  const submitLock = useRef(false);
  const createAttempt = useRef<{ fingerprint: string; id: string; } | null>(
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
  const durationDays =
    startDate && endDate && endDate >= startDate
      ? dayDistance(startDate, endDate) + 1
      : 0;

  const requestClose = () => {
    if (submitLock.current || isSubmitting) return;
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
  const submitForm = handleSubmit(
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
          initialPlaceIds: values.initialStops.map(
            (stop) => stop.placeId ?? stop.id,
          ),
        };
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

  const submit = async () => {
    // Guard before async validation, rather than waiting for the next loading-state render.
    if (submitLock.current) return;
    submitLock.current = true;
    try {
      await submitForm();
    } finally {
      submitLock.current = false;
    }
  };

  return (
    <Modal
      visible
      animationType={reduceMotion ? "none" : "slide"}
      statusBarTranslucent
      onRequestClose={
        showPlaceSheet ? () => setShowPlaceSheet(false) : requestClose
      }
    >
      {showPlaceSheet && !UI_PREVIEW_ENABLED ? (
        <ConnectedPlacePickerScreen
          destination={destination}
          scope={{ provinceId: destinationProvinceId }}
          initialSelected={selectedStops}
          onApply={(stops) => {
            setValue("initialStops", stops, { shouldDirty: true });
            setNotice("");
            setShowPlaceSheet(false);
          }}
          onClose={() => setShowPlaceSheet(false)}
        />
      ) : showPlaceSheet ? (
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
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
          showPlaceSheet ? { display: "none" } : undefined,
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + theme.spacing.sm,
              paddingBottom: theme.spacing.sm,
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
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppIcon name="back" size={20} color={theme.colors.text} />
          </Pressable>

          <View style={styles.headerTextCol}>
            <AppText
              variant="subheading"
              accessibilityRole="header"
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
          <CreateTripDestinationCard destination={destination} setShowDestSheet={setShowDestSheet} />

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
          <CreateTripDatesCard startDate={startDate} endDate={endDate} durationDays={durationDays} setShowDateSheet={setShowDateSheet} />

          {errors.startDate || errors.endDate ? (
            <AppText accessibilityRole="alert" tone="error" variant="caption">
              {errors.startDate?.message || errors.endDate?.message}
            </AppText>
          ) : null}
          {/* Section 3: Tên chuyến đi */}
          <CreateTripNameCard tripTitle={tripTitle} titleEdited={titleEdited} titleField={titleField} errors={errors} />

          {/* Section 4: Địa điểm dự kiến */}
          <CreateTripStopsCard selectedStops={selectedStops} destination={destination} setShowDestSheet={setShowDestSheet} setShowPlaceSheet={setShowPlaceSheet} handleRemoveStop={handleRemoveStop} />

          <AppText variant="caption" tone="muted">
            {detailsCopy.savedPoolHint}
          </AppText>
          {/* Section 5: Accordion (Tùy chọn thêm) */}
          <CreateTripOptionsCard isAccordionOpen={isAccordionOpen} setIsAccordionOpen={setIsAccordionOpen} budget={budget} handleBudgetChange={handleBudgetChange} budgetField={budgetField} errors={errors} selectedTags={selectedTags} toggleTag={toggleTag} />

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
                variant="bodyLarge"
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
            labelSize="large"
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
