import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Switch, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { clockPattern, stopDetailsSchema } from "../schemas/trip-details-schema";
import { TripStartTimeField } from "./trip-start-time-field";
import { PlaceTargetSelector } from "./place-picker-list-items";
import type { TripMutation } from "../types/trip-details-types";

type Commit = (mutation: TripMutation) => boolean;

export function StopDetailsForm({
  trip,
  stop,
  date,
  onCommit,
  saving = false,
  onDirtyChange,
}: {
  trip: Trip;
  stop: TripStop;
  date: string | null;
  onCommit: Commit;
  saving?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { copy } = useTripDetailsCopy();
  const theme = useAppTheme();
  const schema = stopDetailsSchema(copy);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      time: stop.time,
      durationMinutes: String(stop.durationMinutes ?? 45),
      pinned: stop.pinned ?? false,
      note: stop.note ?? "",
      targetDate: date,
    },
  });
  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  const time = useWatch({ control, name: "time" });
  const targetDate = useWatch({ control, name: "targetDate" });
  const canPin = targetDate !== null && clockPattern.test(time);
  return (
    <>
      <Controller
        control={control}
        name="targetDate"
        render={({ field }) => (
          <View style={{ marginHorizontal: -theme.spacing.lg }}>
            <PlaceTargetSelector
              destination={trip.destination}
              days={trip.days}
              date={field.value}
              onChange={(value) => { field.onChange(value); if (value === null) setValue("pinned", false); }}
            />
          </View>
        )}
      />
      <Controller
        control={control}
        name="time"
        render={({ field, fieldState }) => (
          <TripStartTimeField
            ref={field.ref}
            compact
            label={copy.arrival}
            hint={copy.stopArrivalHint}
            value={field.value}
            onChange={(value) => { field.onChange(value); if (!clockPattern.test(value)) setValue("pinned", false); }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="durationMinutes"
        render={({ field, fieldState }) => (
          <AppInput
            compact
            label={copy.duration}
            keyboardType="number-pad"
            value={field.value}
            ref={field.ref}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            maxLength={3}
          />
        )}
      />
      <Controller
        control={control}
        name="note"
        render={({ field, fieldState }) => (
          <AppInput
            compact
            label={copy.note}
            placeholder={copy.notePlaceholder}
            multiline
            value={field.value}
            ref={field.ref}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            maxLength={500}
          />
        )}
      />
      <Controller control={control} name="pinned" render={({ field }) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption">{copy.pin}</AppText>
            <AppText variant="caption" tone="muted">{canPin ? copy.pinnedHint : copy.pinTimeRequired}</AppText>
          </View>
          <Switch accessibilityLabel={copy.pin} disabled={!canPin || saving} value={field.value} onValueChange={field.onChange}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryText }} />
        </View>
      )} />
      {errors.root?.message ? (
        <AppText accessibilityRole="alert" tone="error">
          {errors.root.message}
        </AppText>
      ) : null}
      <AppButton
        size="small"
        variant="gradient"
        loading={saving}
        onPress={handleSubmit(({ targetDate, ...values }) => {
          if (
            !onCommit({
              kind: "stop",
              date,
              stopId: stop.id,
              targetDate,
              values,
            })
          )
            setError("root", { message: copy.stopUpdateError });
        })}
      >
        {copy.save}
      </AppButton>
    </>
  );
}
