import { useState } from "react";
import { Linking } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useOngoingCopy } from "@/features/home/i18n/ongoing-copy";
import { directionsUrl } from "@/features/home/utils/map-links";
import { useAppTheme } from "@/hooks/use-app-theme";

export function TripDirectionsButton({
  stop,
  destination,
  primary = false,
}: {
  stop: TripStop;
  destination: string;
  primary?: boolean;
}) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(false);
  const { copy } = useOngoingCopy();
  const theme = useAppTheme();
  async function openDirections() {
    if (opening) return;
    setOpening(true);
    setError(false);
    try {
      await Linking.openURL(directionsUrl(stop.name.vi, destination));
    } catch {
      setError(true);
    } finally {
      setOpening(false);
    }
  }
  return (
    <>
      <AppButton
        variant={primary ? "raised" : "soft"}
        loading={opening}
        accessibilityHint={copy.directionsHint}
        leadingIcon={
          <AppIcon
            name="navigation"
            color={
              primary ? theme.colors.onRaisedAction : theme.colors.primaryText
            }
          />
        }
        onPress={openDirections}
      >
        {copy.directions}
      </AppButton>
      {error ? (
        <AppText accessibilityRole="alert" variant="caption" tone="error">
          {copy.directionsError}
        </AppText>
      ) : null}
    </>
  );
}
