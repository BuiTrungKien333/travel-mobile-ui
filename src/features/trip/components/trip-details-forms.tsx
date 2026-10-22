import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Switch, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { stopDetailsSchema } from "../schemas/trip-details-schema";
import type { TripMutation } from "../types/trip-details-types";

type Commit = (mutation: TripMutation) => boolean;

export function StopDetailsForm({
  trip,
  stop,
  date,
  onCommit,
  onRemove,
}: {
  trip: Trip;
  stop: TripStop;
  date: string | null;
  onCommit: Commit;
  onRemove: () => void;
}) {
  const { copy, locale } = useTripDetailsCopy();
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
      <AppText variant="heading">{stop.name[locale]}</AppText>
      {stop.quickInfo?.admission ? (
        <AppText tone="muted" variant="caption">
          {copy.admission}: {stop.quickInfo.admission[locale]}
        </AppText>
      ) : null}
      {stop.quickInfo?.closesAt ? (
        <AppText tone="muted" variant="caption">
          {copy.closes}: {stop.quickInfo.closesAt}
        </AppText>
      ) : null}
      <AppText variant="label">{copy.chooseDay}</AppText>
      <Controller
        control={control}
        name="targetDate"
        render={({ field }) => (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm }}
          >
            <AppButton
              size="small"
              accessibilityState={{ selected: field.value === null }}
              variant={field.value === null ? "soft" : "outline"}
              onPress={() => field.onChange(null)}
            >
              {copy.pool}
            </AppButton>
            {trip.days.map((day, index) => (
              <AppButton
                key={day.date}
                accessibilityState={{ selected: field.value === day.date }}
                size="small"
                variant={field.value === day.date ? "soft" : "outline"}
                onPress={() => field.onChange(day.date)}
              >{`${copy.day} ${index + 1}`}</AppButton>
            ))}
          </ScrollView>
        )}
      />
      <Controller
        control={control}
        name="time"
        render={({ field, fieldState }) => (
          <AppInput
            label={copy.arrival}
            placeholder="09:30"
            keyboardType="numbers-and-punctuation"
            value={field.value}
            ref={field.ref}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
            maxLength={5}
          />
        )}
      />
      <Controller
        control={control}
        name="durationMinutes"
        render={({ field, fieldState }) => (
          <AppInput
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
        name="pinned"
        render={({ field }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="label">{copy.pin}</AppText>
              <AppText tone="muted" variant="caption">
                {copy.pinnedHint}
              </AppText>
            </View>
            <Switch
              accessibilityLabel={copy.pin}
              value={field.value}
              onValueChange={field.onChange}
            />
          </View>
        )}
      />
      <Controller
        control={control}
        name="note"
        render={({ field, fieldState }) => (
          <AppInput
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
            setError("root", { message: copy.duplicate });
        })}
      >
        {copy.save}
      </AppButton>
      <AppButton variant="outline" onPress={onRemove}>
        {date === null ? copy.remove : copy.unschedule}
      </AppButton>
    </>
  );
}
