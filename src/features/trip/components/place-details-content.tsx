import { useState, type ReactNode } from "react";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { AppText } from "@/components/ui/app-text";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { LocalizedText, TripStop } from "@/features/home/types/home-types";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { getPlaceDetailsPreview } from "../data/place-details-preview";
import type { PlaceMapRegion } from "../utils/place-search";
import { TripPlanningMap } from "./trip-planning-map";
import { PlaceSearchMap } from "./place-search-map";
import { DetailIconButton } from "./trip-details-header";

const defaultLocationImage = require("@/assets/images/home/next-trip-navigation.webp");

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
  suppliedDetails,
  mapContent,
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
  /** Explicit server content; absence is reserved for the UI-preview caller. */
  suppliedDetails?: {
    photo: ReturnType<typeof getPlaceDetailsPreview>["photo"];
    hours?: string;
    admission?: LocalizedText;
  };
  mapContent?: ReactNode;
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const [availableHeight, setAvailableHeight] = useState(0);
  const resizeLock = useSharedValue(0);
  const details = suppliedDetails ?? getPlaceDetailsPreview(place);
  const isAddress = place.locationType === "address";
  const photo = details.photo ?? (isAddress ? defaultLocationImage : null);
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
      value: details.hours ?? copy.unavailable,
    },
    {
      icon: "ticket" as const,
      label: copy.admission,
      value: details.admission?.[locale] ?? copy.unavailable,
    },
    {
      icon: "route" as const,
      label: copy.visitDuration,
      value:
        place.durationMinutes !== undefined || suppliedDetails === undefined
          ? `${place.durationMinutes ?? 45} ${copy.minutes}`
          : copy.unavailable,
    },
  ];
  return (
    <View
      style={styles.fill}
      onLayout={(event) => setAvailableHeight(event.nativeEvent.layout.height)}
    >
      {region || mapContent ? (
        <TripPlanningMap
          header={header}
          viewportHeight={availableHeight}
          selectorHeight={theme.layout.touchTarget}
          resizeLock={resizeLock}
          showLocationControl={false}
          overlayHeader
          expandRequest={expandMapRequest}
          mapContent={
            mapContent ? (
              <View style={styles.fill}>
                {mapContent}
                {mapAction ? (
                  <View
                    style={{
                      position: "absolute",
                      right: theme.spacing.sm,
                      top:
                        headerTopSpacing +
                        theme.layout.touchTarget +
                        theme.spacing.xs,
                    }}
                  >
                    {mapAction}
                  </View>
                ) : null}
              </View>
            ) : region ? (
              <PlaceSearchMap
                places={places}
                region={region}
                focused={place}
                custom={false}
                fitContainer
                controlsTop={headerTopSpacing}
                extraControl={mapAction}
              />
            ) : null
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
            <AppText accessibilityRole="header" variant="sectionTitle">
              {isAddress && !showSavedName
                ? copy.selectedLocation
                : place.name[locale]}
            </AppText>
            <AppText variant="caption" tone="muted">
              {place.address?.[locale] ?? copy.unavailable}
            </AppText>
            {classification}
          </View>
          {photo ? (
            <Image
              accessible={false}
              source={photo}
              contentFit="cover"
              cachePolicy="memory-disk"
              style={{
                width: theme.layout.journeyThumbnailSize,
                height: theme.layout.journeyThumbnailSize,
                borderRadius: theme.radius.sm,
              }}
            />
          ) : !isAddress ? (
            <View
              style={{
                width: theme.layout.journeyThumbnailSize,
                height: theme.layout.journeyThumbnailSize,
                backgroundColor: theme.colors.surfaceTint,
                borderRadius: theme.radius.sm,
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.xs,
              }}
            >
              <AppIcon name="memories" color={theme.colors.textSecondary} />
              <AppText variant="caption" tone="muted">
                {copy.noPhoto}
              </AppText>
            </View>
          ) : null}
        </View>
        {status}
        {nameInput}
        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="label">{copy.placeInfo}</AppText>
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
          {suppliedDetails === undefined ? (
            <AppText variant="caption" tone="muted">
              {copy.detailsPreview}
            </AppText>
          ) : null}
        </View>
        {afterInfo}
        {children}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center" },
});
