import { useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppInput } from "@/components/ui/app-input";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import type { TripStop } from "@/features/home/types/home-types";
import { discoveryStop, type PlaceScope } from "../api/place-discovery-api";
import {
  usePlaceDiscovery,
  usePlaceDetail,
} from "../api/place-discovery-queries";
import { PlaceSearchResultRow } from "../components/place-picker-list-items";
import { PlaceDetailsContent } from "../components/place-details-content";
import { DetailIconButton } from "../components/trip-details-header";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";
import { getPlaceMapRegion } from "../utils/place-search";

/** Real stored-place selection. Preview fixtures never cross this boundary. */
export function ConnectedPlacePickerScreen({
  destination,
  scope,
  initialSelected = [],
  onApply,
  onClose,
}: {
  destination: string;
  scope: PlaceScope;
  initialSelected?: TripStop[];
  onApply: (stops: TripStop[]) => Promise<void> | void;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy, locale } = usePlaceSearchCopy();
  const { copy: tripErrors } = useTripIntegrationCopy();
  const errors = {
    ...tripErrors,
    generic: copy.requestFailed,
    network: copy.networkFailure,
  };
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(initialSelected);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [focus, setFocus] = useState<TripStop>();
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>();
  const lock = useRef(false);
  const { query, isDebouncing } = usePlaceDiscovery(scope, search, locale);
  const detail = usePlaceDetail(focus?.placeId, locale);
  const rows = selectedOnly
    ? selected
    : isDebouncing
      ? []
      : (query.data?.pages.flatMap((p) => p.content.map(discoveryStop)) ?? []);
  const limited = selected.length >= 50;
  const canApply = selected.length > 0 || initialSelected.length > 0;
  const toggle = (place: TripStop) => {
    setFailure(undefined);
    setSelected((current) =>
      current.some((p) => p.placeId === place.placeId)
        ? current.filter((p) => p.placeId !== place.placeId)
        : current.length < 50
          ? [...current, place]
          : current,
    );
  };
  const checked = (place: TripStop) =>
    selected.some((p) => p.placeId === place.placeId);
  const apply = async () => {
    if (lock.current || !canApply) return;
    lock.current = true;
    setSaving(true);
    setFailure(undefined);
    Keyboard.dismiss();
    try {
      await onApply(selected);
    } catch (error) {
      setFailure(error);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  const back = () => {
    if (!lock.current) {
      if (focus) setFocus(undefined);
      else onClose();
    }
  };
  return (
    <GestureHandlerRootView style={styles.fill}>
      <ScreenSafeArea
        edges={["top", "left", "right"]}
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.content, { maxWidth: theme.layout.contentMaxWidth }]}
        >
          {focus ? (
            <>
              {detail.data ? (
                <PlaceDetailsContent
                  place={discoveryStop(detail.data)}
                  places={[focus]}
                  region={getPlaceMapRegion([focus])}
                  onBack={back}
                  suppliedDetails={{
                    photo: null,
                    hours: detail.data.openingHours?.displayLines.join(" · "),
                    admission: detail.data.admission
                      ? {
                          vi: detail.data.admission.text,
                          en: detail.data.admission.text,
                        }
                      : undefined,
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.fill,
                    {
                      padding: theme.spacing.lg,
                      paddingTop: theme.spacing.xxl,
                      gap: theme.spacing.md,
                    },
                  ]}
                >
                  <DetailIconButton
                    name="back"
                    label={copy.back}
                    onPress={back}
                  />
                  <AppText
                    accessibilityRole={detail.isError ? "alert" : undefined}
                  >
                    {detail.isError
                      ? tripApiErrorMessage(detail.error, errors)
                      : copy.loadingPlaces}
                  </AppText>
                  {detail.isError ? (
                    <AppButton
                      variant="outline"
                      onPress={() => void detail.refetch()}
                    >
                      {errors.retry}
                    </AppButton>
                  ) : null}
                </View>
              )}
            </>
          ) : (
            <>
              <View
                style={[
                  styles.row,
                  {
                    gap: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.md,
                    paddingTop: theme.spacing.xxl,
                  },
                ]}
              >
                <DetailIconButton
                  name="back"
                  label={copy.back}
                  onPress={back}
                />
                <AppText variant="subheading">{copy.title}</AppText>
              </View>
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  gap: theme.spacing.sm,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <AppText variant="label" tone="primary">
                  {destination} · {copy.pool}
                </AppText>
                <AppInput
                  label={copy.search}
                  hideLabel
                  value={search}
                  onChangeText={(q) => {
                    setSearch(q);
                    setSelectedOnly(false);
                  }}
                  maxLength={200}
                  placeholder={copy.catalogSearch}
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={Keyboard.dismiss}
                  leadingIcon={
                    <AppIcon name="search" size={theme.layout.iconSmall} />
                  }
                  trailingAction={
                    search ? (
                      <DetailIconButton
                        name="close"
                        compact
                        label={copy.clear}
                        onPress={() => setSearch("")}
                      />
                    ) : undefined
                  }
                />
                <AppText variant="caption" tone="muted">
                  {copy.catalogHint}
                </AppText>
              </View>
              <FlatList
                data={rows}
                keyExtractor={(p) => p.id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{
                  paddingHorizontal: theme.spacing.lg,
                  gap: theme.spacing.md,
                  paddingBottom: theme.spacing.lg,
                }}
                ListHeaderComponent={
                  <View style={{ gap: theme.spacing.sm }}>
                    <View style={styles.between}>
                      <AppText variant="label">
                        {selectedOnly
                          ? copy.selected
                          : search.trim()
                            ? copy.results
                            : copy.suggestions}
                      </AppText>
                      <AppButton
                        variant="soft"
                        size="small"
                        onPress={() => setSelectedOnly((s) => !s)}
                      >
                        {selectedOnly
                          ? copy.all
                          : `${copy.selected} (${selected.length})`}
                      </AppButton>
                    </View>
                    {query.isError && !selectedOnly ? (
                      <View style={{ gap: theme.spacing.sm }}>
                        <AppText accessibilityRole="alert">
                          {tripApiErrorMessage(query.error, errors)}
                        </AppText>
                        <AppButton
                          variant="outline"
                          size="small"
                          onPress={() => void query.refetch()}
                        >
                          {errors.retry}
                        </AppButton>
                      </View>
                    ) : null}
                  </View>
                }
                ListEmptyComponent={
                  !query.isError || selectedOnly ? (
                    <View
                      style={{
                        paddingVertical: theme.spacing.lg,
                        gap: theme.spacing.sm,
                      }}
                    >
                      <AppText variant="label">
                        {!selectedOnly && (query.isPending || isDebouncing)
                          ? copy.loadingPlaces
                          : selectedOnly
                            ? copy.emptySelection
                            : copy.empty}
                      </AppText>
                      {!query.isPending && !isDebouncing && !selectedOnly ? (
                        <AppText tone="muted">{copy.catalogEmpty}</AppText>
                      ) : null}
                    </View>
                  ) : null
                }
                renderItem={({ item }) => (
                  <PlaceSearchResultRow
                    place={item}
                    checked={checked(item)}
                    onToggle={() => toggle(item)}
                    onPreview={() => {
                      Keyboard.dismiss();
                      setFocus(item);
                    }}
                  />
                )}
                onEndReached={() => {
                  if (
                    !selectedOnly &&
                    !isDebouncing &&
                    query.hasNextPage &&
                    !query.isFetchingNextPage
                  )
                    void query.fetchNextPage();
                }}
                ListFooterComponent={
                  !selectedOnly && query.isFetchingNextPage ? (
                    <AppText>{copy.loadingPlaces}</AppText>
                  ) : null
                }
              />
            </>
          )}
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.sm,
              paddingBottom: insets.bottom + theme.spacing.md,
              gap: theme.spacing.sm,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
          >
            {failure ? (
              <AppText accessibilityRole="alert">
                {tripApiErrorMessage(failure, errors)}
              </AppText>
            ) : null}
            {limited ? (
              <AppText variant="caption" tone="muted">
                {copy.selectionLimit}
              </AppText>
            ) : null}
            <AppText variant="caption" tone="muted">
              {copy.unscheduledHint}
            </AppText>
            {focus ? (
              <AppButton
                disabled={!detail.data || (!checked(focus) && limited)}
                onPress={() => {
                  if (detail.data) {
                    toggle(discoveryStop(detail.data));
                    setFocus(undefined);
                  }
                }}
              >
                {checked(focus) ? copy.remove : copy.confirm}
              </AppButton>
            ) : (
              <AppButton
                loading={saving}
                disabled={!canApply}
                onPress={() => void apply()}
              >{`${copy.saveSelection} (${selected.length})`}</AppButton>
            )}
          </View>
        </KeyboardAvoidingView>
      </ScreenSafeArea>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, width: "100%", alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
