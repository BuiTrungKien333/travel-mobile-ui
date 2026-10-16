import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { Image } from "expo-image";
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
import type { Memory } from "../types/home-types";

export function MemoriesScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy, locale } = useHomeCopy();
  const { trips, memories, today, openPanel } = useTripPreview((state) => ({
    trips: state.trips,
    memories: state.memories,
    today: state.today,
    openPanel: state.openPanel,
  }));
  const pastTrip = trips.find((trip) => isPastTrip(trip, today));
  const selection = selectHome(trips, today);
  const activeTrip = selection.kind === "ongoing" ? selection.trip : null;
  const items: Memory[] = pastTrip
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
                    kind: "camera",
                    tripId: activeTrip.id,
                    date: today,
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
            {item.photo ? (
              <Image
                source={item.photo}
                accessible
                accessibilityLabel={item.place?.[locale] ?? item.destination}
                contentFit="cover"
                cachePolicy="memory-disk"
                style={{
                  width: "100%",
                  aspectRatio: 4 / 3,
                  borderRadius: theme.radius.md,
                }}
              />
            ) : (
              <AppIcon
                name="memories"
                color={theme.colors.primaryText}
                size={theme.layout.iconLarge}
              />
            )}
            {item.place ? (
              <AppText variant="label">{item.place[locale]}</AppText>
            ) : null}
            {item.text ? <AppText>{item.text}</AppText> : null}
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
