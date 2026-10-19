import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { suggestedPacking, weatherPreviews } from "../data/weather-preview";
import { useHomeAmbientMotion } from "../hooks/use-home-ambient-motion";
import { useWeatherCopy } from "../i18n/weather-copy";
import type { Trip } from "../types/home-types";
import { homeStyles } from "./home-primitives";
import { TravelWeatherArt } from "./travel-weather-art";
import { TripGlassBackdrop } from "./trip-glass-backdrop";
import { HourlyForecast, WeatherDateSelector } from "./weather-forecast";
import { WeatherPackingChecklist } from "./weather-packing-checklist";

export function TravelWeatherDashboard({ trip }: { trip: Trip }) {
  const theme = useAppTheme();
  const { copy, locale } = useWeatherCopy();
  const preview = weatherPreviews[trip.id];
  const tripDates = trip.days.map((day) => day.date);
  const days =
    preview?.days.filter((day) => tripDates.includes(day.date)) ?? [];
  const [selectedDate, setSelectedDate] = useState(days[0]?.date);
  const selected = days.find((day) => day.date === selectedDate) ?? days[0];
  const progress = useHomeAmbientMotion();
  const tripPacking = suggestedPacking(
    days,
    preview?.hasOutdoorWalking ?? false,
  );

  return (
    <View
      style={[
        styles.dashboard,
        {
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceTint,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <TripGlassBackdrop borderRadius={theme.radius.md} />
      <View style={{ gap: theme.spacing.xxs }}>
        <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
          <AppText
            accessibilityRole="header"
            variant="label"
            style={[
              homeStyles.grow,
              {
                fontSize: theme.typography.fontSize.md,
                lineHeight: theme.typography.lineHeight.md,
                fontFamily: theme.typography.fontFamily.semibold,
              },
            ]}
          >
            {copy.title}
          </AppText>
        </View>
      </View>
      {!selected ? (
        <View style={{ gap: theme.spacing.sm }}>
          <AppIcon
            name="cloud"
            size={theme.layout.iconLarge}
            color={theme.colors.weatherCloud}
          />
          <AppText variant="label">{copy.empty}</AppText>
          <AppText variant="caption" tone="muted">
            {copy.emptyHint}
          </AppText>
        </View>
      ) : (
        <>
          <WeatherDateSelector
            days={days}
            selectedDate={selected.date}
            onSelect={setSelectedDate}
          />
          <View
            style={[
              styles.hero,
              {
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
                borderRadius: theme.radius.md,
                borderColor: theme.colors.glassBorder,
                backgroundColor: theme.colors.glassInset,
              },
            ]}
          >
            <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
              <View style={[homeStyles.grow, { gap: theme.spacing.xxs }]}>
                <AppText
                  variant="caption"
                  tone="muted"
                  style={{ fontFamily: theme.typography.fontFamily.semibold }}
                >
                  {copy.comfort}
                </AppText>
                <View
                  style={[
                    homeStyles.row,
                    { gap: theme.spacing.xs, alignItems: "baseline" },
                  ]}
                >
                  <AppText
                    variant="heading"
                    tone="primary"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {new Intl.NumberFormat(locale, {
                      maximumFractionDigits: 1,
                    }).format(selected.comfort)}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    / 10
                  </AppText>
                </View>
              </View>
              <TravelWeatherArt
                condition={selected.condition}
                progress={progress}
              />
            </View>
            <View
              style={[
                homeStyles.row,
                { gap: theme.spacing.sm, flexWrap: "wrap" },
              ]}
            >
              <AppText
                variant="label"
                tone="primary"
                accessibilityLabel={`${copy.expected}: ${selected.temperature}°C`}
              >
                {selected.temperature}°C
              </AppText>
              <AppText variant="caption" tone="muted">
                · UV {selected.uv}
              </AppText>
              <AppText variant="caption" tone="muted">
                · {copy[selected.condition]}
              </AppText>
            </View>
            {selected.alert ? (
              <View
                style={[
                  homeStyles.row,
                  {
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.weatherRainSurface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.weatherRainSurface,
                  },
                ]}
              >
                <AppIcon
                  name="rain"
                  size={theme.layout.iconSmall}
                  color={theme.colors.weatherRainText}
                />
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.weatherRainText }}
                >
                  {copy.rainAlert
                    .replace("{from}", selected.alert.from)
                    .replace("{to}", selected.alert.to)
                    .replace("{chance}", String(selected.alert.chance))}
                </AppText>
              </View>
            ) : null}
          </View>
          <WeatherPackingChecklist
            items={tripPacking}
            destination={trip.destination}
            animationProgress={progress}
          />
          <HourlyForecast key={selected.date} day={selected} />
          {days.length < tripDates.length ? (
            <AppText variant="caption" tone="muted">
              {copy.coverage}
            </AppText>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dashboard: { overflow: "hidden", borderCurve: "continuous" },
  hero: { borderWidth: StyleSheet.hairlineWidth },
});
