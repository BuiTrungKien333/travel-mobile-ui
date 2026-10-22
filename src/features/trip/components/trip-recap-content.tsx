import { useState } from "react";
import { Share, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { JournalAlbum } from "@/features/home/components/journal-album";
import type { Memory, Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { formatTripDates, getTripTitle } from "../utils/trip-formatters";

export function TripRecapContent({
  memories,
  onJournal,
}: {
  memories: Memory[];
  onJournal: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  return (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
      {memories.length ? (
        <JournalAlbum
          memories={memories}
          onOpen={onJournal}
          variant="recent"
          title={copy.dayMemories}
        />
      ) : (
        <AppText variant="caption" tone="muted">
          {copy.noDayMemories}
        </AppText>
      )}
      {memories
        .filter((memory) => memory.text)
        .map((memory) => (
          <View
            key={memory.id}
            style={{ flexDirection: "row", gap: theme.spacing.md }}
          >
            <AppText variant="caption" tone="primary">
              {memory.time ?? "—"}
            </AppText>
            <AppText variant="caption" style={{ flex: 1 }}>
              {memory.text}
            </AppText>
          </View>
        ))}
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
          ...trip.days.map(
            (day, index) =>
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
      <AppButton
        size="small"
        variant="soft"
        loading={sharing}
        onPress={share}
        leadingIcon={<AppIcon name="share" variant="light" />}
      >
        {copy.shareJourney}
      </AppButton>
      {error ? (
        <AppText accessibilityRole="alert" variant="caption" tone="error">
          {copy.shareError}
        </AppText>
      ) : null}
    </View>
  );
}
