import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ForecastDay } from "../data/weather-preview";
import { formatForecastDate, useWeatherCopy } from "../i18n/weather-copy";
import { homeStyles } from "./home-primitives";

export function WeatherDateSelector({
  days,
  selectedDate,
  onSelect,
  variant = "inline",
}: {
  days: ForecastDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
  variant?: "inline" | "modal";
}) {
  const theme = useAppTheme();
  const { copy, locale } = useWeatherCopy();
  const inModal = variant === "modal";
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm }}
    >
      {days.map((day) => {
        const selected = day.date === selectedDate;
        return (
          <Pressable
            key={day.date}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${formatForecastDate(day.date, locale)}, ${copy[day.condition]}, ${day.low}–${day.high}°C`}
            onPress={() => onSelect(day.date)}
            style={({ pressed }) => [
              {
                minHeight: theme.layout.touchTarget,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                gap: theme.spacing.xs,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: theme.radius.sm,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: selected
                  ? theme.colors.softActionBorder
                  : inModal
                    ? theme.colors.border
                    : theme.colors.glassBorder,
                backgroundColor: selected
                  ? theme.colors.softActionSurface
                  : inModal
                    ? theme.colors.surface
                    : theme.colors.glassInset,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppText
              variant="caption"
              tone={selected ? "primary" : inModal ? "default" : "muted"}
              style={{
                fontFamily: selected
                  ? theme.typography.fontFamily.semibold
                  : theme.typography.fontFamily.medium,
              }}
            >
              {formatForecastDate(day.date, locale)}
            </AppText>
            <View style={[homeStyles.row, { gap: theme.spacing.xs }]}>
              <AppIcon name={day.condition} size={theme.layout.iconSmall} />
              <AppText variant="caption" tone="muted">
                {day.low}°–{day.high}°
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function HourlyForecast({ day }: { day: ForecastDay }) {
  const theme = useAppTheme();
  const { copy } = useWeatherCopy();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText accessibilityRole="header" variant="label">
        {copy.hourly}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: theme.spacing.sm,
          paddingBottom: theme.spacing.xs,
        }}
      >
        {day.hours.map((hour) => (
          <View
            key={`${day.date}-${hour.time}`}
            accessible
            accessibilityLabel={`${hour.time}, ${copy[hour.condition]}, ${hour.temperature}°C, ${copy.rainChance} ${hour.rainChance}%. ${hour.experience ? copy.experiences[hour.experience] : ""}`}
            style={[
              styles.hour,
              {
                width: theme.layout.weatherHourCardWidth,
                padding: theme.spacing.sm,
                gap: theme.spacing.xs,
                borderRadius: theme.radius.sm,
                borderColor: theme.colors.glassBorder,
                backgroundColor:
                  hour.experience === "photo"
                    ? theme.colors.warningSurface
                    : theme.colors.glassInset,
              },
            ]}
          >
            <View
              style={[
                homeStyles.row,
                styles.hourHeader,
                { gap: theme.spacing.xs },
              ]}
            >
              <AppText
                variant="caption"
                style={{ fontFamily: theme.typography.fontFamily.semibold }}
              >
                {hour.time}
              </AppText>
              <AppIcon
                name={hour.condition}
                size={theme.layout.iconSmall}
                color={
                  hour.condition === "sun"
                    ? theme.colors.weatherSun
                    : theme.colors.primaryText
                }
              />
            </View>
            <AppText variant="label">{hour.temperature}°</AppText>
            <View style={[homeStyles.row, { gap: theme.spacing.xs }]}>
              <AppIcon
                name="rain"
                size={theme.typography.fontSize.xs}
                color={theme.colors.textSecondary}
              />
              <AppText variant="caption" tone="muted">
                {hour.rainChance}%
              </AppText>
            </View>
            {hour.experience ? (
              <AppText variant="caption" tone="primary" style={styles.center}>
                {copy.experiences[hour.experience]}
              </AppText>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hour: { alignItems: "center", borderWidth: StyleSheet.hairlineWidth },
  hourHeader: { width: "100%", justifyContent: "space-between" },
  center: { textAlign: "center" },
});
