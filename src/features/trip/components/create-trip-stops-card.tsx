import { Keyboard, Pressable, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

import { useTripCopy } from "../i18n/trip-copy";
import { tripMessage } from "../utils/create-trip-formatters";
import type { Dispatch, SetStateAction } from "react";
import type { TripStop } from "@/features/home/types/home-types";
import { createTripStyles as styles } from "./create-trip-styles";

type Props = {
  selectedStops: TripStop[];
  destination: string;
  setShowDestSheet: Dispatch<SetStateAction<boolean>>;
  setShowPlaceSheet: Dispatch<SetStateAction<boolean>>;
  handleRemoveStop: (id: string) => void;
};

export function CreateTripStopsCard({
  selectedStops,
  destination,
  setShowDestSheet,
  setShowPlaceSheet,
  handleRemoveStop,
}: Props) {
  const theme = useAppTheme();
  const { copy, locale } = useTripCopy();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <View style={styles.sectionHeaderRow}>
        <AppText
          style={[
            styles.sectionHeading,
            {
              fontFamily: theme.typography.fontFamily.semibold,
              color: theme.colors.text,
            },
          ]}
        >
          {copy.plannedPlaces}
        </AppText>

        {selectedStops.length > 0 ? (
          <AppText
            variant="caption"
            style={{
              color: theme.colors.primaryText,
              fontFamily: theme.typography.fontFamily.medium,
            }}
          >
            {tripMessage(copy.selectedPlaces, {
              count: selectedStops.length,
            })}
          </AppText>
        ) : null}
      </View>

      {selectedStops.length === 0 ? (
        /* State 01: Empty state button */
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.addPlace}
          onPress={() => {
            if (!destination.trim()) {
              setShowDestSheet(true);
            } else {
              Keyboard.dismiss();
              setShowPlaceSheet(true);
            }
          }}
          style={({ pressed }) => [
            styles.addPlaceDashedCard,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.md,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            },
          ]}
        >
          <View
            style={[
              styles.addPlaceIconCircle,
              { backgroundColor: theme.colors.surfaceTint },
            ]}
          >
            <AppIcon name="plus" size={16} color={theme.colors.primaryText} />
          </View>
          <View style={styles.addPlaceTextCol}>
            <AppText
              style={[
                styles.addPlaceTitle,
                {
                  fontFamily: theme.typography.fontFamily.medium,
                  color: theme.colors.text,
                },
              ]}
            >
              {copy.addPlace}
            </AppText>
          </View>
          <AppIcon
            name="chevron"
            size={16}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      ) : (
        /* State 04: Populated stops list */
        <View style={styles.stopsList}>
          {selectedStops.map((stop, index) => {
            const stopName = stop.name[locale];

            return (
              <View
                key={stop.id}
                style={[
                  styles.stopItemRow,
                  {
                    backgroundColor: theme.colors.surfaceTint,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stopIndexBadge,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <AppText
                    style={[
                      styles.stopIndexText,
                      {
                        color: theme.colors.primaryText,
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {index + 1}
                  </AppText>
                </View>

                <View style={styles.stopInfoCol}>
                  <AppText
                    style={[
                      styles.stopNameText,
                      {
                        fontFamily: theme.typography.fontFamily.medium,
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    {stopName}
                  </AppText>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tripMessage(copy.removePlace, {
                    place: stopName,
                  })}
                  onPress={() => handleRemoveStop(stop.id)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.removeStopBtn,
                    {
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    },
                  ]}
                >
                  <AppIcon
                    name="close"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
            );
          })}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.addMorePlaces}
            onPress={() => {
              Keyboard.dismiss();
              setShowPlaceSheet(true);
            }}
            style={({ pressed }) => [
              styles.addMoreStopsBtn,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppIcon name="plus" size={14} color={theme.colors.primaryText} />
            <AppText
              style={[
                styles.addMoreStopsText,
                {
                  color: theme.colors.primaryText,
                  fontFamily: theme.typography.fontFamily.medium,
                },
              ]}
            >
              {copy.addMorePlaces}
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
