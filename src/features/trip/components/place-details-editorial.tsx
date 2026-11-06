import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { getPlaceReference } from "../data/place-reference";

export function PlaceClassification({ place }: { place: TripStop }) {
  const { copy, locale } = usePlaceSearchCopy();
  return <StatusBadge label={place.kind[locale] || copy.unclassified} tone="info" />;
}

export function PlaceAmenities({ place }: { place: TripStop }) {
  const { copy } = usePlaceSearchCopy();
  return place.locationType === "address" ? null : <AppText variant="caption" tone="muted">{copy.verifyBeforeVisit}</AppText>;
}

/** Optional editorial information is disclosed after the essential location facts. */
export function PlaceIntroduction({ place }: { place: TripStop }) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const [expanded, setExpanded] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  const reference = getPlaceReference(place);
  return <View style={{ gap: theme.spacing.sm }}>
    <Pressable accessibilityRole="button" accessibilityLabel={expanded ? copy.hideIntroduction : copy.showIntroduction}
      accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)}
      style={({ pressed }) => ({ minHeight: theme.layout.touchTarget, flexDirection: "row", alignItems: "center",
        gap: theme.spacing.sm, opacity: pressed ? theme.motion.pressOpacity : 1 })}>
      <AppText variant="sectionTitle" style={{ flex: 1 }}>{copy.introduction}</AppText>
      <View style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}><AppIcon name="chevron" size={theme.layout.iconSmall} /></View>
    </Pressable>
    {expanded ? <>
      <AppText tone="muted">{reference?.introduction[locale] ?? copy.introductionEmpty}</AppText>
      {reference ? <Pressable accessibilityRole="link" accessibilityLabel={`${copy.referenceSource}: ${reference.source}`}
        onPress={() => { setSourceError(false); void Linking.openURL(reference.url).catch(() => setSourceError(true)); }}
        style={({ pressed }) => ({ minHeight: theme.layout.touchTarget, justifyContent: "center", opacity: pressed ? theme.motion.pressOpacity : 1 })}>
        <AppText variant="link" tone="primary">{copy.referenceSource}: {reference.source}</AppText>
      </Pressable> : null}
      {sourceError ? <AppText accessibilityRole="alert" variant="caption" tone="error">{copy.sourceError}</AppText> : null}
    </> : null}
  </View>;
}
