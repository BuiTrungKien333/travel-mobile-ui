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
} from "../components/home-primitives";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { isPastTrip, selectHome } from "../utils/select-home";

export function MemoriesScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy } = useHomeCopy();
  const { trips, memories, today, openPanel } = useTripPreview((state) => ({
    trips: state.trips,
    memories: state.memories,
    today: state.today,
    openPanel: state.openPanel,
  }));
  const pastTrip = trips.find((trip) => isPastTrip(trip, today));
  const selection = selectHome(trips, today);
  const activeTrip = selection.kind === "ongoing" ? selection.trip : null;
  const items = pastTrip
    ? [
        ...memories,
        {
          id: "sample-memory",
          destination: pastTrip.destination,
          text: copy.memoryText,
        },
      ]
    : memories;
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={items}
        keyExtractor={(memory) => memory.id}
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
              {copy.memories}
            </AppText>
            {activeTrip ? (
              <AppButton
                variant="outline"
                leadingIcon={<AppIcon name="camera" />}
                onPress={() =>
                  openPanel({
                    kind: "moment",
                    destination: activeTrip.destination,
                  })
                }
              >
                {copy.capture}
              </AppButton>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <SurfaceCard tinted>
            <AppIcon name="memories" size={theme.layout.iconLarge} />
            <AppText variant="label">{copy.noMemories}</AppText>
            <AppText tone="muted">{copy.noMemoriesHint}</AppText>
          </SurfaceCard>
        }
        renderItem={({ item }) => (
          <SurfaceCard>
            <Badge label={item.destination} icon="pin" />
            <AppIcon
              name="memories"
              color={theme.colors.primaryText}
              size={theme.layout.iconLarge}
            />
            <AppText>{item.text}</AppText>
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
