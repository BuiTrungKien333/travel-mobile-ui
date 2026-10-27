import { useDeferredValue, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { getPlaceSearchPreview } from "../data/place-search-preview";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { tripMessage } from "../utils/create-trip-formatters";
import {
  getPlaceMapRegion,
  searchPlaces,
  type PlaceCoordinate,
} from "../utils/place-search";
import { DetailIconButton } from "../components/trip-details-header";
import { PlaceSearchMap } from "../components/place-search-map";
import {
  PlaceSearchResultRow,
  PlaceTargetSelector,
} from "../components/place-picker-list-items";

/** One selection session, shared by the pushed route and the create-trip form. */
export function PlacePickerScreen({
  destination,
  trip,
  initialDate = null,
  initialSelected = [],
  onApply,
  onClose,
}: {
  destination: string;
  trip?: Trip;
  initialDate?: string | null;
  initialSelected?: TripStop[];
  onApply: (stops: TripStop[], date: string | null) => boolean | void;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy, locale } = usePlaceSearchCopy();
  const [catalog] = useState(() => getPlaceSearchPreview(destination));
  const region = useMemo(() => getPlaceMapRegion(catalog), [catalog]);
  const [selected, setSelected] = useState(() =>
    initialSelected.map((stop) => ({
      ...catalog.find((entry) => entry.id === stop.id),
      ...stop,
    })),
  );
  const [date, setDate] = useState(initialDate);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedOnly, setSelectedOnly] = useState(false);
  // undefined = results, null = custom map pin, otherwise a result awaiting confirmation.
  const [focus, setFocus] = useState<TripStop | null | undefined>(undefined);
  const [coordinate, setCoordinate] = useState<PlaceCoordinate | null>(
    region ? { latitude: region.latitude, longitude: region.longitude } : null,
  );
  const [saveError, setSaveError] = useState(false);
  const { control, handleSubmit, reset } = useForm<{ name: string }>({
    defaultValues: { name: "" },
    resolver: zodResolver(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, copy.customRequired)
          .max(120, copy.customMax),
      }),
    ),
  });
  const existing = trip
    ? [
        ...trip.days.flatMap((day) => day.stops),
        ...(trip.unscheduledStops ?? []),
      ]
    : [];
  const chosen = selected.filter(
    (stop) => !existing.some((entry) => entry.id === stop.id),
  );
  const available = [
    ...catalog,
    ...selected.filter(
      (stop) => !catalog.some((entry) => entry.id === stop.id),
    ),
  ];
  const results = searchPlaces(
    (selectedOnly ? chosen : available).filter(
      (stop) => !existing.some((entry) => entry.id === stop.id),
    ),
    deferredQuery,
  );
  const targetIndex = trip?.days.findIndex((day) => day.date === date) ?? -1;
  const canApply = chosen.length > 0 || (!trip && initialSelected.length > 0);
  const inPreview = focus !== undefined;
  function toggle(place: TripStop) {
    setSaveError(false);
    setSelected((stops) =>
      stops.some((stop) => stop.id === place.id)
        ? stops.filter((stop) => stop.id !== place.id)
        : [...stops, place],
    );
  }
  function openPreview(place: TripStop | null) {
    Keyboard.dismiss();
    if (place && !place.location) {
      toggle(place);
      return;
    }
    setFocus(place);
    if (!place && region) {
      reset({ name: "" });
      setCoordinate({ latitude: region.latitude, longitude: region.longitude });
    }
  }
  const chooseCustom = handleSubmit(({ name }) => {
    if (!coordinate) return;
    const stop: TripStop = {
      id: `custom-${Date.now()}`,
      time: "",
      name: { vi: name, en: name },
      kind: { vi: "Địa điểm riêng", en: "Private place" },
      address: {
        vi: "Vị trí đã chọn trên bản đồ",
        en: "Location selected on the map",
      },
      location: coordinate,
    };
    setSelected((stops) => [...stops, stop]);
    setSaveError(false);
    setSelectedOnly(false);
    setQuery("");
    setFocus(undefined);
  });
  function confirmPlace() {
    if (!focus) {
      void chooseCustom();
      return;
    }
    if (!selected.some((stop) => stop.id === focus.id))
      setSelected((stops) => [...stops, focus]);
    setFocus(undefined);
  }
  function apply() {
    if (!canApply) return;
    Keyboard.dismiss();
    setSaveError(onApply(chosen, date) === false);
  }
  const emptyTitle = selectedOnly ? copy.emptySelection : copy.empty;
  return (
    <GestureHandlerRootView style={styles.fill}>
      <ScreenSafeArea
        edges={["top", "left", "right"]}
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.fill,
            {
              width: "100%",
              maxWidth: theme.layout.contentMaxWidth,
              alignSelf: "center",
            },
          ]}
        >
          <View
            style={[
              styles.row,
              {
                gap: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                paddingTop: theme.spacing.xxl,
                paddingBottom: theme.spacing.xs,
              },
            ]}
          >
            <DetailIconButton
              name="back"
              label={inPreview ? copy.returnResults : copy.back}
              onPress={() => (inPreview ? setFocus(undefined) : onClose())}
            />
            <View style={styles.fill}>
              <AppText
                variant="heading"
                style={{ fontSize: theme.typography.fontSize.lg }}
              >
                {inPreview ? copy.mapTitle : copy.title}
              </AppText>
            </View>
          </View>
          {!inPreview ? (
            <>
              <PlaceTargetSelector
                destination={destination}
                days={trip?.days ?? []}
                date={date}
                onChange={(value) => {
                  setDate(value);
                  setSaveError(false);
                }}
              />
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingBottom: theme.spacing.xs,
                }}
              >
                <AppInput
                  label={copy.search}
                  hideLabel
                  placeholder={copy.search}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    if (results.length === 1) openPreview(results[0]);
                    else Keyboard.dismiss();
                  }}
                  leadingIcon={
                    <AppIcon name="search" size={theme.layout.iconSmall} />
                  }
                  trailingAction={
                    query ? (
                      <DetailIconButton
                        name="close"
                        label={copy.clear}
                        onPress={() => setQuery("")}
                        compact
                      />
                    ) : undefined
                  }
                />
              </View>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingBottom: theme.spacing.xl,
                  gap: theme.spacing.md,
                }}
                ListHeaderComponent={
                  <View
                    style={{
                      gap: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                    }}
                  >
                    <View style={[styles.row, { gap: theme.spacing.sm }]}>
                      <AppText variant="label" style={styles.fill}>
                        {selectedOnly
                          ? copy.selected
                          : query.trim()
                            ? copy.results
                            : copy.suggestions}
                      </AppText>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          selectedOnly ? copy.all : copy.selectedOnly
                        }
                        accessibilityState={{ selected: selectedOnly }}
                        onPress={() => {
                          setSelectedOnly((value) => !value);
                          setQuery("");
                        }}
                        style={{
                          minHeight: theme.layout.compactTouchTarget,
                          justifyContent: "center",
                        }}
                      >
                        <AppText variant="caption" tone="primary">
                          {selectedOnly
                            ? copy.all
                            : `${copy.selected} (${chosen.length})`}
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  <View
                    style={{
                      paddingVertical: theme.spacing.xl,
                      gap: theme.spacing.sm,
                    }}
                  >
                    <AppIcon name="search" size={theme.layout.iconLarge} />
                    <AppText variant="label">{emptyTitle}</AppText>
                    <AppText tone="muted">
                      {selectedOnly ? copy.emptySelectionHint : copy.emptyHint}
                    </AppText>
                    {region && !selectedOnly ? (
                      <AppButton
                        variant="outline"
                        onPress={() => openPreview(null)}
                      >
                        {copy.map}
                      </AppButton>
                    ) : !region ? (
                      <AppText variant="caption" tone="muted">
                        {copy.noMap}
                      </AppText>
                    ) : null}
                  </View>
                }
                renderItem={({ item }) => {
                  const checked = chosen.some((stop) => stop.id === item.id);
                  return (
                    <PlaceSearchResultRow
                      place={item}
                      checked={checked}
                      onPreview={() => openPreview(item)}
                      onToggle={() => toggle(item)}
                    />
                  );
                }}
              />
            </>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: theme.spacing.lg,
                gap: theme.spacing.lg,
              }}
            >
              {region ? (
                <PlaceSearchMap
                  key={focus?.id ?? "custom"}
                  places={catalog}
                  region={region}
                  focused={focus ?? undefined}
                  custom={focus === null}
                  onMove={setCoordinate}
                />
              ) : null}
              {focus ? (
                <View style={{ gap: theme.spacing.sm }}>
                  <AppText
                    variant="heading"
                    style={{ fontSize: theme.typography.fontSize.lg }}
                  >
                    {focus.name[locale]}
                  </AppText>
                  <AppText tone="muted">
                    {focus.address?.[locale] ?? focus.kind[locale]}
                  </AppText>
                  <AppText variant="caption" tone="primary">
                    {focus.kind[locale]}
                  </AppText>
                </View>
              ) : (
                <>
                  <AppText variant="caption" tone="primary">
                    {copy.mapHint}
                  </AppText>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <AppInput
                        label={copy.customName}
                        placeholder={copy.customPlaceholder}
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        maxLength={120}
                      />
                    )}
                  />
                  <AppText variant="caption" tone="muted">
                    {copy.customHint}
                  </AppText>
                </>
              )}
            </ScrollView>
          )}
          <View
            style={{
              padding: theme.spacing.lg,
              paddingBottom: insets.bottom + theme.spacing.lg,
              gap: theme.spacing.sm,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.softActionBorder,
            }}
          >
            <GlassBackdrop borderRadius={theme.radius.none} />
            {saveError ? (
              <AppText accessibilityRole="alert" tone="error" variant="caption">
                {copy.saveError}
              </AppText>
            ) : null}
            {!inPreview ? (
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <AppText variant="label" tone="primary">
                  {copy.selected} · {chosen.length}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {targetIndex >= 0
                    ? `${copy.day} ${targetIndex + 1}`
                    : copy.pool}
                </AppText>
              </View>
            ) : null}
            <AppButton
              variant="raised"
              disabled={!inPreview && !canApply}
              onPress={inPreview ? confirmPlace : apply}
            >
              {inPreview
                ? copy.confirm
                : !chosen.length
                  ? copy.saveSelection
                  : tripMessage(targetIndex >= 0 ? copy.addDay : copy.add, {
                      count: chosen.length,
                      day: targetIndex + 1,
                    })}
            </AppButton>
            {!inPreview ? (
              <AppText variant="caption" tone="muted">
                {copy.savedHint}
              </AppText>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </ScreenSafeArea>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center" },
});
