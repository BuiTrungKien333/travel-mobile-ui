import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useItineraryCopy } from "../i18n/itinerary-copy";

export function BacklogSelectionToolbar({
  selecting,
  count,
  total,
  onToggleMode,
  onToggleAll,
}: {
  selecting: boolean;
  count: number;
  total: number;
  onToggleMode: () => void;
  onToggleAll: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useItineraryCopy();
  const actionStyle = ({ pressed }: { pressed: boolean }) => ({
    minHeight: theme.layout.compactTouchTarget,
    justifyContent: "center" as const,
    opacity: pressed ? theme.motion.pressOpacity : 1,
  });
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        {selecting ? (
          <AppText
            variant="caption"
            tone="primary"
            accessibilityLiveRegion="polite"
          >
            {copy.selectedCount.replace("{count}", String(count))}
          </AppText>
        ) : null}
      </View>
      {selecting ? (
        <Pressable
          accessibilityRole="button"
          onPress={onToggleAll}
          style={actionStyle}
        >
          <AppText variant="link" tone="primary">
            {count === total ? copy.clearSelection : copy.selectAll}
          </AppText>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onToggleMode}
        style={actionStyle}
      >
        <AppText variant="link" tone="primary">
          {selecting ? copy.cancelSelection : copy.selectMultiple}
        </AppText>
      </Pressable>
    </View>
  );
}
