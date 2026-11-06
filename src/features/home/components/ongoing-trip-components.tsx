import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { captureSamples } from "../data/ongoing-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import type { TripStop } from "../types/home-types";
import { homeStyles } from "./home-primitives";
import { JourneyCard } from "./journey-card";

export function NextStopCard({
  stop,
  onDirections,
  hasStops,
  onVisited,
  onJournal,
  onPlan,
  busy = false,
}: {
  stop?: TripStop;
  onDirections: () => void;
  hasStops: boolean;
  onVisited: () => void;
  onJournal: () => void;
  onPlan: () => void;
  busy?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const photo = captureSamples.find((sample) => sample.id === stop?.id)?.photo;
  if (!stop)
    return (
      <JourneyCard>
        <AppIcon
          name={hasStops ? "flag" : "route"}
          size={theme.layout.iconLarge}
        />
        <AppText accessibilityRole="header" variant="label">
          {hasStops ? copy.complete : copy.emptyDay}
        </AppText>
        <AppText tone="muted">
          {hasStops ? copy.completeHint : copy.emptyDayHint}
        </AppText>
        <AppButton
          variant="soft"
          size="small"
          onPress={hasStops ? onJournal : onPlan}
        >
          {hasStops ? copy.viewJournal : copy.addPlaces}
        </AppButton>
      </JourneyCard>
    );
  return (
    <JourneyCard>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          variant="caption"
          tone="primary"
          style={[
            homeStyles.grow,
            { fontFamily: theme.typography.fontFamily.semibold },
          ]}
        >
          {copy.next}
        </AppText>
      </View>
      <View
        style={[
          homeStyles.row,
          { gap: theme.spacing.md, alignItems: "flex-start" },
        ]}
      >
        <View style={[homeStyles.grow, { gap: theme.spacing.sm }]}>
          <AppText
            accessibilityRole="header"
            variant="heading"
            style={{
              fontSize: theme.typography.fontSize.lg,
              lineHeight: theme.typography.lineHeight.lg,
            }}
          >
            {stop.name[locale]}
          </AppText>
          <View style={[homeStyles.row, { gap: theme.spacing.xs }]}>
            <AppIcon name="clock" size={theme.layout.iconSmall} />
            <AppText variant="label" tone="primary">
              {stop.time}
            </AppText>
            <AppText variant="caption" tone="muted">
              {copy.plannedTime}
            </AppText>
          </View>
          <AppText variant="caption" tone="muted">
            {stop.kind[locale]}
          </AppText>
        </View>
        {photo ? (
          <Image
            accessible={false}
            source={photo}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={{
              width: theme.layout.journeyThumbnailSize,
              height: theme.layout.journeyThumbnailSize,
              borderRadius: theme.radius.md,
            }}
          />
        ) : null}
      </View>
      {stop.quickInfo ? (
        <View
          style={[homeStyles.row, { flexWrap: "wrap", gap: theme.spacing.sm }]}
        >
          {stop.quickInfo.admission ? (
            <View
              style={[
                homeStyles.row,
                {
                  gap: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: theme.colors.glassInset,
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <AppIcon name="ticket" size={theme.layout.iconSmall} />
              <AppText variant="caption" tone="primary">
                {copy.admission}: {stop.quickInfo.admission[locale]}
              </AppText>
            </View>
          ) : null}
          {stop.quickInfo.closesAt ? (
            <View
              style={[
                homeStyles.row,
                {
                  gap: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: theme.colors.glassInset,
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <AppIcon name="clock" size={theme.layout.iconSmall} />
              <AppText variant="caption" tone="primary">
                {copy.closesAt}: {stop.quickInfo.closesAt}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        style={[
          homeStyles.row,
          { gap: theme.spacing.sm, alignItems: "stretch" },
        ]}
      >
        <AppButton
          variant="raised"
          size="small"
          style={[
            styles.actionColumn,
            { flexGrow: 60, paddingHorizontal: theme.spacing.sm },
          ]}
          onPress={onDirections}
          disabled={busy}
          leadingIcon={
            <AppIcon
              name="navigation"
              size={theme.layout.iconSmall}
              color={theme.colors.onRaisedAction}
            />
          }
        >
          {copy.directions}
        </AppButton>
        <AppButton
          variant="outline"
          size="small"
          onPress={onVisited}
          loading={busy}
          style={[
            styles.actionColumn,
            {
              flexGrow: 40,
              paddingHorizontal: theme.spacing.sm,
              backgroundColor: theme.colors.glassInset,
              borderColor: theme.colors.softActionBorder,
            },
          ]}
          leadingIcon={<AppIcon name="check" size={theme.layout.iconSmall} />}
        >
          {copy.visited}
        </AppButton>
      </View>
    </JourneyCard>
  );
}

const styles = StyleSheet.create({
  actionColumn: { flex: 1, flexBasis: 0, minWidth: 0 },
});
