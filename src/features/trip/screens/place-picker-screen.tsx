import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  FlatList,
  Alert,
  BackHandler,
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
import { ApiError } from "@/services/api/api-error";
import { createRequestId } from "@/utils/create-request-id";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { tripMessage } from "../utils/create-trip-formatters";
import {
  getPlaceMapRegion,
  searchPlaces,
  type PlaceCoordinate,
} from "../utils/place-search";
import { DetailIconButton } from "../components/trip-details-header";
import { PlaceSearchMap } from "../components/place-search-map";
import { PlaceDetailsContent } from "../components/place-details-content";
import { useDebouncedValue, usePlaceSearchQuery } from "../api/maps-hooks";
import { samePlace } from "../api/place-selection";
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
  onApply: (stops: TripStop[], date: string | null) => boolean | void | Promise<boolean | void>;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy } = usePlaceSearchCopy();
  const [selected, setSelected] = useState(() => initialSelected);
  const [date, setDate] = useState(initialDate);
  const [query, setQuery] = useState("");
  const deferredQuery = useDebouncedValue(query);
  const destinationSearch = usePlaceSearchQuery(destination);
  const destinationRegion = getPlaceMapRegion((destinationSearch.data ?? []).flatMap((place): TripStop[] =>
      place.latitude === null || place.longitude === null
        ? []
        : [{
            id: place.providerPlaceId ?? `${place.name}:${place.latitude}:${place.longitude}`,
            time: "",
            name: { vi: place.name, en: place.name },
            kind: { vi: place.category ?? "Địa điểm", en: place.category ?? "Place" },
            location: { latitude: place.latitude, longitude: place.longitude },
          }],
    ));
  const selectedRegion = useMemo(() => getPlaceMapRegion(selected), [selected]);
  const region = destinationRegion ?? selectedRegion;
  const remoteSearch = usePlaceSearchQuery(
    deferredQuery,
    region ? { latitude: region.latitude, longitude: region.longitude } : undefined,
  );
  const [selectedOnly, setSelectedOnly] = useState(false);
  // undefined = results, null = custom map pin, otherwise a result awaiting confirmation.
  const [focus, setFocus] = useState<TripStop | null | undefined>(undefined);
  const previewPlaces = focus ? [focus] : selected;
  const previewRegion =
    focus?.locationType === "address"
      ? getPlaceMapRegion(previewPlaces)
      : region;
  const [coordinate, setCoordinate] = useState<PlaceCoordinate | null>(
    region ? { latitude: region.latitude, longitude: region.longitude } : null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
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
  // Selections belong to this session, including places saved before a partial failure.
  const chosen = selected;
  const remotePlaces: TripStop[] = (remoteSearch.data ?? []).flatMap((place) => {
    if (place.latitude === null || place.longitude === null) return [];
    const id = place.providerPlaceId ? `google:${place.providerPlaceId}` : `google:${place.name}:${place.latitude}:${place.longitude}`;
    return [{
      id,
      ...(place.providerPlaceId ? { providerPlaceId: place.providerPlaceId } : {}),
      time: "",
      name: { vi: place.name, en: place.name },
      kind: { vi: place.category ?? "Địa điểm", en: place.category ?? "Place" },
      ...(place.address ? { address: { vi: place.address, en: place.address } } : {}),
      location: { latitude: place.latitude, longitude: place.longitude },
    }];
  });
  const searchCurrent = deferredQuery.trim() === query.trim();
  const results = selectedOnly ? searchPlaces(chosen, query)
    : searchCurrent && deferredQuery.trim().length >= 2
      ? remotePlaces.filter((stop) => !existing.some((entry) => samePlace(stop, entry))) : [];
  const targetIndex = trip?.days.findIndex((day) => day.date === date) ?? -1;
  const invalidTarget = !!trip && date !== null && targetIndex < 0;
  const cancelled = trip?.status === "cancelled";
  const canApply = !invalidTarget && !cancelled && (chosen.length > 0 || (!trip && initialSelected.length > 0));
  const inPreview = focus !== undefined;
  const requestClose = useCallback(() => {
    if (savingRef.current) return;
    if (inPreview) { setFocus(undefined); return; }
    if (trip && selected.length) {
      Alert.alert(copy.leaveTitle, copy.leaveHint, [
        { text: copy.keepSelecting, style: "cancel" },
        { text: copy.leave, onPress: onClose },
      ]);
    } else onClose();
  }, [inPreview, trip, selected.length, copy, onClose]);
  useEffect(() => {
    if (!trip) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { requestClose(); return true; });
    return () => subscription.remove();
  }, [trip, requestClose]);
  function toggle(place: TripStop) {
    if (savingRef.current) return;
    setSaveError(null);
    setSelected((stops) =>
      stops.some((stop) => samePlace(stop, place))
        ? stops.filter((stop) => !samePlace(stop, place))
        : [...stops, place],
    );
  }
  function openPreview(place: TripStop | null) {
    if (savingRef.current) return;
    Keyboard.dismiss();
    if (place && !place.location) {
      toggle(place);
      return;
    }
    setFocus(place);
    if (place?.locationType === "address") {
      const saved = selected.find((stop) => stop.id === place.id);
      reset({ name: saved?.name.vi ?? "" });
    }
    if (!place && region) {
      reset({ name: "" });
      setCoordinate({ latitude: region.latitude, longitude: region.longitude });
    }
  }
  const chooseCustom = handleSubmit(({ name }) => {
    if (!coordinate) return;
    const stop: TripStop = {
      id: `custom-${createRequestId()}`,
      time: "",
      name: { vi: name, en: name },
      kind: { vi: "Địa điểm riêng", en: "Private place" },
      address: {
        vi: "Vị trí đã chọn trên bản đồ",
        en: "Location selected on the map",
      },
      location: coordinate,
    };
    setSelected((stops) => stops.some((entry) => samePlace(entry, stop)) ? stops : [...stops, stop]);
    setSaveError(null);
    setSelectedOnly(false);
    setQuery("");
    setFocus(undefined);
  });
  function confirmPlace() {
    if (savingRef.current) return;
    if (focus?.locationType === "address") {
      void handleSubmit(({ name }) => {
        const stop = { ...focus, name: { vi: name, en: name } };
        setSelected((stops) => [
          ...stops.filter((entry) => entry.id !== stop.id),
          stop,
        ]);
        setSaveError(null);
        setQuery("");
        setFocus(undefined);
        Keyboard.dismiss();
      })();
      return;
    }
    if (!focus) {
      void chooseCustom();
      return;
    }
    if (!selected.some((stop) => samePlace(stop, focus)))
      setSelected((stops) => [...stops, focus]);
    setFocus(undefined);
  }
  async function apply() {
    if (!canApply || savingRef.current) return;
    savingRef.current = true;
    Keyboard.dismiss();
    setSaving(true);
    try {
      setSaveError((await onApply(chosen, date)) === false ? copy.saveError : null);
    } catch (error) {
      setSaveError(error instanceof ApiError && error.code === "TARGET_DATE_MISSING" ? copy.dateMissing
        : error instanceof ApiError && error.code === "TRIP_CANCELLED" ? copy.cancelled
          : error instanceof ApiError && error.code === "PLACE_ALREADY_SCHEDULED" ? copy.scheduledElsewhere
            : error instanceof ApiError && error.status === 409 ? copy.scheduleConflict : copy.partialSave);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  const emptyTitle = selectedOnly ? copy.emptySelection : copy.empty;
  const nameInput = (
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
          returnKeyType="done"
          onSubmitEditing={confirmPlace}
        />
      )}
    />
  );
  return (
    <GestureHandlerRootView style={styles.fill}>
      <ScreenSafeArea
        edges={["top", "left", "right"]}
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
      >
        <KeyboardAvoidingView
          pointerEvents={saving ? "none" : "auto"}
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
          {!focus ? (
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
                onPress={requestClose}
              />
              <View style={styles.fill}>
                <AppText
                  variant="heading"
                  style={{ fontSize: theme.typography.fontSize.lg }}
                >
                  {inPreview ? copy.mapTitle : copy.title}
                </AppText>
              </View>
              {deferredQuery.trim().length >= 2 && !remoteSearch.isFetching && !remoteSearch.isError ? (
                <AppText variant="caption" tone="muted" style={{ paddingHorizontal: theme.spacing.lg }}>Powered by Geoapify · © OpenStreetMap contributors</AppText>
              ) : null}
            </View>
          ) : null}
          {focus ? (
            <PlaceDetailsContent
              key={focus.id}
              place={focus}
              places={previewPlaces}
              region={previewRegion}
              onBack={requestClose}
              nameInput={
                focus.locationType === "address" ? nameInput : undefined
              }
            />
          ) : !inPreview ? (
            <>
              <PlaceTargetSelector
                destination={destination}
                days={trip?.days ?? []}
                date={date}
                onChange={(value) => {
                  if (savingRef.current) return;
                  setDate(value);
                  setSaveError(null);
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
                  editable={!saving}
                  onChangeText={(value) => { if (!savingRef.current) setQuery(value); }}
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
              {deferredQuery.trim().length >= 2 && remoteSearch.isFetching ? (
                <AppText variant="caption" tone="muted" style={{ paddingHorizontal: theme.spacing.lg }}>{copy.searchLoading}</AppText>
              ) : null}
              {deferredQuery.trim().length >= 2 && remoteSearch.isError ? (
                <AppText accessibilityRole="alert" variant="caption" tone="error" style={{ paddingHorizontal: theme.spacing.lg }}>{copy.searchFailed}</AppText>
              ) : null}
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
                      marginTop: theme.spacing.sm,
                      padding: theme.spacing.lg,
                      gap: theme.spacing.md,
                      alignItems: "center",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.colors.softActionBorder,
                      borderRadius: theme.radius.lg,
                      overflow: "hidden",
                    }}
                  >
                    <GlassBackdrop borderRadius={theme.radius.lg} />
                    <View
                      style={{
                        width: theme.layout.touchTarget,
                        height: theme.layout.touchTarget,
                        borderRadius: theme.radius.full,
                        backgroundColor: theme.colors.surfaceTint,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppIcon
                        name="search"
                        variant="light"
                        size={theme.layout.iconMedium}
                        color={theme.colors.primaryText}
                      />
                    </View>
                    <View style={{ gap: theme.spacing.sm }}>
                      <AppText
                        variant="label"
                        accessibilityLiveRegion="polite"
                        style={{ textAlign: "center" }}
                      >
                        {emptyTitle}
                      </AppText>
                      <AppText
                        variant="caption"
                        tone="muted"
                        style={{ textAlign: "center" }}
                      >
                        {selectedOnly
                          ? copy.emptySelectionHint
                          : !region
                            ? copy.noMap
                            : copy.emptyHint}
                      </AppText>
                    </View>
                    {region && !selectedOnly ? (
                      <AppButton
                        variant="soft"
                        size="small"
                        style={{ width: "100%" }}
                        leadingIcon={
                          <AppIcon
                            name="pin"
                            variant="light"
                            size={theme.layout.iconSmall}
                            color={theme.colors.onSoftAction}
                          />
                        }
                        onPress={() => openPreview(null)}
                      >
                        {copy.map}
                      </AppButton>
                    ) : null}
                    {selectedOnly || query.trim() ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedOnly(false);
                          setQuery("");
                        }}
                        style={({ pressed }) => ({
                          minHeight: theme.layout.compactTouchTarget,
                          justifyContent: "center",
                          alignItems: "center",
                          paddingHorizontal: theme.spacing.sm,
                          opacity: pressed ? theme.motion.pressOpacity : 1,
                        })}
                      >
                        <AppText
                          variant="caption"
                          tone="primary"
                          style={{ textAlign: "center" }}
                        >
                          {selectedOnly ? copy.all : copy.resetSearch}
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
                }
                renderItem={({ item }) => {
                  const checked = chosen.some((stop) => samePlace(stop, item));
                  return (
                    <PlaceSearchResultRow
                      place={item}
                      checked={checked}
                      alreadyAdded={existing.some((stop) => samePlace(stop, item))}
                      onPreview={() => openPreview(item)}
                      onToggle={() => {
                        if (item.locationType === "address" && !checked)
                          openPreview(item);
                        else toggle(item);
                      }}
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
                  key="custom"
                  places={selected}
                  region={region}
                  custom
                  onMove={setCoordinate}
                />
              ) : null}

              <AppText variant="caption" tone="primary">
                {copy.mapHint}
              </AppText>
              {nameInput}
              <AppText variant="caption" tone="muted">
                {copy.customHint}
              </AppText>
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
                {saveError}
              </AppText>
            ) : null}
            {(invalidTarget || cancelled) && !saveError ? <AppText accessibilityRole="alert" tone="error" variant="caption">
              {cancelled ? copy.cancelled : copy.dateMissing}
            </AppText> : null}
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
              loading={saving}
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
