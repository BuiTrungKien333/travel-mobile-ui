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
import { searchPlaces } from "../utils/place-search";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { tripDayScheduleSchema } from "../schemas/trip-details-schema";
import type { TripMutation } from "../types/trip-details-types";
import { TripStartTimeField } from "./trip-start-time-field";
import { TripVisitDurationRow } from "./trip-visit-duration-row";
import { useDebouncedValue, usePlaceSearchQuery } from "../api/maps-hooks";
import type { PlaceCoordinate } from "../utils/place-search";

export function TripDayScheduleForm({
  trip,
  day,
  onCommit,
  saving = false,
  itineraryUpdatedAt,
}: {
  trip: Trip;
  day: TripDay;
  onCommit: (mutation: TripMutation) => boolean;
  saving?: boolean;
  itineraryUpdatedAt?: string | null;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const [base] = useState({ version: trip.serverVersion, itineraryUpdatedAt });
  const [shortcut, setShortcut] = useState<"home" | "stay" | null>(null);
  const [searching, setSearching] = useState(false);
  const [locationNotice, setLocationNotice] = useState(false);
  const [dayChoicesOpen, setDayChoicesOpen] = useState(false);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const schema = tripDayScheduleSchema(copy);
  const {
    control,
    handleSubmit,
    setValue,
    setFocus,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      startLocation: day.startLocation ?? "",
      startCoordinate: day.startCoordinate ?? null,
      startTime: day.startTime ?? "",
      returnToStart: day.returnToStart ?? false,
      durations: day.stops.map((stop) => ({
        stopId: stop.id,
        minutes: String(stop.durationMinutes ?? 45),
      })),
    },
  });
  const location = useWatch({ control, name: "startLocation" });
  const coordinate = useWatch({ control, name: "startCoordinate" });
  const searchText = useDebouncedValue(searching ? location.trim() : "");
  const currentSearch = searching && searchText === location.trim();
  const searchQuery = usePlaceSearchQuery(searchText, day.stops.find((stop) => stop.location)?.location);
  const remoteMatches = currentSearch ? (searchQuery.data ?? []).filter((place) => place.latitude !== null && place.longitude !== null) : [];
  const durationValues = useWatch({ control, name: "durations" });
  const total = durationValues.reduce((sum, entry) => {
    const value = Number(entry.minutes);
    return (
      sum + (Number.isInteger(value) && value >= 5 && value <= 480 ? value : 0)
    );
  }, 0);
  const totalText =
    total >= 60
      ? `${Math.floor(total / 60)} ${copy.timeHour.toLocaleLowerCase(locale)}${total % 60 ? ` ${total % 60} ${copy.minutes}` : ""}`
      : `${total} ${copy.minutes}`;
  const query = location.trim();
  const candidates = Array.from(
    new Map(
      day.stops.filter((place) => place.location).map((place) => [place.id, place]),
    ).values(),
  );
  const matches =
    searching && query.length > 1
      ? searchPlaces(candidates, query).slice(0, 4)
      : [];
  function choosePlace(name: string, point?: PlaceCoordinate) {
    setValue("startCoordinate", point ?? null, { shouldDirty: true });
    setValue("startLocation", name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSearching(false);
    setDayChoicesOpen(false);
    setShortcut(null);
    setLocationNotice(false);
    Keyboard.dismiss();
  }
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
    setDayChoicesOpen(false);
    setLocationNotice(id === "current");
    if (id === "current") {
      setFocus("startLocation");
      return;
    }
    setShortcut(id);
    setValue("startCoordinate", null, { shouldDirty: true });
    setValue("startLocation", id === "stay" ? (trip.accommodation ?? "") : "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (id === "stay" && trip.accommodation) setSearching(true);
    if (id === "stay" && trip.accommodation) Keyboard.dismiss();
    else setFocus("startLocation");
  }
  return (
    <>
      <View style={{ gap: theme.spacing.sm }}>
        <Controller
          control={control}
          name="startLocation"
          render={({ field, fieldState }) => (
            <AppInput
              compact
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
                      setValue("startCoordinate", null, { shouldDirty: true });
                      setSearching(false);
                      setDayChoicesOpen(false);
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
                setValue("startCoordinate", null, { shouldDirty: true });
                setSearching(true);
                setDayChoicesOpen(false);
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
        <View
          style={[styles.row, { gap: theme.spacing.xs, alignItems: "stretch" }]}
        >
          {options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: shortcut === option.id }}
              onPress={() => chooseShortcut(option.id)}
              style={({ pressed }) => ({
                flex: 1,
                flexBasis: 0,
                minWidth: 0,
                minHeight: theme.layout.touchTarget,
                padding: theme.spacing.xxs,
                gap: theme.spacing.xxs,
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
              <View
                style={{
                  minHeight: theme.typography.lineHeight.xs * 2,
                  justifyContent: "center",
                }}
              >
                <AppText variant="caption" style={{ textAlign: "center" }}>
                  {option.label}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: dayChoicesOpen }}
          onPress={() => {
            Keyboard.dismiss();
            setSearching(false);
            setDayChoicesOpen((value) => !value);
          }}
          style={[
            styles.row,
            {
              minHeight: theme.layout.compactTouchTarget,
              gap: theme.spacing.sm,
            },
          ]}
        >
          <AppIcon
            name="route"
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
          <AppText variant="caption" tone="primary" style={{ flex: 1 }}>
            {copy.originDayPlaces} ({day.stops.length})
          </AppText>
          <AppIcon
            name={dayChoicesOpen ? "up" : "down"}
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
        </Pressable>
        {dayChoicesOpen ? (
          <View
            style={{
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.softActionBorder,
              borderRadius: theme.radius.sm,
              paddingHorizontal: theme.spacing.sm,
            }}
          >
            {day.stops.length ? (
              day.stops.map((stop, index) => (
                <Pressable
                  key={stop.id}
                  disabled={!stop.location}
                  accessibilityRole="button"
                  accessibilityLabel={`${copy.originChoose} ${stop.name[locale]}`}
                  onPress={() => choosePlace(stop.name[locale], stop.location)}
                  style={({ pressed }) => ({
                    minHeight: theme.layout.compactTouchTarget,
                    justifyContent: "center",
                    borderBottomWidth:
                      index < day.stops.length - 1
                        ? StyleSheet.hairlineWidth
                        : 0,
                    borderBottomColor: theme.colors.softActionBorder,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  })}
                >
                  <AppText variant="caption">{stop.name[locale]}</AppText>
                </Pressable>
              ))
            ) : (
              <AppText
                variant="caption"
                tone="muted"
                style={{ paddingVertical: theme.spacing.sm }}
              >
                {copy.originNoDayPlaces}
              </AppText>
            )}
          </View>
        ) : null}
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
                  choosePlace(
                    place.locationType === "address"
                      ? (place.address?.[locale] ?? place.name[locale])
                      : place.name[locale],
                    place.location,
                  );
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
        {coordinate ? <AppText variant="caption" tone="primary">{copy.originSelected}</AppText> : null}
        {searching && query.length >= 2 && (!currentSearch || searchQuery.isFetching) ? <AppText variant="caption" tone="muted">{copy.originSearching}</AppText> : null}
        {currentSearch && searchQuery.isError ? <View style={{ gap: theme.spacing.xs }}>
          <AppText accessibilityRole="alert" variant="caption" tone="error">{copy.originSearchFailed}</AppText>
          <AppButton size="small" variant="soft" onPress={() => { void searchQuery.refetch(); }}>{copy.retry}</AppButton>
        </View> : null}
        {searching ? remoteMatches.map((place, index) => (
          <Pressable key={`${place.providerPlaceId ?? place.name}:${index}`} accessibilityRole="button"
            accessibilityLabel={`${copy.originChoose} ${place.name}`}
            onPress={() => { if (place.latitude !== null && place.longitude !== null)
              choosePlace(place.name.slice(0, 200), { latitude: place.latitude, longitude: place.longitude }); }}
            style={({ pressed }) => ({ minHeight: theme.layout.touchTarget, padding: theme.spacing.sm,
              gap: theme.spacing.xxs, opacity: pressed ? theme.motion.pressOpacity : 1 })}>
            <AppText variant="caption">{place.name}</AppText>
            {place.address ? <AppText variant="caption" tone="muted">{place.address}</AppText> : null}
          </Pressable>
        )) : null}
        {currentSearch && query.length > 1 && !matches.length && !remoteMatches.length && !searchQuery.isFetching && !searchQuery.isError ? (
          <AppText variant="caption" tone="muted">
            {copy.originSearchEmpty}
          </AppText>
        ) : null}
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <Controller
          control={control}
          name="startTime"
          render={({ field, fieldState }) => (
            <TripStartTimeField
              compact
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <View
          style={[
            styles.row,
            {
              justifyContent: "space-between",
              gap: theme.spacing.sm,
              flexWrap: "wrap",
            },
          ]}
        >
          <AppText variant="label">{copy.dayVisitDurations}</AppText>
          <AppText
            variant="caption"
            tone="muted"
            accessibilityLiveRegion="polite"
          >
            {copy.dayVisitTotal}: {totalText}
          </AppText>
        </View>
        {day.stops.length ? (
          day.stops.map((stop, index) => (
            <Controller
              key={stop.id}
              control={control}
              name={`durations.${index}.minutes`}
              render={({ field, fieldState }) => (
                <TripVisitDurationRow
                  stop={stop}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  expanded={expandedStop === stop.id}
                  onToggle={() =>
                    setExpandedStop((id) => (id === stop.id ? null : stop.id))
                  }
                  error={fieldState.error?.message}
                />
              )}
            />
          ))
        ) : (
          <AppText variant="caption" tone="muted">
            {copy.dayVisitEmpty}
          </AppText>
        )}
      </View>
      <Controller
        control={control}
        name="returnToStart"
        render={({ field }) => (
          <View
            style={[
              styles.row,
              {
                marginTop: theme.spacing.sm,
                padding: theme.spacing.sm,
                gap: theme.spacing.sm,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surfaceTint,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.softActionBorder,
              },
            ]}
          >
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="caption">{copy.returnToStart}</AppText>
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
        size="small"
        variant="gradient"
        loading={saving}
        style={{ borderRadius: theme.radius.sm, marginTop: theme.spacing.sm }}
        onPress={handleSubmit(
          ({ durations, ...values }) => {
            Keyboard.dismiss();
            if (
              !onCommit({
                kind: "day",
                date: day.date,
                baseVersion: base.version,
                expectedItineraryUpdatedAt: base.itineraryUpdatedAt,
                values: { ...values, startCoordinate: values.startCoordinate ?? undefined },
                durations: durations.map((entry) => ({
                  stopId: entry.stopId,
                  durationMinutes: entry.minutes,
                })),
              })
            )
              setError("root", { message: copy.stopUpdateError });
          },
          (fieldErrors) => {
            const index = day.stops.findIndex(
              (_stop, index) => !!fieldErrors.durations?.[index]?.minutes,
            );
            if (index >= 0) setExpandedStop(day.stops[index]?.id ?? null);
          },
        )}
      >
        {copy.dayVisitSave}
      </AppButton>
      {errors.root?.message ? (
        <AppText accessibilityRole="alert" tone="error" variant="caption">
          {errors.root.message}
        </AppText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
