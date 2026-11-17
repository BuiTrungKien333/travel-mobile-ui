import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import type { PlanningDraft } from "../api/planning-contract";
import { usePlanningCopy } from "../i18n/planning-copy";
import { TripDayMap } from "./trip-day-map";
import { planningRouteSource } from "../utils/planning-route-source";
import { planningTime } from "../utils/planning-time";

export function TripPlanningPreview({ draft }: { draft: PlanningDraft }) {
  const { copy } = usePlanningCopy();
  const theme = useAppTheme();
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState<string>();
  const proposal = draft.proposal;
  const day = proposal.days[index] ?? proposal.days[0];
  const stops: TripStop[] = day?.stops.map(stop => ({
    id: stop.place.placeId, placeId: stop.place.placeId, time: stop.visitStart.slice(11, 16),
    name: { vi: stop.place.name, en: stop.place.name }, kind: { vi: "", en: "" },
    location: { latitude: stop.place.latitude, longitude: stop.place.longitude },
    durationMinutes: stop.place.estimatedDurationMinutes,
  })) ?? [];
  const issues = [...new Map([...proposal.issues, ...proposal.days.flatMap(d => d.issues)]
    .map(issue => [`${issue.code}:${issue.placeId ?? ""}:${issue.message}`, issue])).values()];
  const mode = proposal.executionReport.overallMode;
  const routeSource = planningRouteSource(proposal.metadata);
  return <View style={{ gap: theme.spacing.md }}>
    <AppText variant="subheading">{copy.preview}</AppText>
    <AppText tone="muted">{mode === "AI_ASSISTED" ? copy.ai : mode === "AI_WITH_FALLBACK" ? copy.mixed : copy.fallback}</AppText>
    {proposal.days.length > 1 ? <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
      {proposal.days.map((d, i) => <AppButton key={d.date} size="small" variant={i === index ? "soft" : "outline"}
        accessibilityState={{ selected: i === index }} onPress={() => { setIndex(i); setFocused(undefined); }}>{`${copy.day} ${i + 1}`}</AppButton>)}
    </View> : null}
    {day ? <>
      <AppText variant="label">{day.date} · {day.title}</AppText>
      <AppText>{day.summary}</AppText>
      <View style={{ height: theme.layout.tripMapMinimumHeight, overflow: "hidden", borderRadius: theme.radius.lg }}>
        <TripDayMap stops={stops} origin={{ ...draft.input.origin, address: null }} focusedId={focused} onSelect={setFocused} />
      </View>
      {day.stops.length ? <AppText tone="muted">{planningTime(day.start, day.date)}–{planningTime(day.finish, day.date)} · {day.totalDistanceKm} km · {copy.transit}: {day.totalTransitMinutes} {copy.minutes}</AppText> : null}
      {day.stops.map((stop, i) => <View key={stop.place.placeId} style={{ padding: theme.spacing.md, gap: theme.spacing.xs,
        borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
        <AppText variant="label">{i + 1}. {stop.place.name}</AppText>
        <AppText>{planningTime(stop.visitStart, day.date)}–{planningTime(stop.departure, day.date)} · {copy.visit}: {stop.place.estimatedDurationMinutes} {copy.minutes}</AppText>
        <AppText tone="muted" variant="caption">{copy.transit}: {stop.transitMinutes} {copy.minutes} · {stop.distanceKm} km</AppText>
      </View>)}
      {day.pauses.map((pause, i) => <AppText key={`${pause.start}:${i}`} tone="muted">{copy.rest}: {planningTime(pause.start, day.date)}–{planningTime(pause.end, day.date)}</AppText>)}
      {day.returnToOrigin ? <AppText>{copy.returnAt}: {planningTime(day.returnToOrigin.arrival, day.date)}</AppText> : null}
    </> : null}
    <AppText variant="caption" tone={routeSource === "UNREACHABLE" ? "error" : "muted"}>
      {routeSource === "ROAD" ? copy.road : routeSource === "UNREACHABLE" ? copy.unreachable : routeSource === "NOT_CALCULATED" ? copy.notCalculated : copy.estimate}
    </AppText>
    <AppText variant="caption" tone="muted">{proposal.weather.status === "UNKNOWN" ? copy.weatherUnknown : copy.weather}</AppText>
    {proposal.weather.days.map(d => <AppText key={d.date} variant="caption" tone="muted">
      {d.date}: {d.minTemperature ?? "?"}–{d.maxTemperature ?? "?"}°C · {d.rainProbability ?? "?"}%
    </AppText>)}
    {proposal.unassignedPlaces.length ? <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label">{copy.unassigned}</AppText>
      {proposal.unassignedPlaces.map(p => <AppText key={p.place.placeId}>{p.place.name}: {
        p.reason === "ROAD_ROUTE_UNAVAILABLE" ? copy.unassignedRoad : p.reason === "REQUIRED_PLACE_UNREACHABLE" ? copy.requiredRoad
          : p.reason === "REMOVED_TO_RESOLVE_CONFLICT" || p.reason === "REQUIRED_TIME_LOWER_BOUND" ? copy.unassignedConflict : copy.unassignedOther
      }</AppText>)}
    </View> : null}
    {issues.length ? <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label">{copy.issues}</AppText>
      {issues.map(issue => <AppText key={`${issue.code}:${issue.placeId}:${issue.message}`} tone={issue.blocking ? "error" : "muted"} variant="caption">{issue.message}</AppText>)}
    </View> : null}
    {!draft.canApply ? <AppText accessibilityRole="alert" tone="error">{copy.blocked}</AppText> : null}
  </View>;
}
