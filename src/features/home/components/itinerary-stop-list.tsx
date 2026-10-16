import { Image, type ImageSource } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import type { TripStop } from "../types/home-types";
import { homeStyles } from "./home-primitives";

type ItineraryStop = TripStop & { image?: ImageSource | string | number };
type LiveTimeline = {
  visitedIds: ReadonlySet<string>;
  nextStopId?: string;
  onToggle: (id: string, visited: boolean) => void;
};

/** Shared photo timeline: numbered sample stops or interactive visit statuses. */
export function ItineraryStopList({
  stops,
  live,
}: {
  stops: readonly ItineraryStop[];
  live?: LiveTimeline;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  return (
    <View>
      {stops.map((stop, index) => {
        const visited = live?.visitedIds.has(stop.id) ?? false;
        const next = !visited && live?.nextStopId === stop.id;
        const status = visited
          ? copy.visited
          : next
            ? copy.nextShort
            : copy.upcoming;
        const statusColor = visited
          ? theme.colors.onSuccessSurface
          : next
            ? theme.colors.primaryText
            : theme.colors.textSecondary;
        const content = (
          <>
            <View style={{ width: theme.layout.sampleStopNumberSize }}>
              {index < stops.length - 1 ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.connector,
                    {
                      top: theme.layout.sampleStopNumberSize + theme.spacing.xs,
                      bottom: -theme.spacing.md,
                      backgroundColor: theme.colors.glassGlow,
                    },
                  ]}
                />
              ) : null}
              <View
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[
                  styles.marker,
                  {
                    minHeight: theme.layout.sampleStopNumberSize,
                    backgroundColor: visited
                      ? theme.colors.successSurface
                      : live && !next
                        ? theme.colors.glassInset
                        : theme.colors.softActionSurface,
                    borderRadius: theme.radius.sm,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.glassBorder,
                  },
                ]}
              >
                {!live ? (
                  <AppText
                    variant="caption"
                    tone="primary"
                    style={{ fontFamily: theme.typography.fontFamily.semibold }}
                  >
                    {index + 1}
                  </AppText>
                ) : visited ? (
                  <AppIcon
                    name="check"
                    size={theme.layout.iconSmall}
                    color={theme.colors.onSuccessSurface}
                  />
                ) : (
                  <View
                    style={{
                      width: theme.spacing.md,
                      height: theme.spacing.md,
                      borderRadius: theme.radius.full,
                      borderWidth: theme.spacing.xxs,
                      borderColor: next
                        ? theme.colors.primaryText
                        : theme.colors.textSecondary,
                      backgroundColor: next
                        ? theme.colors.primaryText
                        : undefined,
                    }}
                  />
                )}
              </View>
            </View>
            <View
              style={[
                homeStyles.row,
                homeStyles.grow,
                {
                  gap: theme.spacing.sm,
                  padding: theme.spacing.xs,
                  backgroundColor: theme.colors.glassInset,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: next
                    ? theme.colors.softActionBorder
                    : theme.colors.glassBorder,
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
                <View
                  style={[
                    homeStyles.row,
                    { gap: theme.spacing.xs, alignItems: "baseline" },
                  ]}
                >
                  <AppText
                    variant="caption"
                    tone="primary"
                    style={{ flexShrink: 0 }}
                  >
                    {stop.time}
                  </AppText>
                  {live ? (
                    <AppText
                      variant="caption"
                      style={{ color: statusColor, flexShrink: 1 }}
                    >
                      {status}
                    </AppText>
                  ) : null}
                </View>
                <AppText
                  variant="label"
                  style={{ fontFamily: theme.typography.fontFamily.semibold }}
                >
                  {stop.name[locale]}
                </AppText>
                {!live ? (
                  <AppText variant="caption" tone="muted">
                    {stop.kind[locale]}
                  </AppText>
                ) : null}
              </View>
              <View
                style={[
                  styles.photo,
                  {
                    width: theme.layout.sampleStopImageSize,
                    height: theme.layout.sampleStopImageSize,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.surfaceVariant,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.glassBorder,
                  },
                ]}
              >
                <AppIcon name="pin" color={theme.colors.textSecondary} />
                {stop.image ? (
                  <Image
                    accessible={false}
                    source={stop.image}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
              </View>
            </View>
          </>
        );
        const rowStyle = [
          styles.stop,
          { gap: theme.spacing.md, minHeight: theme.layout.touchTarget },
        ];
        return (
          <Animated.View
            key={stop.id}
            layout={LinearTransition.duration(
              theme.motion.enterDuration,
            ).reduceMotion(ReduceMotion.System)}
            style={{
              marginBottom: index < stops.length - 1 ? theme.spacing.lg : 0,
            }}
          >
            {live ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: visited }}
                accessibilityLabel={`${stop.time}, ${stop.name[locale]}. ${status}`}
                accessibilityHint={visited ? copy.undoVisit : copy.markVisited}
                onPress={() => live.onToggle(stop.id, !visited)}
                style={({ pressed }) => [
                  rowStyle,
                  { opacity: pressed ? theme.motion.pressOpacity : 1 },
                ]}
              >
                {content}
              </Pressable>
            ) : (
              <View style={rowStyle}>{content}</View>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stop: { flexDirection: "row", alignItems: "stretch" },
  marker: { alignItems: "center", justifyContent: "center" },
  connector: {
    position: "absolute",
    left: "50%",
    width: StyleSheet.hairlineWidth,
  },
  photo: {
    flexShrink: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
