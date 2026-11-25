import { Pressable, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

import { useTripCopy } from "../i18n/trip-copy";
import { destinationRegion } from "../utils/create-trip-formatters";
import type { Dispatch, SetStateAction } from "react";
import { createTripStyles as styles } from "./create-trip-styles";

type Props = {
  destination: string;
  setShowDestSheet: Dispatch<SetStateAction<boolean>>;
};

export function CreateTripDestinationCard({
  destination,
  setShowDestSheet,
}: Props) {
  const theme = useAppTheme();
  const { copy } = useTripCopy();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.destination}: ${destination || copy.chooseDestination}`}
      onPress={() => setShowDestSheet(true)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.surfaceTint },
          ]}
        >
          <AppIcon name="pin" size={20} color={theme.colors.primaryText} />
        </View>

        <View style={styles.cardInfoCol}>
          <AppText variant="label" tone="muted">
            {copy.destination}
          </AppText>
          <AppText
            style={[
              styles.destinationTitle,
              {
                fontFamily: theme.typography.fontFamily.semibold,
                color: destination
                  ? theme.colors.text
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {destination || copy.chooseDestination}
          </AppText>
          {destination.trim() ? (
            <AppText variant="caption" tone="muted">
              {destinationRegion(destination, copy)}
            </AppText>
          ) : null}
        </View>

        <AppIcon name="chevron" size={18} color={theme.colors.textSecondary} />
      </View>
    </Pressable>
  );
}
