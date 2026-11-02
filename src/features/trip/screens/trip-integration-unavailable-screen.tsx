import { router } from "expo-router";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { HomePage } from "@/features/home/components/home-primitives";
import { useTripIntegrationCopy } from "../i18n/trip-integration-copy";

/** No fixture memories or claims about active trips in the connected MVP slice. */
export function TripIntegrationUnavailableScreen() {
  const { copy } = useTripIntegrationCopy();
  return (
    <HomePage showHeader>
      <AppText variant="label">{copy.unavailable}</AppText>
      <AppText tone="muted">{copy.modulePending}</AppText>
      <AppButton
        size="small"
        variant="soft"
        onPress={() => router.navigate("/tabs/trips")}
      >
        {copy.trips}
      </AppButton>
    </HomePage>
  );
}
