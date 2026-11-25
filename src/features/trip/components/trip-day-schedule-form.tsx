import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import type { z } from "zod";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import type { Trip, TripDay, TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  getAddressSearchPreview,
  getPlaceSearchPreview,
} from "../data/place-search-preview";
import { searchPlaces } from "../utils/place-search";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { tripDayScheduleSchema } from "../schemas/trip-details-schema";
import type { TripMutation } from "../types/trip-details-types";
import { TripStartTimeField } from "./trip-start-time-field";
import { TripVisitDurationRow } from "./trip-visit-duration-row";
import { TripOriginOption } from "./trip-origin-option";

export type DayScheduleDraft = z.output<
  ReturnType<typeof tripDayScheduleSchema>
>;

export function TripDayScheduleForm({
  trip,
  day,
  onCommit,
  integration,
  onSave,
  pending = false,
  preserveVisited = false,
}: {
  trip: Trip;
  day: TripDay;
  onCommit?: (mutation: TripMutation) => boolean;
  onSave?: (draft: DayScheduleDraft) => Promise<void>;
  pending?: boolean;
  preserveVisited?: boolean;
  integration?: {
    matches: TripStop[];
    onSearch: (query: string) => void;
    currentPosition: () => Promise<TripStop>;
    notice?: string;
    noCoordinates: string;
    locationError: string;
    emptySearch: string;
  };
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const [shortcut, setShortcut] = useState<"current" | "home" | "stay" | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [locationNotice, setLocationNotice] = useState(false);
  const [locating, setLocating] = useState(false);
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
      startAddress: day.startAddress,
      startCoordinate: day.startCoordinate,
      startTime: day.startTime ?? "08:30",
      returnToStart: day.returnToStart ?? false,
      durations: day.stops.map((stop) => ({
        stopId: stop.id,
        minutes: String(stop.durationMinutes ?? 45),
      })),
    },
  });
  const location = useWatch({ control, name: "startLocation" });
  const coordinate = useWatch({ control, name: "startCoordinate" });
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
      [
        ...day.stops,
        ...(integration
          ? integration.matches
          : getPlaceSearchPreview(trip.destination)),
        ...(integration ? [] : getAddressSearchPreview()),
      ].map((place) => [place.id, place]),
    ).values(),
  );

  const matches =
    searching && query.length > 1
      ? searchPlaces(candidates, query).slice(0, 4)
      : [];

  function choosePlace(name: string, place?: TripStop) {
    setValue("startCoordinate", place?.location);
    setValue("startAddress", place?.address?.[locale]);
    setValue("startLocation", name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSearching(false);
    setDayChoicesOpen(false);
    setShortcut(null);
    setLocationNotice(false);
    integration?.onSearch("");
    Keyboard.dismiss();
  }

  const options: {
    id: "current" | "home" | "stay";
    icon: AppIconName;
    label: string;
    shortLabel: string;
  }[] = [
    {
      id: "current",
      icon: "locate",
      label: copy.originCurrent,
      shortLabel: copy.originCurrentShort,
    },
    {
      id: "home",
      icon: "home",
      label: copy.originHome,
      shortLabel: copy.originHome,
    },
    {
      id: "stay",
      icon: "trips",
      label: copy.originStay,
      shortLabel: copy.originStayShort,
    },
  ];

  async function chooseShortcut(id: (typeof options)[number]["id"]) {
    setSearching(false);
    setDayChoicesOpen(false);
    setLocationNotice(id === "current" && !integration);
    if (id === "current") {
      if (integration) {
        if (locating) return;
        setLocating(true);
        try {
          const place = await integration.currentPosition();
          choosePlace(place.name[locale], place);
          setShortcut("current");
        } catch {
          setLocationNotice(true);
        } finally {
          setLocating(false);
        }

        return;
      }
      setFocus("startLocation");

      return;
    }
    setShortcut(id);
    setValue("startCoordinate", undefined);
    setValue("startAddress", undefined);
    setValue("startLocation", id === "stay" ? (trip.accommodation ?? "") : "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (id === "stay" && trip.accommodation) Keyboard.dismiss();
    else setFocus("startLocation");
  }

  function originName(place: TripStop) {
    return place.locationType === "address"
      ? (place.address?.[locale] ?? place.name[locale])
      : place.name[locale];
  }

  function isChosenOrigin(place: TripStop) {
    return (
      location === originName(place) &&
      coordinate?.latitude === place.location?.latitude &&
      coordinate?.longitude === place.location?.longitude
    );
  }

  function chooseOrigin(place: TripStop) {
    choosePlace(originName(place), place);
  }

  return (
    <>
      <View style={{ gap: theme.spacing.md }}>
        <Controller
          control={control}
          name="startLocation"
          render={({ field, fieldState }) => (
            <AppInput
              compact
              labelVariant="label"
              label={copy.originSearch}
              placeholder={
                shortcut === "home"
                  ? copy.originHomePlaceholder
                  : shortcut === "stay"
                    ? copy.originStayPlaceholder
                    : copy.originSearchPlaceholder
              }
              leadingIcon={
                <View
                  style={{
                    width: theme.layout.compactIconButtonSurfaceSize,
                    height: theme.layout.compactIconButtonSurfaceSize,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.surfaceVariant,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon
                    name="search"
                    size={theme.layout.iconSmall}
                    color={theme.colors.primaryText}
                  />
                </View>
              }
              value={field.value}
              trailingAction={
                field.value ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.originClearSearch}
                    disabled={locating}
                    onPress={() => {
                      field.onChange("");
                      setValue("startCoordinate", undefined);
                      setValue("startAddress", undefined);
                      integration?.onSearch("");
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
              editable={!locating && !pending}
              onBlur={field.onBlur}
              onChangeText={(value) => {
                field.onChange(value);
                setValue("startCoordinate", undefined);
                setValue("startAddress", undefined);
                integration?.onSearch(value);
                setShortcut(null);
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
          style={[styles.row, { gap: theme.spacing.sm, alignItems: "stretch" }]}
        >
          {options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={
                locating && option.id === "current"
                  ? copy.originLocating
                  : option.label
              }
              disabled={locating}
              accessibilityState={{
                selected: shortcut === option.id,
                disabled: locating,
                busy: locating && option.id === "current",
              }}
              onPress={() => void chooseShortcut(option.id)}
              style={({ pressed }) => ({
                flex: 1,
                flexBasis: 0,
                minWidth: 0,
                minHeight: theme.layout.touchTarget,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.sm,
                gap: theme.spacing.sm,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor:
                  shortcut === option.id
                    ? theme.colors.primaryText
                    : theme.colors.border,
                backgroundColor:
                  shortcut === option.id
                    ? theme.colors.softActionSurface
                    : theme.colors.surface,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              {locating && option.id === "current" ? (
                <View
                  style={{
                    height: theme.layout.iconMedium,
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primaryText}
                  />
                </View>
              ) : (
                <AppIcon
                  name={shortcut === option.id ? "tick" : option.icon}
                  size={theme.layout.iconMedium}
                  variant={option.icon === "home" ? "outline" : "light"}
                  color={theme.colors.primaryText}
                />
              )}
              <AppText
                variant={shortcut === option.id ? "label" : "body"}
                style={{ textAlign: "center", color: theme.colors.primaryText }}
              >
                {option.shortLabel}
              </AppText>
            </Pressable>
          ))}
        </View>
        <View
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            overflow: "hidden",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${copy.originDayPlaces}, ${day.stops.length} ${copy.places}`}
            accessibilityState={{
              expanded: dayChoicesOpen,
              disabled: locating,
            }}
            disabled={locating}
            onPress={() => {
              Keyboard.dismiss();
              setSearching(false);
              setDayChoicesOpen((value) => !value);
            }}
            style={[
              styles.row,
              {
                minHeight: theme.layout.touchTarget,
                gap: theme.spacing.sm,
                padding: theme.spacing.md,
                backgroundColor: dayChoicesOpen
                  ? theme.colors.surfaceVariant
                  : theme.colors.surface,
              },
            ]}
          >
            <View
              style={{
                width: theme.layout.compactIconButtonSurfaceSize,
                height: theme.layout.compactIconButtonSurfaceSize,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surfaceVariant,
              }}
            >
              <AppIcon
                name="route"
                size={theme.layout.iconSmall}
                color={theme.colors.primaryText}
              />
            </View>
            <AppText variant="body" style={{ flex: 1 }}>
              {copy.originDayPlaces}
            </AppText>
            <View
              style={{
                minWidth: theme.spacing.xl,
                paddingHorizontal: theme.spacing.sm,
                minHeight: theme.spacing.xl,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.surfaceTint,
              }}
            >
              <AppText variant="caption" tone="primary">
                {day.stops.length}
              </AppText>
            </View>
            <View
              style={{
                transform: [{ rotate: dayChoicesOpen ? "-90deg" : "90deg" }],
              }}
            >
              <AppIcon
                name="chevron"
                size={theme.layout.iconSmall}
                color={theme.colors.primaryText}
              />
            </View>
          </Pressable>
          {dayChoicesOpen ? (
            <View>
              {day.stops.length ? (
                day.stops.map((stop, index) => (
                  <TripOriginOption
                    key={stop.id}
                    place={stop}
                    selected={isChosenOrigin(stop)}
                    last={index === day.stops.length - 1}
                    onChoose={chooseOrigin}
                  />
                ))
              ) : (
                <AppText
                  variant="caption"
                  tone="muted"
                  style={{ padding: theme.spacing.md }}
                >
                  {copy.originNoDayPlaces}
                </AppText>
              )}
            </View>
          ) : null}
        </View>
        {locationNotice ? (
          <AppText
            variant="caption"
            tone="muted"
            accessibilityLiveRegion="polite"
          >
            {integration?.locationError ?? copy.originLocationUnavailable}
          </AppText>
        ) : null}
        {matches.length ? (
          <View
            style={{
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              overflow: "hidden",
            }}
          >
            {matches.map((place, index) => (
              <TripOriginOption
                key={place.id}
                place={place}
                selected={isChosenOrigin(place)}
                last={index === matches.length - 1}
                onChoose={chooseOrigin}
              />
            ))}
          </View>
        ) : null}
        {integration?.notice ? (
          <AppText
            variant="caption"
            tone="muted"
            accessibilityLiveRegion="polite"
          >
            {integration.notice}
          </AppText>
        ) : null}
        {integration && location && !coordinate ? (
          <AppText variant="caption" tone="muted">
            {integration.noCoordinates}
          </AppText>
        ) : null}
        {searching &&
        query.length > 1 &&
        !matches.length &&
        !integration?.notice ? (
          <AppText variant="caption" tone="muted">
            {integration?.emptySearch ?? copy.originSearchEmpty}
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
        {!location ? (
          <AppText
            variant="caption"
            tone="muted"
            style={{ marginTop: theme.spacing.xs }}
          >
            {copy.departureAtFirstStop}
          </AppText>
        ) : null}
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
                  disabled={pending || (preserveVisited && !!stop.visited)}
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
                backgroundColor: theme.colors.surfaceVariant,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="body">{copy.returnToStart}</AppText>
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
        loading={pending}
        disabled={locating}
        style={{ borderRadius: theme.radius.sm, marginTop: theme.spacing.sm }}
        onPress={handleSubmit(
          async ({ durations, ...values }) => {
            Keyboard.dismiss();
            if (onSave) {
              try {
                await onSave({ durations, ...values });
              } catch {
                setError("root", { message: copy.stopUpdateError });
              }

              return;
            }

            if (
              !onCommit?.({
                kind: "day",
                date: day.date,
                values,
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
