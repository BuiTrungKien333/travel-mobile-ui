import { useMemo } from "react";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { HomeHeader } from "@/features/home/components/home-header";
import { PreviewNotice } from "@/features/home/components/home-primitives";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { TripCard } from "../components/trip-card";
import { sampleTrips } from "../data/sample-trips";
import { useTripCopy } from "../i18n/trip-copy";

export function TripsScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy, locale } = useTripCopy();

  const { trips: storeTrips, today, openPanel } = useTripPreview((state) => ({
    trips: state.trips,
    today: state.today,
    openPanel: state.openPanel,
  }));

  const trips = useMemo(() => {
    const userDrafts = storeTrips.filter((t) => t.id.startsWith("draft-"));
    if (userDrafts.length > 0) {
      const existing = new Set(userDrafts.map((t) => t.id));
      const remaining = sampleTrips.filter((t) => !existing.has(t.id));
      return [...userDrafts, ...remaining].slice(0, 4);
    }
    return sampleTrips;
  }, [storeTrips]);

  const handleTripPress = (trip: Trip) => {
    openPanel({ kind: "plan", tripId: trip.id });
  };


  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={trips}
        keyExtractor={(trip) => trip.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: theme.layout.contentMaxWidth,
            padding: theme.spacing.lg,
            paddingBottom: tabBarHeight + theme.spacing.xl,
            gap: theme.spacing.md,
          },
        ]}
        ListHeaderComponent={
          <View style={[styles.headerContainer, { gap: theme.spacing.lg }]}>
            {/* Header: WeGo Logo + Notification Bell */}
            <HomeHeader />

            {/* Title: "Chuyến đi của bạn" */}
            <AppText
              accessibilityRole="header"
              variant="heading"
              style={[
                styles.screenHeading,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              {copy.trips}
            </AppText>

            {/* Large centered Create Trip button */}
            <View style={styles.createButtonWrapper}>
              <AppButton
                variant="raised"
                leadingIcon={
                  <AppIcon
                    name="plus"
                    size={18}
                    color={theme.colors.onRaisedAction}
                  />
                }
                onPress={() => openPanel({ kind: "create" })}
                style={styles.largeCreateButton}
              >
                {copy.createTrip}
              </AppButton>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.xl,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <AppIcon
                name="trips"
                size={28}
                color={theme.colors.primaryText}
              />
            </View>
            <AppText
              variant="heading"
              style={[
                styles.emptyTitle,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.md,
                  lineHeight: theme.typography.lineHeight.md,
                  fontFamily: theme.typography.fontFamily.semibold,
                },
              ]}
            >
              {copy.noTripsTitle}
            </AppText>
            <AppText
              variant="body"
              tone="muted"
              style={[
                styles.emptyHint,
                {
                  fontSize: theme.typography.fontSize.xs,
                  lineHeight: theme.typography.lineHeight.xs,
                },
              ]}
            >
              {copy.noTripsHint}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            today={today}
            locale={locale}
            onPress={handleTripPress}
          />
        )}
        ListFooterComponent={
          <View style={{ marginTop: theme.spacing.sm }}>
            <PreviewNotice />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: "100%",
    alignSelf: "center",
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 6,
  },
  screenHeading: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  createButtonWrapper: {
    width: "100%",
    alignItems: "center",
  },
  largeCreateButton: {
    width: "100%",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptyHint: {
    textAlign: "center",
    maxWidth: 280,
  },
});
