import { router } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { HomeHeader } from "@/features/home/components/home-header";
import { toTrip } from "../api/trip-adapters";
import { useTripsQuery } from "../api/trip-hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, typography } from "@/theme/tokens";
import { TripCard } from "../components/trip-card";
import { useTripCopy } from "../i18n/trip-copy";
import { CreateTripModal } from "../components/create-trip-modal";
import { useState } from "react";

export function TripsScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy, locale } = useTripCopy();
  const [createVisible, setCreateVisible] = useState(false);
  const tripsQuery = useTripsQuery();
  const trips = tripsQuery.data?.map((trip) => toTrip(trip)) ?? [];
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <ScreenSafeArea
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
                onPress={() => setCreateVisible(true)}
                style={styles.largeCreateButton}
              >
                {copy.createTrip}
              </AppButton>
            </View>
          </View>
        }
        ListEmptyComponent={
          tripsQuery.isPending ? (
            <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : tripsQuery.isError ? (
            <View style={{ gap: theme.spacing.md, padding: theme.spacing.lg }}>
              <AppText accessibilityRole="alert" tone="error">Không tải được danh sách chuyến đi.</AppText>
              <AppButton variant="outline" onPress={() => void tripsQuery.refetch()}>Thử lại</AppButton>
            </View>
          ) : trips.length === 0 ? (
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
          ) : null
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            today={today}
            locale={locale}
            onPress={(trip) => router.push({ pathname: "/trip/[tripId]", params: { tripId: trip.id } })}
          />
        )}
      />
      <CreateTripModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={(tripId) => {
          setCreateVisible(false);
          router.push({ pathname: "/trip/[tripId]", params: { tripId } });
        }}
      />
    </ScreenSafeArea>
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
    marginBottom: spacing.xs + spacing.xxs,
  },
  screenHeading: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.md,
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
    marginVertical: spacing.md,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptyHint: {
    textAlign: "center",
    maxWidth: 280,
  },
});
