import { ContentImage } from "@/components/ui/content-image";
import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, layout } from "@/theme/tokens";
import {
  formatTripDates,
  formatTripDurationAndStops,
  getTripDisplayStatus,
  getTripTitle,
} from "../utils/trip-formatters";
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
          borderRadius: theme.radius.xl,
          paddingLeft: theme.spacing.md,
          paddingVertical: theme.spacing.md,
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
              borderRadius: theme.radius.lg,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ContentImage source={trip.coverImage} label={trip.destination} emptyLabel={locale === "vi" ? "Chưa có ảnh bìa" : "No cover photo"} />
        </View>

        {/* Right column: All trip details */}
        <View style={styles.infoColumn}>
          {/* Status badge */}
          <View style={styles.badgeRow}>
            <TripStatusBadge status={displayStatus} locale={locale} />
          </View>

          {/* Trip Name */}
          <AppText
            variant="sectionTitle"
            numberOfLines={2}
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
            <AppIcon name="pin" size={theme.layout.iconSmall} color={theme.colors.primaryText} />
            <AppText
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
              size={theme.layout.iconSmall}
              color={theme.colors.textSecondary}
            />
            <AppText
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
              size={theme.layout.iconSmall}
              color={theme.colors.textSecondary}
            />
            <AppText
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
    gap: spacing.xs,
  },
  badgeRow: {
    marginBottom: spacing.xxs,
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
    width: layout.tripCardImageWidth,
    minHeight: layout.tripCardImageHeight,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
});
