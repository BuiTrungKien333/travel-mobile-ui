import { useState } from "react";
import { Share, View } from "react-native";
import { DetailIconButton } from "./trip-details-header";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function SharePlaceButton({ place }: { place: TripStop }) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(false);
  async function share() {
    if (sharing) return;
    setSharing(true);
    setError(false);
    const query = place.location
      ? `${place.location.latitude},${place.location.longitude}`
      : (place.address?.[locale] ?? place.name[locale]);
    try {
      await Share.share({
        title: place.name[locale],
        message: [
          place.name[locale],
          place.address?.[locale],
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch {
      setError(true);
    } finally {
      setSharing(false);
    }
  }
  return (
    <View
      style={{
        width: theme.layout.compactTouchTarget,
      }}
    >
      <DetailIconButton
        name="share"
        label={copy.sharePlace}
        accessibilityState={{ busy: sharing, disabled: sharing }}
        onPress={() => {
          void share();
        }}
      />
      {error ? (
        <AppText
          accessibilityRole="alert"
          variant="caption"
          tone="error"
          style={{
            position: "absolute",
            right: theme.layout.compactTouchTarget + theme.spacing.sm,
            top: 0,
            width: theme.layout.journalThumbnailSize,
            backgroundColor: theme.colors.surface,
            padding: theme.spacing.sm,
            borderRadius: theme.radius.sm,
          }}
        >
          {copy.shareError}
        </AppText>
      ) : null}
    </View>
  );
}
