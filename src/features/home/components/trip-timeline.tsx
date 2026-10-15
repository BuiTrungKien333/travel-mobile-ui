import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";
import type { TripStop } from "../types/home-types";
import { homeStyles } from "./home-primitives";

export function TripTimeline({ stops }: { stops: readonly TripStop[] }) {
  const theme = useAppTheme();
  const { copy, locale } = useHomeCopy();
  if (!stops.length)
    return <AppText tone="muted">{copy.emptyTimeline}</AppText>;
  return (
    <View>
      {stops.map((stop, index) => (
        <View
          key={stop.id}
          style={[
            homeStyles.row,
            styles.stop,
            {
              gap: theme.spacing.md,
              paddingBottom:
                index < stops.length - 1
                  ? theme.spacing.xl
                  : theme.spacing.none,
            },
          ]}
        >
          <View style={styles.track}>
            <View
              style={[
                styles.dot,
                {
                  marginTop: theme.spacing.xs,
                  width: theme.spacing.sm,
                  height: theme.spacing.sm,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.primaryText,
                },
              ]}
            />
            {index < stops.length - 1 ? (
              <View
                style={[
                  styles.line,
                  {
                    top: theme.spacing.sm,
                    backgroundColor: theme.colors.border,
                  },
                ]}
              />
            ) : null}
          </View>
          <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
            <View
              style={[
                homeStyles.row,
                { gap: theme.spacing.sm, flexWrap: "wrap" },
              ]}
            >
              <AppText variant="caption" tone="primary">
                {stop.time}
              </AppText>
              <AppText variant="label">{stop.name[locale]}</AppText>
            </View>
            <AppText variant="caption" tone="muted">
              {stop.kind[locale]}
            </AppText>
          </View>
          <AppIcon
            name="pin"
            color={theme.colors.textSecondary}
            size={theme.layout.iconSmall}
          />
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  stop: { alignItems: "stretch" },
  track: { alignItems: "center", position: "relative" },
  dot: {},
  line: { position: "absolute", bottom: 0, width: StyleSheet.hairlineWidth },
});
