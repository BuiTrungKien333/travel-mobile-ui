import { router } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { HomeHeader } from "@/features/home/components/home-header";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripsQuery } from "../api/trip-queries";
import { tripViewModel } from "../api/trip-contract";
import { TripCard } from "../components/trip-card";
import { CreateTripModal } from "../components/create-trip-modal";
import { useTripCopy } from "../i18n/trip-copy";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";

export function ConnectedTripsScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy, locale } = useTripCopy();
  const { copy: integrationCopy } = useTripIntegrationCopy();
  const query = useTripsQuery();
  const [creating, setCreating] = useState(false);
  const rows = query.data?.pages.flatMap((page) => page.content) ?? [];
  return (
    <ScreenSafeArea
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <FlatList
        data={rows}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={{
          maxWidth: theme.layout.contentMaxWidth,
          width: "100%",
          alignSelf: "center",
          padding: theme.spacing.lg,
          paddingBottom: tabBarHeight + theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => {
          void query.refetch();
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.lg }}>
            <HomeHeader />
            <AppText variant="heading" accessibilityRole="header">
              {copy.trips}
            </AppText>
            <AppButton variant="raised" onPress={() => setCreating(true)}>
              {copy.createTrip}
            </AppButton>
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <AppText accessibilityLiveRegion="polite">
              {integrationCopy.loading}
            </AppText>
          ) : !query.isError ? (
            <View style={{ gap: theme.spacing.sm }}>
              <AppText variant="label">{copy.noTripsTitle}</AppText>
              <AppText tone="muted">{copy.noTripsHint}</AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TripCard
            trip={tripViewModel(item)}
            today={query.data?.pages[0]?.context.evaluatedDate ?? ""}
            locale={locale}
            onPress={() =>
              router.push({
                pathname: "/trip/[tripId]",
                params: { tripId: item.id },
              })
            }
          />
        )}
        ListFooterComponent={
          <View style={{ gap: theme.spacing.sm }}>
            {query.isError ? (
              <>
                <AppText accessibilityRole="alert">
                  {tripApiErrorMessage(query.error, integrationCopy)}
                </AppText>
                <AppButton
                  size="small"
                  variant="outline"
                  onPress={() => {
                    void query.refetch();
                  }}
                >
                  {integrationCopy.retry}
                </AppButton>
              </>
            ) : null}
            {query.hasNextPage ? (
              <AppButton
                size="small"
                variant="soft"
                loading={query.isFetchingNextPage}
                onPress={() => {
                  void query.fetchNextPage();
                }}
              >
                {integrationCopy.more}
              </AppButton>
            ) : null}
          </View>
        }
      />
      <CreateTripModal visible={creating} onClose={() => setCreating(false)} />
    </ScreenSafeArea>
  );
}
