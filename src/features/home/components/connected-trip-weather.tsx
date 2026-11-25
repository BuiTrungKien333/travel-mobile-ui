import { useState } from "react";
import { Linking, View } from "react-native";
import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import type { AppIconName } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ApiError } from "@/services/api/api-error";
import { useTripWeather } from "@/features/weather/api/weather-queries";
import { weatherDays, weatherIcon } from "@/features/weather/api/weather-api";
import { useLiveWeatherCopy } from "@/features/weather/i18n/weather-copy";
import { JourneySheet } from "./ongoing-trip-panels";
import { TravelWeatherDetails } from "./travel-weather-details";
import { WeatherDateSelector } from "./weather-forecast";

export function WeatherQueryStatus({
  query,
}: {
  query: ReturnType<typeof useTripWeather>;
}): ReactNode {
  const theme = useAppTheme();
  const { copy } = useLiveWeatherCopy();
  const reason = query.data?.unavailableReason;
  if (query.isPending)
    return (
      <AppText accessibilityLiveRegion="polite" tone="muted">
        {copy.loading}
      </AppText>
    );

  if (query.isError)
    return (
      <View style={{ gap: theme.spacing.sm }}>
        <AppText accessibilityRole="alert">
          {query.error instanceof ApiError && query.error.code === "NETWORK"
            ? copy.network
            : copy.error}
        </AppText>
        <AppButton
          variant="outline"
          size="small"
          loading={query.isFetching}
          onPress={() => void query.refetch()}
        >
          {copy.retry}
        </AppButton>
      </View>
    );

  return reason ? <AppText tone="muted">{copy[reason]}</AppText> : null;
}

export function TripWeatherModal({
  tripId,
  destination,
  date,
  onClose,
}: {
  tripId: string;
  destination: string;
  date?: string;
  onClose: () => void;
}) {
  const query = useTripWeather(tripId, date);
  const { copy, locale } = useLiveWeatherCopy();
  const theme = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(date);
  const data = query.data;
  const days = weatherDays(data);
  const selected = days.find((d) => d.date === selectedDate) ?? days[0];
  const daily = data?.forecast?.dailySummaries.find(
    (d) => d.date === selected?.date,
  );

  const current =
    selected?.date === data?.today &&
    data?.current?.time.slice(0, 10) === selected?.date
      ? data?.current
      : null;

  const reference =
    current?.time.slice(11, 16) ??
    (data && selected?.date === data.today
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date(data.fetchedAt))
      : undefined);

  const future =
    daily?.hourlyForecasts.filter(
      (h) => !reference || h.time.slice(11, 16) >= reference,
    ) ?? [];

  const representative =
    current ??
    future.find((h) => h.time.slice(11, 13) === "12") ??
    future[0] ??
    daily?.hourlyForecasts.at(-1);

  const peak = future.reduce<(typeof future)[number] | undefined>(
    (max, h) =>
      !max || h.precipitationProbability > max.precipitationProbability
        ? h
        : max,
    undefined,
  );
  const notablePeak =
    peak && peak.precipitationProbability > 40 ? peak : undefined;
  const hours = future.filter((h, i) => i % 3 === 0 || h === notablePeak);
  const risky =
    future.some((h) => h.riskLevel === "HAZARDOUS") ||
    current?.riskLevel === "HAZARDOUS";
  const rainy =
    (peak?.precipitationProbability ?? 0) > 40 || (current?.rainMm ?? 0) > 0;
  const cold = daily !== undefined && daily.minTemperature < 20;
  const hot = (representative?.temperature ?? 0) >= 30;
  const adviceItems: { icon: AppIconName; text: string }[] = [];
  if (rainy) adviceItems.push({ icon: "umbrella", text: copy.umbrella });
  if (cold) adviceItems.push({ icon: "cloud", text: copy.layer });
  if (!adviceItems.length)
    adviceItems.push({
      icon: hot ? "sun" : "route",
      text: hot ? copy.water : copy.flexible,
    });

  const summary = risky
    ? copy.severe
    : current && current.rainMm > 0
      ? copy.rainNow
      : rainy && peak
        ? copy.rain
            .replace("{chance}", String(peak.precipitationProbability))
            .replace("{time}", peak.time.slice(11, 16))
        : cold
          ? copy.cool
          : hot
            ? copy.hot
            : representative?.condition === "UNKNOWN" || !future.length
              ? copy.flexible
              : copy.clear;

  return (
    <JourneySheet
      title={copy.title}
      onClose={onClose}
      glass
      restrained={!!date}
    >
      <WeatherQueryStatus query={query} />
      {data &&
      selected &&
      daily &&
      representative &&
      !data.unavailableReason ? (
        <>
          {days.length > 1 ? (
            <WeatherDateSelector
              variant="modal"
              days={days}
              selectedDate={selected.date}
              onSelect={setSelectedDate}
            />
          ) : null}
          <TravelWeatherDetails
            restrained={!!date}
            weather={{
              temperature: Math.round(representative.temperature),
              condition: weatherIcon(representative.condition),
              hours: hours.map((h) => ({
                time: h.time.slice(11, 16),
                temperature: Math.round(h.temperature),
                rainChance: h.precipitationProbability,
                condition: weatherIcon(h.condition),
              })),
            }}
            destination={destination}
            conditionLabel={copy.conditions[representative.condition]}
            secondary={
              current
                ? `${copy.feels} ${Math.round(current.apparentTemperature)}°C`
                : `${copy.range}: ${Math.round(daily.minTemperature)}°–${Math.round(daily.maxTemperature)}°C`
            }
            context={`${selected.date.slice(8, 10)}/${selected.date.slice(5, 7)} · ${current ? copy.updated : copy.expected} ${representative.time.slice(11, 16)}`}
            advice={{
              icon: rainy ? "umbrella" : hot ? "sun" : "cloud",
              summary,
              items: adviceItems,
            }}
            footnote={`${copy.area}: ${data.location?.name ?? destination}`}
          />
          {selected.date === data.today && !current ? (
            <AppText variant="caption" tone="muted">
              {copy.currentMissing}
            </AppText>
          ) : null}
          {!future.length ? (
            <AppText variant="caption" tone="muted">
              {copy.hourlyEmpty}
            </AppText>
          ) : null}
          <AppText variant="caption" tone="muted">
            {copy.updated}:{" "}
            {new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              timeZone: "Asia/Ho_Chi_Minh",
            }).format(new Date(data.fetchedAt))}
          </AppText>
          <AppText
            variant="caption"
            tone="primary"
            accessibilityRole="link"
            onPress={() => {
              void Linking.openURL("https://open-meteo.com/").catch(() => {});
            }}
            style={{
              minHeight: theme.layout.touchTarget,
              paddingVertical: theme.spacing.sm,
            }}
          >
            Open-Meteo · CC BY 4.0 ↗
          </AppText>
        </>
      ) : null}
    </JourneySheet>
  );
}
