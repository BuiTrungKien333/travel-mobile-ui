import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { Trip, TripDay } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { usePlaceRouteQuery, useWeatherForecastQuery, useCurrentWeatherQuery } from "../api/maps-hooks";
import { dayRoutePoints } from "../utils/day-route";
import type { TripDetailsSheetState } from "../types/trip-details-types";

/** Summary includes scheduled visits only; origin legs aren't invented. */
export function TripDayTools({
  day,
  today,
  onSheetChange: setSheet,
  canEdit,
  editHistory,
  showWeather = true,
  reorderAtEnd = false,
  showOptimize = false,
}: {
  trip: Trip;
  day?: TripDay;
  today: string;
  onSheetChange: (sheet: TripDetailsSheetState) => void;
  canEdit: boolean;
  editHistory: boolean;
  showWeather?: boolean;
  reorderAtEnd?: boolean;
  showOptimize?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const routePoints = dayRoutePoints(day);
  const routeQuery = usePlaceRouteQuery(routePoints ?? [], routePoints !== null, day?.transport);
  const weatherLocation = day?.stops.find((stop) => stop.location)?.location;
  const weatherQuery = useWeatherForecastQuery(weatherLocation?.latitude, weatherLocation?.longitude, day?.date, showWeather);
  const current = useCurrentWeatherQuery(weatherLocation?.latitude, weatherLocation?.longitude, showWeather && day?.date === today);
  const summary = weatherQuery.data?.dailySummaries.find((item) => item.date === day?.date);
  const currentWeather = day?.date === today ? current.data : undefined;
  const weatherCondition = currentWeather?.condition ?? summary?.dominantCondition;
  const temperature = currentWeather?.temperature ?? (summary ? (summary.minTemperature + summary.maxTemperature) / 2 : undefined);
  const forecast: { condition: "sun" | "rain" | "cloud"; temperature: number } | undefined = temperature !== undefined ? { condition: weatherCondition === "CLEAR_SKY" ? "sun" : weatherCondition === "LIGHT_RAIN" || weatherCondition === "RAINY" || weatherCondition === "HEAVY_RAIN" || weatherCondition === "THUNDERSTORM" ? "rain" : "cloud", temperature: Math.round(temperature) } : undefined;
  const travel = routePoints && routePoints.length === 1 && (day?.stops.length ?? 0) > 0 ? { complete: true, km: 0, minutes: 0 }
    : routeQuery.data ? { complete: true, km: routeQuery.data.distanceMeters / 1000, minutes: Math.round(routeQuery.data.durationSeconds / 60) } : null;
  const reorderLink =
    canEdit && day && day.stops.length > 1 ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.reorder}
        onPress={() => setSheet({ kind: "reorder" })}
        style={({ pressed }) => ({
          minHeight: theme.layout.compactTouchTarget,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs,
          justifyContent: "center",
          opacity: pressed ? theme.motion.pressOpacity : 1,
        })}
      >
        <AppText
          variant="caption"
          tone="primary"
          style={{ fontFamily: theme.typography.fontFamily.semibold }}
        >
          {copy.reorder}
        </AppText>
        <AppIcon
          name="reorder"
          size={theme.spacing.lg}
          color={theme.colors.primaryText}
        />
      </Pressable>
    ) : null;
  return (
    <View
      style={{
        gap: theme.spacing.sm,
        paddingBottom: showOptimize ? theme.spacing.xl : theme.spacing.md,
      }}
    >
      <View
        style={[
          styles.inline,
          { gap: theme.spacing.sm, justifyContent: "space-between" },
        ]}
      >
        <View style={styles.grow}>
          <View style={[styles.inline, { gap: theme.spacing.md }]}>
            <AppText variant="label">
              {day?.stops.length ?? 0} {copy.places}
            </AppText>
            {!reorderAtEnd ? reorderLink : null}
          </View>
          <AppText variant="caption" tone="muted">
            {travel?.complete &&
            (day?.stops.length ?? 0) > 0
              ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(travel.km)} km · ${travel.minutes} ${copy.minutes} · ${copy.estimate}`
              : day?.startLocation && !day.startCoordinate ? copy.originSelectRequired : copy.unknownRoute}
          </AppText>
        </View>
        {showOptimize && day ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.optimize}
            onPress={() => setSheet({ kind: "optimize" })}
            style={({ pressed }) => ({
              width: theme.layout.compactTouchTarget,
              height: theme.layout.compactTouchTarget,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.glassGlow,
              boxShadow: [
                { ...theme.elevation.glass, color: theme.colors.glassShadow },
                {
                  ...theme.elevation.raisedActionHighlight,
                  color: theme.colors.glassInset,
                },
              ],
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <GlassBackdrop borderRadius={theme.radius.full} />
            <AppIcon
              name="sparkles"
              variant="light"
              size={theme.layout.iconMedium}
              color={theme.colors.primaryText}
            />
          </Pressable>
        ) : reorderAtEnd ? (
          reorderLink
        ) : showWeather ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.weather}
            onPress={() => setSheet({ kind: "weather" })}
            style={({ pressed }) => [
              styles.inline,
              {
                gap: theme.spacing.xs,
                minHeight: theme.layout.compactTouchTarget,
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.weatherGlassSurface,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppIcon
              name={
                forecast?.condition ?? "cloud"
              }
              size={theme.layout.iconMedium}
            />
            <AppText variant="caption" tone="primary">
              {forecast
                  ? `${forecast.temperature}°`
                  : copy.weather}
            </AppText>
            <AppIcon name="chevron" size={theme.layout.iconSmall} />
          </Pressable>
        ) : null}
      </View>
      {canEdit && day ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.transport}: ${copy[day.transport ?? "car"]}`}
          onPress={() => setSheet({ kind: "transport" })}
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            minHeight: theme.layout.compactTouchTarget,
            justifyContent: "center",
            opacity: pressed ? theme.motion.pressOpacity : 1,
          })}
        >
          <View
            style={[
              styles.inline,
              {
                gap: theme.spacing.xs,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.radius.full,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.softActionBorder,
                backgroundColor: theme.colors.surfaceTint,
              },
            ]}
          >
            <AppIcon
              name={day.transport ?? "car"}
              size={theme.layout.iconSmall}
            />
            <AppText variant="caption" tone="primary">
              {copy[day.transport ?? "car"]}
            </AppText>
            <View style={{ transform: [{ rotate: "90deg" }] }}>
              <AppIcon name="chevron" size={theme.layout.iconSmall} />
            </View>
          </View>
        </Pressable>
      ) : null}
      {editHistory ? (
        <AppText variant="caption" tone="muted">
          {copy.editHistoryHint}
        </AppText>
      ) : null}
    </View>
  );
}

