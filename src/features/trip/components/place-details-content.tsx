import { useState, type ReactNode } from "react";
import { ContentImage } from "@/components/ui/content-image";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { AppText } from "@/components/ui/app-text";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import type { PlaceMapRegion } from "../utils/place-search";
import { TripPlanningMap } from "./trip-planning-map";
import { PlaceSearchMap } from "./place-search-map";
import { DetailIconButton } from "./trip-details-header";
import { PlaceIntroduction } from "./place-details-editorial";

/** The same resizable map frame as trip details, with place information below. */
export function PlaceDetailsContent({
  place,
  places,
  region,
  onBack,
  nameInput,
  children,
  status,
  showSavedName = false,
  expandMapRequest = 0,
  backLabel,
  topInset,
  classification,
  afterInfo,
  mapAction,
}: {
  place: TripStop;
  places: TripStop[];
  region: PlaceMapRegion | null;
  onBack: () => void;
  nameInput?: ReactNode;
  children?: ReactNode;
  status?: ReactNode;
  showSavedName?: boolean;
  expandMapRequest?: number;
  backLabel?: string;
  topInset?: number;
  classification?: ReactNode;
  afterInfo?: ReactNode;
  mapAction?: ReactNode;
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const [availableHeight, setAvailableHeight] = useState(0);
  const resizeLock = useSharedValue(0);
  const isAddress = place.locationType === "address";
  const headerTopSpacing =
    topInset !== undefined ? topInset + theme.spacing.xl : theme.spacing.xxl;
  const header = (
    <View
      pointerEvents="box-none"
      style={[
        styles.row,
        {
          gap: theme.spacing.sm,
          paddingTop: headerTopSpacing,
          paddingBottom: theme.spacing.xs,
        },
      ]}
    >
      <DetailIconButton
        name="back"
        label={backLabel ?? copy.returnResults}
        onPress={onBack}
      />
    </View>
  );
  const info = [
    {
      icon: "clock" as const,
      label: copy.hours,
      value: copy.openingUnknown,
    },
    {
      icon: "ticket" as const,
      label: copy.admission,
      value: copy.admissionUnknown,
    },
    {
      icon: "route" as const,
      label: copy.visitDuration,
      value: place.durationMinutes ? `${place.durationMinutes} ${copy.minutes}` : copy.unavailable,
    },
  ];
  return (
    <View
      style={styles.fill}
      onLayout={(event) => setAvailableHeight(event.nativeEvent.layout.height)}
    >
      {region ? (
        <TripPlanningMap
          header={header}
          viewportHeight={availableHeight}
          selectorHeight={theme.layout.touchTarget}
          resizeLock={resizeLock}
          showLocationControl={false}
          overlayHeader
          expandRequest={expandMapRequest}
          mapContent={
            <PlaceSearchMap
              places={places}
              region={region}
              focused={place}
              custom={false}
              fitContainer
              controlsTop={headerTopSpacing}
              extraControl={mapAction}
            />
          }
        />
      ) : (
        <View style={{ paddingHorizontal: theme.spacing.lg }}>{header}</View>
      )}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.fill}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
      >
        <View
          style={[
            styles.row,
            { alignItems: "flex-start", gap: theme.spacing.md },
          ]}
        >
          <View style={[styles.fill, { gap: theme.spacing.xs }]}>
            <AppText
              accessibilityRole="header"
              variant="screenTitle"
            >
              {isAddress && !showSavedName
                ? copy.selectedLocation
                : place.name[locale]}
            </AppText>
            <AppText variant="caption" tone="muted">
              {place.address?.[locale] ?? copy.unavailable}
            </AppText>
            {classification}
          </View>
          {!isAddress ? (
            <View
              style={{
                width: theme.layout.journeyThumbnailSize,
                minHeight: theme.layout.journeyThumbnailSize,
                backgroundColor: theme.colors.surfaceTint,
                borderRadius: theme.radius.sm,
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.xs,
              }}
            >
              <ContentImage label={place.name[locale]} emptyLabel={copy.noPhoto} />
            </View>
          ) : null}
        </View>
        {status}
        {nameInput}
        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="sectionTitle">{copy.placeInfo}</AppText>
          {isAddress ? (
            <AppText variant="caption" tone="muted">
              {copy.unavailable}
            </AppText>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.softActionBorder,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.md,
              }}
            >
              {info.map((item, index) => (
                <View
                  key={item.icon}
                  style={[
                    styles.row,
                    {
                      gap: theme.spacing.md,
                      paddingVertical: theme.spacing.md,
                      borderBottomWidth:
                        index < info.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: theme.colors.softActionBorder,
                    },
                  ]}
                >
                  <AppIcon
                    name={item.icon}
                    size={theme.layout.iconSmall}
                    color={theme.colors.primaryText}
                  />
                  <View style={[styles.fill, { gap: theme.spacing.xs }]}>
                    <AppText variant="caption" tone="muted">
                      {item.label}
                    </AppText>
                    <AppText variant="label">{item.value}</AppText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        {afterInfo}
        {!isAddress ? <PlaceIntroduction key={place.id} place={place} /> : null}
        {children}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center" },
});
