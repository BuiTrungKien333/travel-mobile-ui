import { Pressable, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripBacklogRow({
  stop,
  canEdit,
  onPress,
  onMoveUp,
  onMoveDown,
}: {
  stop: TripStop;
  canEdit: boolean;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        opacity: 1,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${stop.name[locale]}, ${canEdit ? copy.schedule : copy.stopDetails}`}
        onPress={onPress}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}
      >
        <View style={{ width: theme.layout.sampleStopImageSize, height: theme.layout.sampleStopImageSize, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceTint, alignItems: "center", justifyContent: "center" }}>
          <AppIcon name="pin" size={theme.layout.iconSmall} color={theme.colors.primaryText} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
          <AppText variant="label">{stop.name[locale]}</AppText>
          <AppText variant="caption" tone="primary">
            {stop.visited ? copy.visited : canEdit ? copy.schedule : copy.noTime}
          </AppText>
        </View>
        <AppIcon name="chevron" size={theme.layout.iconSmall} />
      </Pressable>
      {canEdit && (onMoveUp || onMoveDown) ? (
        <View style={{ gap: theme.spacing.xxs }}>
          {onMoveUp ? <Pressable accessibilityRole="button" accessibilityLabel="Move place up" onPress={onMoveUp} hitSlop={8}><AppText tone="primary">↑</AppText></Pressable> : null}
          {onMoveDown ? <Pressable accessibilityRole="button" accessibilityLabel="Move place down" onPress={onMoveDown} hitSlop={8}><AppText tone="primary">↓</AppText></Pressable> : null}
        </View>
      ) : null}
    </View>
  );
}
