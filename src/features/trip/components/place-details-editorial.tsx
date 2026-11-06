import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";

/** Show only place facts returned by the backend; enrichment fields are unavailable today. */
export function PlaceClassification({ place }: { place: TripStop }) {
  const { copy, locale } = usePlaceSearchCopy();
  return (
    <View style={{ gap: 4, marginTop: 4 }}>
      <AppText variant="caption" tone="primary">
        {place.kind[locale] || copy.unclassified}
      </AppText>
      <AppText variant="caption" tone="muted">{copy.openingUnknown}</AppText>
    </View>
  );
}

export function PlaceAmenities({ place: _place }: { place: TripStop }) {
  const { copy } = usePlaceSearchCopy();
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">{copy.amenitiesAndTips}</AppText>
      <AppText variant="caption" tone="muted">{copy.unavailable}</AppText>
    </View>
  );
}

export function PlaceIntroduction({ place: _place }: { place: TripStop }) {
  const { copy } = usePlaceSearchCopy();
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">{copy.introduction}</AppText>
      <AppText tone="muted">{copy.introductionEmpty}</AppText>
    </View>
  );
}
