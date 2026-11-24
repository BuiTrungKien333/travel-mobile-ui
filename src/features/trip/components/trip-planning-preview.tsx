import { useState } from "react";
import { router } from "expo-router";
import { Pressable, View, useWindowDimensions } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import type { PlanningDraft } from "../api/planning-contract";
import { usePlanningCopy } from "../i18n/planning-copy";
import { TripDayMap } from "./trip-day-map";
import { TripStopRow } from "./trip-stop-row";
import { planningTime } from "../utils/planning-time";

export function TripPlanningPreview({ draft }: { draft: PlanningDraft }) {
  const { copy } = usePlanningCopy();
  const theme = useAppTheme();
  const { height: viewportHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState<string>();
  const proposal = draft.proposal;
  const blockingIssues = [...new Set(proposal.issues.filter(issue => issue.blocking).map(issue => issue.message))];
  const day = proposal.days[index] ?? proposal.days[0];
  const stops: TripStop[] = day?.stops.map(stop => ({
    id: stop.place.placeId, placeId: stop.place.placeId, time: stop.visitStart.slice(11, 16),
    name: { vi: stop.place.name, en: stop.place.name }, kind: { vi: "", en: "" },
    location: { latitude: stop.place.latitude, longitude: stop.place.longitude },
    durationMinutes: stop.place.estimatedDurationMinutes,
  })) ?? [];
  const mapPath = day ? [
    [draft.input.origin.longitude, draft.input.origin.latitude] as [number, number],
    ...day.stops.map(stop => [stop.place.longitude, stop.place.latitude] as [number, number]),
  ] : [];
  // The same proposal warning can be attached to every stop. Show each message once.
  const mode = proposal.executionReport.overallMode;
  return <View style={{ gap: theme.spacing.lg }}>
    {day ? <View style={{ height: Math.min(400, Math.max(280, viewportHeight * 0.35)), overflow: "hidden", marginHorizontal: -theme.spacing.lg }}>
      <TripDayMap
        stops={stops}
        pathCoordinates={mapPath}
        origin={{ ...draft.input.origin, address: null }}
        focusedId={focused}
        onSelect={setFocused}
      />
    </View> : null}
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
      <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceTint }}>
        <AppIcon name="sparkles" color={theme.colors.primaryText} />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="subheading">{copy.preview}</AppText>
        <AppText variant="caption" tone="muted">{mode === "AI_ASSISTED" ? copy.ai : mode === "AI_WITH_FALLBACK" ? copy.mixed : copy.fallback}</AppText>
      </View>
      <View style={{ paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.full, backgroundColor: theme.colors.warningSurface }}>
        <AppText variant="caption" style={{ color: theme.colors.onWarningSurface }}>{copy.unapplied}</AppText>
      </View>
    </View>
    {proposal.days.length > 1 ? <View accessibilityRole="tablist" style={{ flexDirection: "row", padding: theme.spacing.xxs, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
      {proposal.days.map((d, i) => <Pressable key={d.date} accessibilityRole="tab" accessibilityState={{ selected: i === index }}
        style={({ pressed }) => ({ flex: 1, minHeight: 72, alignItems: "center", justifyContent: "center", gap: theme.spacing.xxs, paddingHorizontal: theme.spacing.xs, borderRadius: theme.radius.sm,
          backgroundColor: i === index ? theme.colors.surface : "transparent", opacity: pressed ? theme.motion.pressOpacity : 1 })}
        onPress={() => { setIndex(i); setFocused(undefined); }}>
        <AppText variant="label" tone={i === index ? "primary" : "muted"} numberOfLines={1} style={{ textAlign: "center" }}>
          {`${copy.day} ${i + 1} - ${formatDayMonth(d.date)}`}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2} style={{ textAlign: "center" }}>
          {dayThemeTitle(d.title) || `${copy.day} ${i + 1}`}
        </AppText>
      </Pressable>)}
    </View> : null}
    {day ? <>
      {proposal.days.length === 1 ? <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <AppIcon name="calendar" size={theme.layout.iconSmall} color={theme.colors.primaryText} />
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <AppText variant="sectionTitle">{`${copy.day} 1 - ${formatDayMonth(day.date)}`}</AppText>
          <AppText variant="body" tone="muted">{dayThemeTitle(day.title) || `${copy.day} 1`}</AppText>
        </View>
      </View> : null}
      {day.stops.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
        <Metric icon="clock" value={`${planningTime(day.start, day.date)}–${planningTime(day.finish, day.date)}`} />
        <Metric icon="pin" value={`${day.stops.length} ${copy.places}`} />
        <Metric icon="route" value={`${day.totalDistanceKm} km`} />
        <Metric icon="clock" value={`${day.totalTransitMinutes} ${copy.minutes}`} />
      </View> : null}
      <View>
        {day.stops.map((stop, i) => <TripStopRow
          key={stop.place.placeId}
          stop={stops[i]}
          previous={i > 0 ? stops[i - 1] : undefined}
          visited={false}
          next={focused === stop.place.placeId}
          mode="car"
          onOpen={() => router.push({
            pathname: "/trip/place-details",
            params: {
              planningPlaceId: stop.place.placeId,
              tripId: draft.tripId,
              day: day.date,
              visitStart: stop.visitStart,
              departure: stop.departure,
              durationMinutes: String(stop.place.estimatedDurationMinutes),
            },
          })}
          number={i + 1}
          fromStart={i === 0}
          last={i === day.stops.length - 1}
          preview={false}
          savedLeg={{ km: stop.distanceKm, minutes: stop.transitMinutes }}
        />)}
      </View>
      {day.returnToOrigin ? <AppText variant="body" tone="muted">{copy.returnAt}: {planningTime(day.returnToOrigin.arrival, day.date)}</AppText> : null}
    </> : null}
    {proposal.unassignedPlaces.length ? <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label">{copy.unassigned}</AppText>
      {proposal.unassignedPlaces.map(p => <AppText key={p.place.placeId} variant="body" tone="muted">{p.place.name}: {
        p.reason === "ROAD_ROUTE_UNAVAILABLE" ? copy.unassignedRoad : p.reason === "REQUIRED_PLACE_UNREACHABLE" ? copy.requiredRoad
          : p.reason === "REMOVED_TO_RESOLVE_CONFLICT" || p.reason === "REQUIRED_TIME_LOWER_BOUND" ? copy.unassignedConflict : copy.unassignedOther
      }</AppText>)}
    </View> : null}
    {blockingIssues.length ? <View accessibilityRole="alert" style={{ gap: theme.spacing.xs }}>
      <AppText variant="label" tone="error">{copy.blocked}</AppText>
      {blockingIssues.map(message => <AppText key={message} variant="body" tone="error">{message}</AppText>)}
    </View> : !draft.canApply ? <AppText accessibilityRole="alert" tone="error">{copy.blocked}</AppText> : null}
  </View>;
}

function formatDayMonth(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

function dayThemeTitle(title: string) {
  return title.replace(/^Ngày\s+\d+\s*[—-]\s*/, "").trim();
}

function Metric({ icon, value }: { icon: "clock" | "pin" | "route"; value: string }) {
  const theme = useAppTheme();
  return <View style={{ width: "50%", flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, paddingRight: theme.spacing.sm }}>
    <AppIcon name={icon} size={theme.layout.iconSmall} color={theme.colors.primaryText} />
    <AppText variant="label">{value}</AppText>
  </View>;
}
