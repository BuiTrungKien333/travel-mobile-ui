import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useTripsQuery } from "@/features/trip/api/trip-queries";
import { ConnectedTripsScreen } from "@/features/trip/screens/connected-trips-screen";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "@/features/trip/i18n/trip-integration-copy";
import { HomePage } from "../components/home-primitives";
import { NewUserHomeScreen } from "./new-user-home-screen";

export function ConnectedHomeScreen() {
  const query = useTripsQuery();
  const { copy } = useTripIntegrationCopy();
  const firstPage = query.data?.pages[0];

  // Keep the existing server-backed trip list until the other Home dashboards are integrated.
  if (firstPage && firstPage.totalElements > 0) return <ConnectedTripsScreen />;
  if (query.isSuccess && firstPage?.totalElements === 0)
    return <NewUserHomeScreen />;

  return (
    <HomePage showHeader>
      <AppText
        accessibilityRole={query.isError ? "alert" : undefined}
        accessibilityLiveRegion="polite"
      >
        {query.isError ? tripApiErrorMessage(query.error, copy) : copy.loading}
      </AppText>
      {query.isError ? (
        <AppButton
          size="small"
          variant="outline"
          onPress={() => void query.refetch()}
        >
          {copy.retry}
        </AppButton>
      ) : null}
    </HomePage>
  );
}
