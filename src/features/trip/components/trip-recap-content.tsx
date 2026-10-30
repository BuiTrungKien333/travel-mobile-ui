import { useState } from "react";
import { Share, View } from "react-native";
import { Image } from "expo-image";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { MemoryResponse } from "@/features/home/api/memory-types";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { formatTripDates, getTripTitle } from "../utils/trip-formatters";

export function TripRecapContent({ memories }: { memories: MemoryResponse[] }) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  return (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
      <AppText accessibilityRole="header" variant="label">{copy.dayMemories}</AppText>
      {memories.length ? memories.map((memory) => (
        <View key={memory.id} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
          {memory.coverImageUrl ? <Image source={{ uri: memory.coverImageUrl }} contentFit="cover" style={{ width: 64, height: 64, borderRadius: theme.radius.sm }} /> : null}
          {memory.note ? <AppText variant="caption" style={{ flex: 1 }}>{memory.note}</AppText> : null}
        </View>
      )) : (
        <AppText variant="caption" tone="muted">{copy.noDayMemories}</AppText>
      )}
    </View>
  );
}

export function ShareTripButton({ trip }: { trip: Trip }) {
  const { copy, locale } = useTripDetailsCopy();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(false);
  async function share() {
    if (sharing) return;
    setSharing(true);
    setError(false);
    try {
      await Share.share({
        title: getTripTitle(trip, locale),
        message: [
          getTripTitle(trip, locale),
          formatTripDates(trip, locale),
          ...trip.days.map((day, index) =>
            `${copy.day} ${index + 1}: ${day.stops.map((stop) => stop.name[locale]).join(" → ")}`,
          ),
        ].join("\n"),
      });
    } catch {
      setError(true);
    } finally {
      setSharing(false);
    }
  }
  return (
    <View>
      <AppButton size="small" variant="soft" loading={sharing} onPress={share} leadingIcon={<AppIcon name="share" variant="light" />}>
        {copy.shareJourney}
      </AppButton>
      {error ? <AppText accessibilityRole="alert" variant="caption" tone="error">{copy.shareError}</AppText> : null}
    </View>
  );
}
