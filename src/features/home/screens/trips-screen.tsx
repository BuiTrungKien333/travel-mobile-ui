import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  Badge,
  PreviewNotice,
  SurfaceCard,
  TextAction,
} from "../components/home-primitives";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { formatTripDates } from "../utils/select-home";

/** Small supporting destination for Home links; trip editing stays in the preview panel. */
export function TripsScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy, locale } = useHomeCopy();
  const { trips, openPanel } = useTripPreview((state) => ({
    trips: state.trips,
    openPanel: state.openPanel,
  }));
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: theme.layout.contentMaxWidth,
            padding: theme.spacing.lg,
            paddingBottom: tabBarHeight + theme.spacing.lg,
            gap: theme.spacing.lg,
          },
        ]}
        ListHeaderComponent={
          <View
            style={{ gap: theme.spacing.lg, marginBottom: theme.spacing.sm }}
          >
            <AppText accessibilityRole="header" variant="heading">
              {copy.trips}
            </AppText>
            <AppButton
              leadingIcon={
                <AppIcon name="plus" color={theme.colors.onPrimary} />
              }
              onPress={() => openPanel({ kind: "create" })}
            >
              {copy.create}
            </AppButton>
          </View>
        }
        ListEmptyComponent={
          <SurfaceCard tinted>
            <AppIcon name="trips" size={theme.layout.iconLarge} />
            <AppText variant="label">{copy.noTrips}</AppText>
            <AppText tone="muted">{copy.noTripsHint}</AppText>
          </SurfaceCard>
        }
        renderItem={({ item }) => (
          <SurfaceCard>
            <Badge
              label={
                item.status === "completed"
                  ? copy.completed
                  : item.status === "draft"
                    ? copy.draft
                    : copy.planned
              }
            />
            <AppText
              variant="heading"
              style={{
                fontSize: theme.typography.fontSize.lg,
                lineHeight: theme.typography.lineHeight.lg,
              }}
            >
              {item.destination}
            </AppText>
            <AppText tone="muted">{formatTripDates(item, locale)}</AppText>
            <TextAction
              label={copy.plan}
              onPress={() => openPanel({ kind: "plan", tripId: item.id })}
            />
          </SurfaceCard>
        )}
        ListFooterComponent={<PreviewNotice />}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: "100%", alignSelf: "center", flexGrow: 1 },
});
