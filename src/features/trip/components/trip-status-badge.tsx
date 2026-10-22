import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { typography } from "@/theme/tokens";
import type { TripDisplayStatus } from "../utils/trip-formatters";

type TripStatusBadgeProps = {
  status: TripDisplayStatus;
  locale?: "vi" | "en";
};

export function TripStatusBadge({
  status,
  locale = "vi",
}: TripStatusBadgeProps) {
  const theme = useAppTheme();

  const config = {
    ongoing: {
      label: locale === "vi" ? "Đang diễn ra" : "Ongoing",
      bg: theme.colors.successSurface,
      text: theme.colors.onSuccessSurface,
      dotColor: theme.colors.success,
    },
    upcoming: {
      label: locale === "vi" ? "Sắp khởi hành" : "Upcoming",
      bg: theme.colors.surfaceTint,
      text: theme.colors.primaryText,
      dotColor: theme.colors.primary,
    },
    draft: {
      label: locale === "vi" ? "Bản nháp" : "Draft",
      bg: theme.colors.warningSurface,
      text: theme.colors.onWarningSurface,
      dotColor: theme.colors.warning,
    },
    completed: {
      label: locale === "vi" ? "Đã đi" : "Completed",
      bg: theme.colors.surfaceVariant,
      text: theme.colors.textSecondary,
      dotColor: undefined,
    },
    cancelled: {
      label: locale === "vi" ? "Đã hủy" : "Cancelled",
      bg: theme.colors.errorSurface,
      text: theme.colors.onErrorSurface,
      dotColor: undefined,
    },
  }[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.sm,
        },
      ]}
    >
      {config.dotColor ? (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: config.dotColor,
            },
          ]}
        />
      ) : null}
      <AppText
        variant="caption"
        style={[
          styles.text,
          {
            color: config.text,
            fontFamily: theme.typography.fontFamily.medium,
          },
        ]}
      >
        {config.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 3,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: typography.fontSize.navigationLabel,
    lineHeight: typography.lineHeight.navigationLabel,
    includeFontPadding: false,
  },
});
