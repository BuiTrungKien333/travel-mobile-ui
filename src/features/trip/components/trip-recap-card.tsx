import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { JourneyCard } from "@/features/home/components/journey-card";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { formatTripDates, getTripTitle } from "../utils/trip-formatters";
import { getSampleImage, getTripCoverImage } from "../utils/trip-images";

/** Counts come from the trip API, never inferred from the six-photo Home preview. */
export function TripRecapCard({
  trip,
  dayCount,
  stopCount,
  memoryCount,
  onOpen,
  showCover = false,
}: {
  trip: Trip;
  dayCount: number;
  stopCount: number;
  memoryCount: number;
  onOpen?: () => void;
  showCover?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const [failed, setFailed] = useState(false);
  const dates =
    trip.startDate && trip.endDate
      ? trip.startDate === trip.endDate
        ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${trip.startDate}T12:00:00Z`))
        : formatTripDates(trip, locale)
      : undefined;
  return (
    <JourneyCard variant="neutral">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        {showCover ? (
          <Image
            accessible={false}
            source={failed ? getSampleImage(trip.id) : getTripCoverImage(trip)}
            onError={() => setFailed(true)}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={{
              width: theme.layout.journeyThumbnailSize,
              height: theme.layout.journeyThumbnailSize,
              borderRadius: theme.radius.md,
            }}
          />
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.xs,
              alignItems: "center",
              alignSelf: "flex-start",
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.surfaceTint,
            }}
          >
            <AppIcon
              name="tick"
              size={theme.layout.iconSmall}
              color={theme.colors.primaryText}
            />
            <AppText
              variant="caption"
              tone="primary"
              style={{ fontFamily: theme.typography.fontFamily.semibold }}
            >
              {copy.recapComplete}
            </AppText>
          </View>
          <AppText
            accessibilityRole="header"
            variant="sectionTitle"
            style={{
              fontSize: theme.typography.fontSize.lg,
              lineHeight: theme.typography.lineHeight.lg,
              marginTop: theme.spacing.xs,
            }}
          >
            {getTripTitle(trip, locale)}
          </AppText>
          {dates ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.xs,
              }}
            >
              <AppIcon
                name="calendar"
                size={theme.layout.iconSmall}
                color={theme.colors.textSecondary}
              />
              <AppText variant="caption" tone="muted" style={{ flexShrink: 1 }}>
                {dates}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
        }}
      >
        {[
          { value: dayCount, label: copy.daysUnit },
          { value: stopCount, label: copy.places },
          { value: memoryCount, label: copy.recapMemoriesUnit },
        ].map(({ value, label }) => (
          <View
            key={label}
            style={{
              flex: 1,
              minWidth: 0,
              alignItems: "center",
              gap: theme.spacing.xs,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.background,
            }}
          >
            <AppText
              variant="sectionTitle"
              tone={value ? "primary" : "muted"}
              style={{
                fontSize: theme.typography.fontSize.xl,
                lineHeight: theme.typography.lineHeight.xl,
                fontVariant: ["tabular-nums"],
              }}
            >
              {new Intl.NumberFormat(locale).format(value)}
            </AppText>
            <AppText
              variant="caption"
              tone="muted"
              style={{ textAlign: "center" }}
            >
              {label}
            </AppText>
          </View>
        ))}
      </View>
      {onOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.revisitTrip}
          onPress={onOpen}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.sm,
            minHeight: theme.layout.compactTouchTarget,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.softActionBorder,
            backgroundColor: theme.colors.glassInset,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          })}
        >
          <AppText variant="label" tone="primary">
            {copy.revisitTrip}
          </AppText>
          <AppIcon name="arrow" size={theme.layout.iconSmall} />
        </Pressable>
      ) : null}
    </JourneyCard>
  );
}
