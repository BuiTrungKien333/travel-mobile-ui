import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { usePlaceDetail } from "../api/place-discovery-queries";
import { discoveryStop } from "../api/place-discovery-api";
import { PlaceDetailsContent } from "../components/place-details-content";
import { PlaceClassification } from "../components/place-details-editorial";
import { SharePlaceButton } from "../components/share-place-button";
import { TripDayMap } from "../components/trip-day-map";
import { DetailIconButton } from "../components/trip-details-header";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { useTripIntegrationCopy } from "../i18n/trip-integration-copy";
import { planningTime } from "../utils/planning-time";
import { getPlaceMapRegion } from "../utils/place-search";

type PlanningPlaceDetailsScreenProps = {
  planningPlaceId: string;
  tripId: string;
  day: string;
  visitStart: string;
  departure: string;
  durationMinutes: number;
};

export function PlanningPlaceDetailsScreen(props: PlanningPlaceDetailsScreenProps) {
  const theme = useAppTheme();
  const { height: viewportHeight } = useWindowDimensions();
  const insets = useScreenInsets();
  const { copy: placeCopy, locale } = usePlaceSearchCopy();
  const { copy } = useTripDetailsCopy();
  const { copy: errors } = useTripIntegrationCopy();
  const [expandRequest, setExpandRequest] = useState(0);
  const detail = usePlaceDetail(props.planningPlaceId, locale);
  const place = useMemo(() => detail.data ? {
    ...discoveryStop(detail.data),
    time: planningTime(props.visitStart, props.day),
    durationMinutes: props.durationMinutes,
  } : undefined, [detail.data, props.day, props.durationMinutes, props.visitStart]);
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/trip/planning", params: { tripId: props.tripId } });
  };

  if (!place && detail.isPending) {
    return (
      <ScreenSafeArea edges={["left", "right"]} style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.fill, { width: "100%", maxWidth: theme.layout.contentMaxWidth, alignSelf: "center" }]}>
          <View style={{ height: Math.max(250, viewportHeight * 0.34), backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: theme.spacing.lg }}>
            <View style={{ paddingTop: insets.top + theme.spacing.md + theme.spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <DetailIconButton name="back" label={copy.back} onPress={back} />
              <View style={{ width: theme.layout.compactTouchTarget, height: theme.layout.compactTouchTarget, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.full, backgroundColor: theme.colors.surface }}>
                <AppIcon name="share" size={theme.layout.iconMedium} color={theme.colors.textDisabled} />
              </View>
            </View>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: theme.spacing.xl }}>
              <View style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.full, backgroundColor: theme.colors.surface }}>
                <AppIcon name="pin" size={theme.layout.iconMedium} color={theme.colors.primaryText} />
              </View>
            </View>
          </View>
          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }} accessibilityLiveRegion="polite">
            <View style={{ gap: theme.spacing.sm }}>
              <LoadingLine width="62%" height={theme.typography.lineHeight.md} />
              <LoadingLine width="86%" height={theme.typography.lineHeight.sm} />
              <LoadingLine width="38%" height={theme.typography.lineHeight.xs} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
              <AppIcon name="calendar" size={theme.layout.iconSmall} color={theme.colors.primaryText} />
              <LoadingLine width="48%" height={theme.typography.lineHeight.xs} />
            </View>
            <View style={{ gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface }}>
              <LoadingLine width="42%" height={theme.typography.lineHeight.xs} />
              <LoadingLine width="76%" height={theme.typography.lineHeight.sm} />
              <LoadingLine width="68%" height={theme.typography.lineHeight.sm} />
              <LoadingLine width="58%" height={theme.typography.lineHeight.sm} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm }}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="body" tone="muted">{errors.loading}</AppText>
            </View>
          </View>
        </View>
      </ScreenSafeArea>
    );
  }

  if (!place) {
    return (
      <ScreenSafeArea style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <AppButton variant="outline" size="small" onPress={back}>{copy.back}</AppButton>
          <AppText accessibilityRole={detail.isError ? "alert" : undefined}>
            {detail.isError ? placeCopy.requestFailed : errors.loading}
          </AppText>
          {detail.isError ? <AppButton size="small" variant="outline" onPress={() => void detail.refetch()}>{errors.retry}</AppButton> : null}
        </View>
      </ScreenSafeArea>
    );
  }
  const details = detail.data!;

  return (
    <ScreenSafeArea edges={["left", "right"]} style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fill, { width: "100%", maxWidth: theme.layout.contentMaxWidth, alignSelf: "center" }]}>
        <PlaceDetailsContent
          place={place}
          places={[place]}
          region={getPlaceMapRegion([place])}
          showSavedName
          onBack={back}
          backLabel={copy.back}
          topInset={insets.top + theme.spacing.md + theme.spacing.lg}
          expandMapRequest={expandRequest}
          mapAction={<SharePlaceButton place={place} />}
          mapContent={<TripDayMap stops={[place]} focusedId={place.id} onSelect={() => setExpandRequest(value => value + 1)} />}
          suppliedDetails={{
            photo: null,
            hours: details.openingHours?.displayLines.join(" · "),
            admission: details.admission ? { vi: details.admission.text, en: details.admission.text } : undefined,
          }}
          classification={<PlaceClassification place={place} category={details.category?.label ?? undefined} openingStatus={details.openingStatus} />}
          status={(
            <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceTint }}>
              <AppIcon name="calendar" size={theme.layout.iconSmall} color={theme.colors.primaryText} />
              <AppText variant="caption" tone="primary">
                {`${new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${props.day}T12:00:00Z`))} · ${planningTime(props.visitStart, props.day)}–${planningTime(props.departure, props.day)}`}
              </AppText>
            </View>
          )}
        >
          {detail.isError ? (
            <View style={{ gap: theme.spacing.sm }}>
              <AppText accessibilityRole="alert" variant="caption">{placeCopy.requestFailed}</AppText>
              <AppButton size="small" variant="outline" onPress={() => void detail.refetch()}>{errors.retry}</AppButton>
            </View>
          ) : null}
        </PlaceDetailsContent>
      </View>
    </ScreenSafeArea>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, minHeight: 0 } });

function LoadingLine({ width, height }: { width: `${number}%`; height: number }) {
  const theme = useAppTheme();
  return <View style={{ width, height, borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceTint }} />;
}
