import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { sampleItineraryStops, samplePhotoCredits } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { SampleStopList } from "./example-itinerary-card";
import { Badge, SurfaceCard } from "./home-primitives";

export function SampleItineraryPanel() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const openPanel = useTripPreview((state) => state.openPanel);
  const [swapped, setSwapped] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const orderedStops = swapped
    ? [...sampleItineraryStops].reverse()
    : sampleItineraryStops;
  const stops = orderedStops.map((stop, index) => ({
    ...stop,
    time: sampleItineraryStops[index].time,
  }));

  return (
    <>
      <Badge label={copy.example} icon="sparkles" />
      <AppText tone="muted">{copy.sampleTryHint}</AppText>
      <SurfaceCard>
        <SampleStopList stops={stops} />
      </SurfaceCard>
      <AppButton
        variant="outline"
        onPress={() => {
          setSwapped((value) => !value);
          setHasInteracted(true);
        }}
      >
        {copy.swapSampleStops}
      </AppButton>
      {hasInteracted ? (
        <AppText
          accessibilityLiveRegion="polite"
          variant="caption"
          tone="primary"
        >
          {swapped ? copy.sampleOrderChanged : copy.sampleOrderOriginal}
        </AppText>
      ) : null}
      <AppButton variant="hero" onPress={() => openPanel({ kind: "create" })}>
        {copy.startOwnTrip}
      </AppButton>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {copy.photoCredits}
        </AppText>
        {samplePhotoCredits.map((credit) => (
          <AppText key={credit.source} variant="caption" tone="muted">
            <Link href={credit.source}>{credit.author}</Link>
            {" · "}
            <Link href={credit.licenseUrl}>{credit.license}</Link>
          </AppText>
        ))}
      </View>
    </>
  );
}
