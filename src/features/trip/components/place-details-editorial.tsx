import { Image, type ImageSource } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { getPlaceEditorialPreview } from "../data/place-editorial-preview";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";

export function PlaceClassification({
  place,
  category,
  openingStatus,
}: {
  place: TripStop;
  category?: string;
  openingStatus?: "OPEN" | "CLOSED" | "UNKNOWN";
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const { entry } = getPlaceEditorialPreview(place);
  return (
    <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
      <AppText variant="caption" tone="primary">
        {category ??
          entry?.category[locale] ??
          (place.locationType === "address"
            ? copy.privateAddress
            : copy.unclassified)}
      </AppText>
      <AppText
        variant="caption"
        style={{
          color:
            openingStatus === "CLOSED" || entry?.state === "closed"
              ? theme.colors.warning
              : openingStatus === "OPEN" || entry
                ? theme.colors.success
                : theme.colors.textSecondary,
        }}
      >
        {openingStatus !== undefined
          ? openingStatus === "OPEN"
            ? copy.openNow
            : openingStatus === "CLOSED"
              ? copy.closedNow
              : copy.openingUnknown
          : entry
            ? entry.state === "open"
              ? copy.openPreview
              : copy.closedPreview
            : copy.openingUnknown}
      </AppText>
    </View>
  );
}

export function PlaceAmenities({ place }: { place: TripStop }) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const { entry } = getPlaceEditorialPreview(place);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label">{copy.amenitiesAndTips}</AppText>
      {entry ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.sm,
          }}
        >
          {[
            ...entry.amenities.map((label) => ({ label, tip: false })),
            ...entry.tips.map((label) => ({ label, tip: true })),
          ].map(({ label, tip }) => (
            <View
              key={label.en}
              style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.radius.sm,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.softActionBorder,
                backgroundColor: tip
                  ? theme.colors.warningSurface
                  : theme.colors.surfaceTint,
              }}
            >
              <AppText
                variant="caption"
                style={{
                  color: tip ? theme.colors.warning : theme.colors.primaryText,
                }}
              >
                {label[locale]}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="caption" tone="muted">
          {copy.unavailable}
        </AppText>
      )}
    </View>
  );
}

export function PlaceIntroduction({
  place,
  samplePhotos,
}: {
  place: TripStop;
  samplePhotos?: (ImageSource | string | number)[];
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const { entry, photos: previewPhotos } = getPlaceEditorialPreview(place);
  const photos = samplePhotos ?? previewPhotos;
  return (
    <View style={{ gap: theme.spacing.md }}>
      <AppText variant="label">{copy.introduction}</AppText>
      <AppText tone="muted">
        {entry?.introduction[locale] ?? copy.introductionEmpty}
      </AppText>
      {photos.length ? (
        <>
          <View style={{ gap: theme.spacing.xs }}>
            <AppText variant="label">{copy.nearbyPhotos}</AppText>
            <AppText variant="caption" tone="muted">
              {copy.photosPreview}
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.sm }}
          >
            {photos.map((source, index) => (
              <Image
                key={String(source)}
                source={source}
                accessible
                accessibilityLabel={copy.photoLabel.replace(
                  "{index}",
                  String(index + 1),
                )}
                contentFit="cover"
                cachePolicy="memory-disk"
                style={{
                  width: theme.layout.journalThumbnailSize,
                  aspectRatio: theme.layout.journalPhotoAspectRatio,
                  borderRadius: theme.radius.sm,
                }}
              />
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}
