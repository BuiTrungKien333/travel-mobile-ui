import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { stopDetailsSchema } from "../schemas/trip-details-schema";
import { TripStartTimeField } from "./trip-start-time-field";
import { PlaceTargetSelector } from "./place-picker-list-items";
import type { TripMutation } from "../types/trip-details-types";

type Commit = (mutation: TripMutation) => boolean;

export function StopDetailsForm({
  trip,
  stop,
  date,
  onCommit,
}: {
  trip: Trip;
  stop: TripStop;
  date: string | null;
  onCommit: Commit;
}) {
  const { copy } = useTripDetailsCopy();
  const theme = useAppTheme();
  const schema = stopDetailsSchema(copy);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
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
              onChange={field.onChange}
            />
          </View>
        )}
      />
      <Controller
        control={control}
        name="time"
        render={({ field, fieldState }) => (
          <TripStartTimeField
            compact
            label={copy.arrival}
            hint={copy.stopArrivalHint}
            value={field.value}
            onChange={field.onChange}
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
      {errors.root?.message ? (
        <AppText accessibilityRole="alert" tone="error">
          {errors.root.message}
        </AppText>
      ) : null}
      <AppButton
        size="small"
        variant="gradient"
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
