import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getStopImage } from "../data/trip-details-preview";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripBacklogRow({
  stop,
  canEdit,
  onPress,
  selected,
  onLongPress,
}: {
  stop: TripStop;
  canEdit: boolean;
  onPress: () => void;
  selected?: boolean;
  onLongPress?: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();

  return (
    <Pressable
      accessibilityRole={selected === undefined ? "button" : "checkbox"}
      accessibilityState={
        selected === undefined ? undefined : { checked: selected }
      }
      accessibilityLabel={
        selected === undefined
          ? `${stop.name[locale]}, ${canEdit ? copy.schedule : copy.stopDetails}`
          : stop.name[locale]
      }
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        borderRadius: theme.radius.md,
        backgroundColor: selected
          ? theme.colors.surfaceTint
          : theme.colors.surface,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        opacity: pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      <Image
        source={getStopImage(stop.placeId ?? stop.id)}
        contentFit="cover"
        cachePolicy="memory-disk"
        accessible={false}
        style={{
          width: theme.layout.sampleStopImageSize,
          height: theme.layout.sampleStopImageSize,
          borderRadius: theme.radius.sm,
        }}
      />
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
        <AppText variant="label">{stop.name[locale]}</AppText>
        <AppText variant="caption" tone="primary">
          {canEdit ? copy.schedule : copy.noTime}
        </AppText>
      </View>
      {selected === undefined ? (
        <AppIcon name="chevron" size={theme.layout.iconSmall} />
      ) : (
        <View
          style={{
            width: theme.layout.iconMedium,
            height: theme.layout.iconMedium,
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor: selected
              ? theme.colors.primary
              : theme.colors.borderStrong,
            backgroundColor: selected
              ? theme.colors.primary
              : theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected ? (
            <AppIcon
              name="tick"
              size={theme.layout.iconSmall}
              color={theme.colors.onPrimary}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
