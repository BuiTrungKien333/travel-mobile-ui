import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import type { z } from "zod";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import type { Trip } from "@/features/home/types/home-types";
import { dayDistance } from "@/features/home/utils/select-home";
import { useAppTheme } from "@/hooks/use-app-theme";
import { tripFormLimits, tripPreferenceIds } from "../constants/trip-form";
import { useTripCopy } from "../i18n/trip-copy";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { tripEditSchema } from "../schemas/trip-details-schema";
import type { TripMutation } from "../types/trip-details-types";
import {
  destinationRegion,
  formatBudget,
  formatDisplayDate,
} from "../utils/create-trip-formatters";
import { getTripTitle } from "../utils/trip-formatters";
import { DateRangeSheet } from "./date-range-sheet";
import { DestinationPickerSheet } from "./destination-picker-sheet";

export function TripEditForm({
  trip,
  today,
  onCommit,
  pending = false,
  allowPastDates = false,
}: {
  trip: Trip;
  today: string;
  onCommit: (mutation: TripMutation) => boolean | Promise<boolean>;
  pending?: boolean;
  allowPastDates?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const { copy: formCopy } = useTripCopy();
  const schema = tripEditSchema(copy);
  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, dirtyFields, defaultValues },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      destination: trip.destination,
      destinationProvinceId: trip.destinationProvinceId ?? null,
      startDate: trip.startDate ?? "",
      endDate: trip.endDate ?? "",
      title: getTripTitle(trip, locale),
      accommodation: trip.accommodation ?? "",
      notes: trip.notes ?? "",
      budget: trip.budget ? String(trip.budget.amount) : "",
      preferences: trip.preferences ?? [],
    },
  });
  const busy = pending || isSubmitting;
  const [destination, startDate, endDate, destinationProvinceId] = useWatch({
    control,
    name: ["destination", "startDate", "endDate", "destinationProvinceId"],
  });
  const [picker, setPicker] = useState<"destination" | "dates" | null>(null);
  const [moreOpen, setMoreOpen] = useState(
    !!(
      trip.accommodation ||
      trip.notes ||
      trip.budget ||
      trip.preferences?.length
    ),
  );
  const card = {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.softActionBorder,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  };
  return (
    <>
      <Pressable
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`${formCopy.destination}: ${destination || formCopy.chooseDestination}`}
        onPress={() => {
          Keyboard.dismiss();
          setPicker("destination");
        }}
        style={({ pressed }) => [
          card,
          styles.row,
          { opacity: pressed ? theme.motion.pressOpacity : 1 },
        ]}
      >
        <AppIcon
          name="pin"
          size={theme.layout.iconSmall}
          color={theme.colors.primaryText}
        />
        <View style={[styles.grow, { gap: theme.spacing.xs }]}>
          <AppText variant="caption" tone="muted">
            {formCopy.destination}
          </AppText>
          <AppText
            variant="label"
            style={{ fontSize: theme.typography.fontSize.sm }}
          >
            {destination || formCopy.chooseDestination}
          </AppText>
          <AppText variant="caption" tone="muted">
            {destinationRegion(destination, formCopy)}
          </AppText>
        </View>
        <AppIcon
          name="chevron"
          size={theme.layout.iconSmall}
          color={theme.colors.textSecondary}
        />
      </Pressable>
      {errors.destination ? (
        <AppText variant="caption" tone="error" accessibilityRole="alert">
          {errors.destination.message}
        </AppText>
      ) : destination !== trip.destination ? (
        <AppText variant="caption" tone="muted">
          {copy.editDestinationHint}
        </AppText>
      ) : null}
      <Pressable
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`${formCopy.tripDates}: ${startDate ? formatDisplayDate(startDate, locale) : formCopy.chooseDates}${endDate ? ` – ${formatDisplayDate(endDate, locale)}` : ""}`}
        onPress={() => {
          Keyboard.dismiss();
          setPicker("dates");
        }}
        style={({ pressed }) => [
          card,
          { opacity: pressed ? theme.motion.pressOpacity : 1 },
        ]}
      >
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          <AppIcon
            name="calendar"
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
          <AppText variant="caption" tone="muted" style={styles.grow}>
            {formCopy.tripDates}
          </AppText>
          {startDate && endDate ? (
            <AppText variant="caption" tone="primary">
              {dayDistance(startDate, endDate) + 1} {formCopy.days}
            </AppText>
          ) : null}
          <AppIcon
            name="chevron"
            size={theme.layout.iconSmall}
            color={theme.colors.textSecondary}
          />
        </View>
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          <View style={[styles.grow, { gap: theme.spacing.xs }]}>
            <AppText variant="caption" tone="muted">
              {formCopy.startDate}
            </AppText>
            <AppText variant="label">
              {formatDisplayDate(startDate, locale)}
            </AppText>
          </View>
          <AppIcon
            name="arrow"
            size={theme.layout.iconSmall}
            color={theme.colors.textSecondary}
          />
          <View
            style={[
              styles.grow,
              { gap: theme.spacing.xs, alignItems: "flex-end" },
            ]}
          >
            <AppText variant="caption" tone="muted">
              {formCopy.endDate}
            </AppText>
            <AppText variant="label">
              {formatDisplayDate(endDate, locale)}
            </AppText>
          </View>
        </View>
      </Pressable>
      {errors.startDate ? (
        <AppText variant="caption" tone="error" accessibilityRole="alert">
          {errors.startDate.message}
        </AppText>
      ) : null}
      {startDate &&
      endDate &&
      trip.days.some(
        (day) =>
          day.stops.length > 0 && (day.date < startDate || day.date > endDate),
      ) ? (
        <AppText variant="caption" tone="muted">
          {copy.datesHint}
        </AppText>
      ) : null}
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <AppInput
            editable={!busy}
            compact
            label={formCopy.tripTitle}
            placeholder={formCopy.titlePlaceholder}
            value={field.value}
            ref={field.ref}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            maxLength={tripFormLimits.title}
            helperText={formCopy.titleHint}
            trailingAction={
              field.value ? (
                <Pressable
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={formCopy.clearTitle}
                  onPress={() => field.onChange("")}
                  style={{
                    minHeight: theme.layout.compactTouchTarget,
                    width: theme.layout.compactTouchTarget,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon
                    name="close"
                    size={theme.layout.iconSmall}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              ) : null
            }
          />
        )}
      />
      <View style={card}>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ expanded: moreOpen }}
          aria-expanded={moreOpen}
          onPress={() => setMoreOpen((value) => !value)}
          style={[
            styles.row,
            {
              minHeight: theme.layout.compactTouchTarget,
              gap: theme.spacing.sm,
            },
          ]}
        >
          <AppIcon
            name="edit"
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
          <AppText variant="label" style={styles.grow}>
            {formCopy.moreOptions}
          </AppText>
          <AppIcon
            name={moreOpen ? "up" : "down"}
            size={theme.layout.iconSmall}
            color={theme.colors.textSecondary}
          />
        </Pressable>
        {moreOpen ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Controller
              control={control}
              name="budget"
              render={({ field, fieldState }) => (
                <AppInput
                  editable={!busy}
                  compact
                  label={formCopy.budget}
                  placeholder={formCopy.budgetPlaceholder}
                  keyboardType="number-pad"
                  value={formatBudget(field.value, locale)}
                  ref={field.ref}
                  onChangeText={(value) =>
                    field.onChange(value.replace(/\D/g, ""))
                  }
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  helperText={formCopy.budgetHint}
                  maxLength={
                    formatBudget(String(tripFormLimits.budget), locale).length
                  }
                  trailingAction={
                    <AppText
                      variant="caption"
                      tone="muted"
                      style={{ paddingRight: theme.spacing.md }}
                    >
                      VND
                    </AppText>
                  }
                />
              )}
            />
            <View style={{ gap: theme.spacing.sm }}>
              <AppText variant="caption">{formCopy.preferencesTitle}</AppText>
              <Controller
                control={control}
                name="preferences"
                render={({ field }) => (
                  <View
                    style={[
                      styles.row,
                      { flexWrap: "wrap", gap: theme.spacing.xs },
                    ]}
                  >
                    {tripPreferenceIds.map((id) => {
                      const selected = field.value.includes(id);
                      return (
                        <Pressable
                          disabled={busy}
                          key={id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          aria-checked={selected}
                          onPress={() =>
                            field.onChange(
                              selected
                                ? field.value.filter((value) => value !== id)
                                : [...field.value, id],
                            )
                          }
                          style={({ pressed }) => ({
                            minHeight: theme.layout.compactTouchTarget,
                            paddingHorizontal: theme.spacing.sm,
                            paddingVertical: theme.spacing.xs,
                            borderRadius: theme.radius.full,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: selected
                              ? theme.colors.primaryText
                              : theme.colors.border,
                            backgroundColor: selected
                              ? theme.colors.surfaceTint
                              : theme.colors.surface,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: theme.spacing.xs,
                            opacity: pressed ? theme.motion.pressOpacity : 1,
                          })}
                        >
                          {selected ? (
                            <AppIcon
                              name="check"
                              size={theme.layout.iconSmall}
                              color={theme.colors.primaryText}
                            />
                          ) : null}
                          <AppText
                            variant="caption"
                            tone={selected ? "primary" : "muted"}
                          >
                            {formCopy.preferences[id]}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </View>
            <Controller
              control={control}
              name="accommodation"
              render={({ field, fieldState }) => (
                <AppInput
                  editable={!busy}
                  compact
                  label={copy.accommodation}
                  placeholder={copy.accommodationPlaceholder}
                  value={field.value}
                  ref={field.ref}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  maxLength={200}
                />
              )}
            />
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <AppInput
                  editable={!busy}
                  compact
                  label={copy.tripNotes}
                  multiline
                  value={field.value}
                  ref={field.ref}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  maxLength={1000}
                  style={{
                    minHeight: theme.layout.touchTarget + theme.spacing.lg,
                    textAlignVertical: "top",
                  }}
                />
              )}
            />
          </View>
        ) : null}
      </View>
      <AppButton
        size="small"
        variant="gradient"
        disabled={!isDirty}
        loading={busy}
        onPress={handleSubmit(
          async ({ startDate: nextStart, endDate: nextEnd, ...values }) => {
            Keyboard.dismiss();
            const datesChanged =
              nextStart !== (defaultValues?.startDate ?? "") ||
              nextEnd !== (defaultValues?.endDate ?? "");
            await onCommit({
              kind: "info",
              values,
              changedFields: (
                [
                  "title",
                  "destination",
                  "destinationProvinceId",
                  "budget",
                  "preferences",
                  "accommodation",
                  "notes",
                ] as const
              ).filter((field) => dirtyFields[field]),
              ...(datesChanged && nextStart && nextEnd
                ? { dateRange: { startDate: nextStart, endDate: nextEnd } }
                : {}),
            });
          },
          (fieldErrors) => {
            if (
              fieldErrors.budget ||
              fieldErrors.accommodation ||
              fieldErrors.notes ||
              fieldErrors.preferences
            )
              setMoreOpen(true);
            if (fieldErrors.destination) setPicker("destination");
            else if (fieldErrors.startDate || fieldErrors.endDate)
              setPicker("dates");
          },
        )}
      >
        {copy.save}
      </AppButton>
      {picker === "destination" ? (
        <DestinationPickerSheet
          visible
          currentDestination={destination}
          currentProvinceId={destinationProvinceId}
          onSelect={(value, provinceId) => {
            setValue("destinationProvinceId", provinceId ?? null, {
              shouldDirty: true,
            });
            setValue("destination", value, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
      {picker === "dates" ? (
        <DateRangeSheet
          visible
          allowPastDates={allowPastDates}
          startDate={startDate}
          endDate={endDate}
          today={
            trip.startDate && trip.startDate < today ? trip.startDate : today
          }
          onApply={(start, end) => {
            setValue("startDate", start, { shouldDirty: true });
            setValue("endDate", end, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1, minWidth: 0 },
});
