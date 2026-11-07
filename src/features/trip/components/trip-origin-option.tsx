import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripOriginOption({
  place,
  selected,
  last,
  onChoose,
}: {
  place: TripStop;
  selected: boolean;
  last: boolean;
  onChoose: (place: TripStop) => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.originChoose} ${place.name[locale]}`}
      accessibilityState={{ selected }}
      onPress={() => onChoose(place)}
      style={({ pressed }) => ({
        minHeight: theme.layout.touchTarget,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        backgroundColor: selected
          ? theme.colors.surfaceTint
          : theme.colors.surface,
        opacity: pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      <AppIcon
        name="pin"
        size={theme.layout.iconSmall}
        color={theme.colors.primaryText}
      />
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xxs }}>
        <AppText variant={selected ? "label" : "body"}>
          {place.name[locale]}
        </AppText>
        {place.address?.[locale] ? (
          <AppText variant="caption" tone="muted">
            {place.address[locale]}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <AppIcon
          name="tick"
          size={theme.layout.iconSmall}
          color={theme.colors.primaryText}
        />
      ) : null}
    </Pressable>
  );
}
