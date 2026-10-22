import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Keyboard, Pressable, StyleSheet, Switch, View } from "react-native";
import type { z } from "zod";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import type { Trip, TripDay } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getPlacesForDestination } from "../data/place-bank";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { tripStartPointSchema } from "../schemas/trip-details-schema";
import type { TripMutation } from "../types/trip-details-types";
import { TripStartTimeField } from "./trip-start-time-field";

export function TripStartPointForm({
  trip,
  day,
  onCommit,
}: {
  trip: Trip;
  day: TripDay;
  onCommit: (mutation: TripMutation) => boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const [shortcut, setShortcut] = useState<"home" | "stay" | null>(null);
  const [searching, setSearching] = useState(false);
  const [locationNotice, setLocationNotice] = useState(false);
  const schema = tripStartPointSchema(copy);
  const { control, handleSubmit, setValue, setFocus } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      startLocation: day.startLocation || trip.accommodation || "",
      startTime: day.startTime ?? "08:30",
      returnToStart: day.returnToStart ?? false,
    },
  });
  const location = useWatch({ control, name: "startLocation" });
  const query = location.trim().toLocaleLowerCase(locale);
  const matches =
    searching && query.length > 1
      ? getPlacesForDestination(trip.destination)
          .filter(
            (place) =>
              place.name.vi.toLowerCase().includes(query) ||
              place.name.en.toLowerCase().includes(query),
          )
          .slice(0, 3)
      : [];
  const options: {
    id: "current" | "home" | "stay";
    icon: AppIconName;
    label: string;
  }[] = [
    { id: "current", icon: "locate", label: copy.originCurrent },
    { id: "home", icon: "home", label: copy.originHome },
    { id: "stay", icon: "trips", label: copy.originStay },
  ];
  function chooseShortcut(id: (typeof options)[number]["id"]) {
    setSearching(false);
    setLocationNotice(id === "current");
    if (id === "current") {
      setFocus("startLocation");
      return;
    }
    setShortcut(id);
    setValue("startLocation", id === "stay" ? (trip.accommodation ?? "") : "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (id === "stay" && trip.accommodation) Keyboard.dismiss();
    else setFocus("startLocation");
  }
  return (
    <>
      <View style={{ gap: theme.spacing.md }}>
        <Controller
          control={control}
          name="startLocation"
          render={({ field, fieldState }) => (
            <AppInput
              label={copy.originSearch}
              placeholder={
                shortcut === "home"
                  ? copy.originHomePlaceholder
                  : shortcut === "stay"
                    ? copy.originStayPlaceholder
                    : copy.originSearchPlaceholder
              }
              leadingIcon={
                <AppIcon
                  name="search"
                  size={theme.layout.iconSmall}
                  color={theme.colors.textSecondary}
                />
              }
              value={field.value}
              trailingAction={
                field.value ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.originClearSearch}
                    onPress={() => {
                      field.onChange("");
                      setSearching(false);
                      setShortcut(null);
                      setLocationNotice(false);
                      setFocus("startLocation");
                    }}
                    style={({ pressed }) => ({
                      width: theme.layout.compactTouchTarget,
                      minHeight: theme.layout.compactTouchTarget,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    })}
                  >
                    <AppIcon
                      name="close"
                      size={theme.layout.iconSmall}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                ) : null
              }
              ref={field.ref}
              onBlur={field.onBlur}
              onChangeText={(value) => {
                field.onChange(value);
                setSearching(true);
                setLocationNotice(false);
              }}
              returnKeyType="search"
              onSubmitEditing={() => {
                setSearching(true);
                Keyboard.dismiss();
              }}
              error={fieldState.error?.message}
              maxLength={200}
              style={{ paddingLeft: theme.spacing.sm }}
            />
          )}
        />
        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: shortcut === option.id }}
              onPress={() => chooseShortcut(option.id)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: theme.layout.touchTarget + theme.spacing.lg,
                padding: theme.spacing.sm,
                gap: theme.spacing.xs,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.sm,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor:
                  shortcut === option.id
                    ? theme.colors.primaryText
                    : theme.colors.softActionBorder,
                backgroundColor:
                  shortcut === option.id
                    ? theme.colors.surfaceTint
                    : theme.colors.surface,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <AppIcon
                name={option.icon}
                size={theme.layout.iconSmall}
                color={theme.colors.primaryText}
              />
              <AppText variant="caption" style={{ textAlign: "center" }}>
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        {locationNotice ? (
          <AppText
            variant="caption"
            tone="muted"
            accessibilityLiveRegion="polite"
          >
            {copy.originLocationUnavailable}
          </AppText>
        ) : null}
        {matches.length ? (
          <View style={{ gap: theme.spacing.xs }}>
            {matches.map((place) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={`${copy.originChoose} ${place.name[locale]}`}
                onPress={() => {
                  setValue("startLocation", place.name[locale], {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setSearching(false);
                  setShortcut(null);
                  Keyboard.dismiss();
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    minHeight: theme.layout.compactTouchTarget,
                    gap: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.sm,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  },
                ]}
              >
                <AppIcon
                  name="pin"
                  size={theme.layout.iconSmall}
                  color={theme.colors.textSecondary}
                />
                <AppText variant="caption" style={{ flex: 1 }}>
                  {place.name[locale]}
                </AppText>
              </Pressable>
            ))}
            <AppText variant="caption" tone="muted">
              {copy.originSearchPreview}
            </AppText>
          </View>
        ) : null}
      </View>
      <Controller
        control={control}
        name="startTime"
        render={({ field, fieldState }) => (
          <TripStartTimeField
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="returnToStart"
        render={({ field }) => (
          <View
            style={[
              styles.row,
              {
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surfaceTint,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.softActionBorder,
              },
            ]}
          >
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="label">{copy.returnToStart}</AppText>
              <AppText variant="caption" tone="muted">
                {copy.originReturnHint}
              </AppText>
            </View>
            <View
              style={{
                minHeight: theme.layout.compactTouchTarget,
                justifyContent: "center",
              }}
            >
              <Switch
                accessibilityLabel={copy.returnToStart}
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primaryText,
                }}
              />
            </View>
          </View>
        )}
      />
      <AppButton
        variant="gradient"
        style={{ borderRadius: theme.radius.sm }}
        onPress={handleSubmit((values) => {
          Keyboard.dismiss();
          onCommit({ kind: "day", date: day.date, values });
        })}
      >
        {copy.originSave}
      </AppButton>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
