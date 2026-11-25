import { Pressable, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing } from "@/theme/tokens";
import { useTripCopy } from "../i18n/trip-copy";
import {
  formatDisplayDate,
  tripMessage,
} from "../utils/create-trip-formatters";
import type { Dispatch, SetStateAction } from "react";
import { createTripStyles as styles } from "./create-trip-styles";

type Props = {
  startDate: string;
  endDate: string;
  durationDays: number;
  setShowDateSheet: Dispatch<SetStateAction<boolean>>;
};

export function CreateTripDatesCard({
  startDate,
  endDate,
  durationDays,
  setShowDateSheet,
}: Props) {
  const theme = useAppTheme();
  const { copy, locale } = useTripCopy();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tripMessage(copy.dateSummary, {
        start: formatDisplayDate(startDate, locale),
        end: formatDisplayDate(endDate, locale),
        count: durationDays,
      })}
      onPress={() => setShowDateSheet(true)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        },
      ]}
    >
      <View style={styles.dateHeaderRow}>
        <View style={styles.dateHeaderLeft}>
          <View
            style={[
              styles.iconCircleSmall,
              { backgroundColor: theme.colors.surfaceTint },
            ]}
          >
            <AppIcon
              name="calendar"
              size={15}
              color={theme.colors.primaryText}
            />
          </View>
          <AppText
            style={[
              styles.dateCardTitle,
              {
                fontFamily: theme.typography.fontFamily.semibold,
                color: theme.colors.text,
              },
            ]}
          >
            {copy.tripDates}
          </AppText>
        </View>

        {/* Duration badge */}
        <View
          style={[
            styles.durationBadge,
            { backgroundColor: theme.colors.surfaceTint },
          ]}
        >
          <AppText
            style={[
              styles.durationText,
              {
                color: theme.colors.primaryText,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {durationDays > 0 ? `${durationDays} ${copy.days}` : "--"}
          </AppText>
        </View>
      </View>

      {/* 2 separate columns with middle divider */}
      <View
        style={[
          styles.dateColumnsContainer,
          {
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        {/* Ngày đi */}
        <View style={styles.dateColumnBlock}>
          <AppText variant="caption" tone="muted">
            {copy.startDate}
          </AppText>
          <AppText
            style={[
              styles.dateValueText,
              {
                fontFamily: theme.typography.fontFamily.medium,
                color: startDate
                  ? theme.colors.text
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {formatDisplayDate(startDate, locale)}
          </AppText>
        </View>

        {/* Vertical divider */}
        <View
          style={[
            styles.dateVerticalDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />

        {/* Ngày về */}
        <View style={[styles.dateColumnBlock, { paddingLeft: spacing.sm }]}>
          <AppText variant="caption" tone="muted">
            {copy.endDate}
          </AppText>
          <AppText
            style={[
              styles.dateValueText,
              {
                fontFamily: theme.typography.fontFamily.medium,
                color: endDate ? theme.colors.text : theme.colors.textSecondary,
              },
            ]}
          >
            {formatDisplayDate(endDate, locale)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