type DateTab = { key: string; date?: string; index: number };
export function TripDaySelector({
  trip,
  selectedDate,
  backlog,
  backlogCount,
  onSelect,
}: {
  trip: Trip;
  selectedDate?: string;
  backlog: boolean;
  backlogCount: number;
  onSelect: (date: string | null) => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const data: DateTab[] = [
    ...trip.days.map((day, index) => ({
      key: day.date,
      date: day.date,
      index,
    })),
    { key: "backlog", index: trip.days.length },
  ];
  const width = theme.layout.tripDateTabWidth + theme.spacing.sm;
  return (
    <FlatList
      horizontal
      data={data}
      style={{ flexGrow: 0 }}
      initialScrollIndex={
        backlog
          ? data.length - 1
          : Math.max(
              0,
              trip.days.findIndex((day) => day.date === selectedDate),
            )
      }
      getItemLayout={(_, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
      }}
      renderItem={({ item }) => {
        const selected = item.date
          ? !backlog && item.date === selectedDate
          : backlog;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              item.date
                ? `${copy.day} ${item.index + 1}, ${item.date}`
                : `${copy.pool} (${backlogCount})`
            }
            onPress={() => onSelect(item.date ?? null)}
            style={({ pressed }) => ({
              width: theme.layout.tripDateTabWidth,
              minHeight: theme.layout.touchTarget,
              padding: theme.spacing.sm,
              gap: theme.spacing.xs,
              borderRadius: theme.radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: selected
                ? theme.colors.primaryText
                : theme.colors.border,
              backgroundColor: selected
                ? theme.colors.surfaceTint
                : theme.colors.surface,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppText
              variant="caption"
              tone={selected ? "primary" : "default"}
              style={{ fontFamily: theme.typography.fontFamily.medium }}
            >
              {item.date ? `${copy.day} ${item.index + 1}` : copy.pool}
            </AppText>
            <AppText variant="caption" tone="muted">
              {item.date
                ? new Intl.DateTimeFormat(locale, {
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: "UTC",
                  }).format(new Date(`${item.date}T12:00:00Z`))
                : `(${backlogCount})`}
            </AppText>
          </Pressable>
        );
      }}
    />
  );
}
const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  inline: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
});
