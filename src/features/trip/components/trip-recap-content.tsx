import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { JourneyCard } from "@/features/home/components/journey-card";
import { JournalAlbum } from "@/features/home/components/journal-album";
import type { Memory, Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { formatTripDates, getTripTitle } from "../utils/trip-formatters";

export function TripRecapContent({
  memories,
  onJournal,
  onDeletePhoto,
  showAllPhotos,
}: {
  memories: Memory[];
  onJournal?: () => void;
  onDeletePhoto?: (memory: Memory) => Promise<void>;
  showAllPhotos?: boolean;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  return (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
      {memories.some((memory) => !!memory.photo) ? (
        <JournalAlbum
          memories={memories.filter((memory) => !!memory.photo)}
          onOpen={onJournal}
          onDeletePhoto={onDeletePhoto}
          showAllPhotos={showAllPhotos}
          variant="recent"
          title={copy.dayMemories}
        />
      ) : !memories.some((memory) => memory.text.trim()) ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderStyle: "dashed",
            borderColor: theme.colors.borderStrong,
            backgroundColor: theme.colors.glassInset,
          }}
        >
          <View
            style={{
              width: theme.layout.touchTarget,
              height: theme.layout.touchTarget,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.sm,
            }}
          >
            <AppIcon
              name="memories"
              variant="light"
              size={theme.layout.iconMedium}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
            <AppText variant="label">{copy.noDayMemories}</AppText>
            <AppText variant="caption" tone="muted">
              {copy.noDayMemoriesHint}
            </AppText>
          </View>
        </View>
      ) : null}
      {memories
        .filter((memory) => memory.text)
        .map((memory) => (
          <JourneyCard key={memory.id}>
            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.sm,
                alignItems: "center",
              }}
            >
              <AppIcon name="clock" size={theme.layout.iconSmall} />
              <AppText variant="caption" tone="primary">
                {memory.time ?? "—"}
              </AppText>
            </View>
            <AppText variant="body">{memory.text}</AppText>
          </JourneyCard>
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
