import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatTripDates,
  formatTripDurationAndStops,
  getTripDisplayStatus,
  getTripTitle,
} from "../utils/trip-formatters";
import { getTripCoverImage } from "../utils/trip-images";
import { TripStatusBadge } from "./trip-status-badge";

type TripCardProps = {
  trip: Trip;
  today: string;
  locale?: "vi" | "en";
  onPress: (trip: Trip) => void;
};

export function TripCard({
  trip,
  today,
  locale = "vi",
  onPress,
}: TripCardProps) {
  const theme = useAppTheme();
  const displayStatus = getTripDisplayStatus(trip, today);
  const title = getTripTitle(trip, locale);
  const datesText = formatTripDates(trip, locale);
  const durationAndStops = formatTripDurationAndStops(trip, locale);
  const coverImage = getTripCoverImage(trip);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${trip.destination}`}
      onPress={() => onPress(trip)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingLeft: 4,
          paddingVertical: 10,
          paddingRight: theme.spacing.md,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        },
      ]}
    >
      <View style={[styles.contentRow, { gap: theme.spacing.md }]}>
        {/* Left column: Sample Image (hugging left edge) */}
        <View
          style={[
            styles.imageWrapper,
            {
              borderRadius: theme.radius.sm,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Image
            source={coverImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Right column: All trip details */}
        <View style={styles.infoColumn}>
          {/* Status badge */}
          <View style={styles.badgeRow}>
            <TripStatusBadge status={displayStatus} locale={locale} />
          </View>

          {/* Trip Name */}
          <AppText
            variant="heading"
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                lineHeight: theme.typography.lineHeight.md,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {title}
          </AppText>

          {/* Destination */}
          <View style={[styles.metaRow, { gap: theme.spacing.xs }]}>
            <AppIcon
              name="pin"
              size={14}
              color={theme.colors.primaryText}
            />
            <AppText
              numberOfLines={1}
              style={[
                styles.metaText,
                {
                  color: theme.colors.primaryText,
                  fontSize: theme.typography.fontSize.xs,
                  lineHeight: theme.typography.lineHeight.xs,
                  fontFamily: theme.typography.fontFamily.medium,
                },
              ]}
            >
              {trip.destination}
            </AppText>
          </View>

          {/* Dates */}
          <View style={[styles.metaRow, { gap: theme.spacing.xs }]}>
            <AppIcon
              name="calendar"
              size={13}
              color={theme.colors.textSecondary}
            />
            <AppText
              numberOfLines={1}
              style={[
                styles.metaText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                  lineHeight: theme.typography.lineHeight.xs,
                  fontFamily: theme.typography.fontFamily.regular,
                },
              ]}
            >
              {datesText}
            </AppText>
          </View>

          {/* Duration & Stops */}
          <View style={[styles.metaRow, { gap: theme.spacing.xs }]}>
            <AppIcon
              name="route"
              size={13}
              color={theme.colors.textSecondary}
            />
            <AppText
              numberOfLines={1}
              style={[
                styles.metaText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.xs,
                  lineHeight: theme.typography.lineHeight.xs,
                  fontFamily: theme.typography.fontFamily.regular,
                },
              ]}
            >
              {durationAndStops}
            </AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between",
    gap: 4,
  },
  badgeRow: {
    marginBottom: 2,
  },
  title: {
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    flex: 1,
    minWidth: 0,
  },
  imageWrapper: {
    width: 104,
    height: 120,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
});
