import { useRef } from "react";
import { FlatList, View } from "react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import { clockPattern } from "../schemas/trip-details-schema";
import { TripStartTimeField } from "./trip-start-time-field";
import { TripDetailsSheet } from "./trip-details-sheet";

type StopDraft = { date: string; time: string; duration: string; note: string };

export function ConnectedStopScheduleSheet({
  stop,
  date,
  days,
  editable,
  pending,
  problem,
  onReload,
  onSave,
  onRemove,
  onClose,
}: {
  stop: TripStop;
  date?: string;
  days: { date: string; dayNumber: number }[];
  editable: boolean;
  pending: boolean;
  problem?: string;
  onReload?: () => void;
  onSave: (draft: StopDraft) => Promise<void>;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useItineraryCopy();
  const { copy: details } = useTripDetailsCopy();
  const submitting = useRef(false);
  const schema = z.object({
    date: z
      .string()
      .refine(
        (value) => date === value || days.some((day) => day.date === value),
        copy.invalid,
      ),
    time: z
      .string()
      .refine(
        (value) => value === "" || clockPattern.test(value),
        details.invalidTime,
      ),
    duration: z
      .string()
      .refine(
        (value) => /^\d+$/.test(value) && +value >= 1 && +value <= 1440,
        copy.duration,
      ),
    note: z.string().trim().max(2000, details.invalidText),
  });
  const { control, handleSubmit, setValue, formState } = useForm<StopDraft>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: date ?? days[0]?.date ?? "",
      time: stop.time,
      duration: String(stop.durationMinutes ?? 45),
      note: stop.note ?? "",
    },
  });
  const selected = useWatch({ control, name: "date" });
  const submit = async () => {
    if (pending || submitting.current) return;
    submitting.current = true;
    try {
      await handleSubmit(onSave)();
    } finally {
      submitting.current = false;
    }
  };
  return (
    <TripDetailsSheet
      title={editable ? (date ? copy.edit : copy.schedule) : copy.details}
      onClose={onClose}
      dismissDisabled={pending}
      footer={
        editable ? (
          <AppButton
            variant="gradient"
            loading={pending}
            disabled={!selected || !!onReload}
            onPress={() => void submit()}
          >
            {details.save}
          </AppButton>
        ) : undefined
      }
    >
      <AppText variant="label">{stop.name[locale]}</AppText>
      {stop.address ? (
        <AppText variant="caption" tone="muted">
          {stop.address[locale]}
        </AppText>
      ) : null}
      {problem ? (
        <AppText accessibilityRole="alert" tone="error">
          {problem}
        </AppText>
      ) : null}
      {onReload ? (
        <AppButton size="small" variant="outline" onPress={onReload}>
          {copy.reload}
        </AppButton>
      ) : null}
      {editable ? (
        <>
          {!date ? (
            <>
              <AppText variant="label">{copy.day}</AppText>
              <FlatList
                horizontal
                data={days}
                keyExtractor={(day) => day.date}
                contentContainerStyle={{ gap: theme.spacing.sm }}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <AppButton
                    size="small"
                    variant={selected === item.date ? "soft" : "outline"}
                    accessibilityState={{ selected: selected === item.date }}
                    disabled={pending}
                    onPress={() => setValue("date", item.date)}
                  >{`${details.day} ${item.dayNumber} · ${item.date.slice(8)}/${item.date.slice(5, 7)}`}</AppButton>
                )}
              />
            </>
          ) : null}
          {formState.errors.date ? (
            <AppText tone="error">{formState.errors.date.message}</AppText>
          ) : null}
          <Controller
            control={control}
            name="time"
            render={({ field, fieldState }) => (
              <View pointerEvents={pending ? "none" : "auto"}>
                <TripStartTimeField
                  compact
                  label={details.arrival}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
                {field.value ? (
                  <AppButton
                    size="small"
                    variant="outline"
                    disabled={pending}
                    onPress={() => field.onChange("")}
                  >
                    {copy.clearTime}
                  </AppButton>
                ) : null}
              </View>
            )}
          />
          <Controller
            control={control}
            name="duration"
            render={({ field, fieldState }) => (
              <AppInput
                compact
                label={details.duration}
                keyboardType="number-pad"
                maxLength={4}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                editable={!pending}
              />
            )}
          />
          <Controller
            control={control}
            name="note"
            render={({ field, fieldState }) => (
              <AppInput
                compact
                label={details.note}
                multiline
                maxLength={2000}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                editable={!pending}
              />
            )}
          />
          {onRemove ? (
            <>
              <AppText variant="caption" tone="muted">
                {copy.removeHint}
              </AppText>
              <AppButton
                size="small"
                variant="outline"
                disabled={pending || !!onReload}
                onPress={onRemove}
                style={{ borderColor: theme.colors.error }}
              >
                <AppText variant="label" tone="error">
                  {copy.remove}
                </AppText>
              </AppButton>
            </>
          ) : null}
        </>
      ) : (
        <>
          <AppText>
            {stop.time || details.noTime} · {stop.durationMinutes ?? "—"}{" "}
            {details.minutes}
          </AppText>
          {stop.note ? <AppText>{stop.note}</AppText> : null}
        </>
      )}
    </TripDetailsSheet>
  );
}
