import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { suggestedPacking, weatherPreviews } from "../data/weather-preview";
import { useUpcomingCardMotion } from "../hooks/use-upcoming-card-motion";
import { useWeatherCopy } from "../i18n/weather-copy";
import type { Trip } from "../types/home-types";
import { formatTripDates } from "../utils/select-home";
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
  const progress = useUpcomingCardMotion();
  const tripPacking = suggestedPacking(
    days,
    preview?.hasOutdoorWalking ?? false,
  );
  const status =
    selected && selected.comfort >= 9
      ? copy.ideal
      : selected && selected.comfort >= 8
        ? copy.good
        : copy.prepare;

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
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: theme.layout.footprintWatermarkSize,
            height: theme.layout.footprintWatermarkSize,
            top: -theme.spacing.xxl,
            right: -theme.spacing.xl,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.glassGlow,
          },
        ]}
      />
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
        <AppText variant="caption" tone="muted">
          {trip.destination} · {formatTripDates(trip, locale)}
        </AppText>
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
                <AppText variant="caption" tone="primary">
                  {status}
                </AppText>
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
                    backgroundColor: theme.colors.warningSurface,
                  },
                ]}
              >
                <AppIcon
                  name="rain"
                  size={theme.layout.iconSmall}
                  color={theme.colors.onWarningSurface}
                />
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.onWarningSurface }}
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
  glow: { position: "absolute" },
  hero: { borderWidth: StyleSheet.hairlineWidth },
});
