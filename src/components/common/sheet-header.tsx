import { Pressable, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { useSheetMotion } from "@/hooks/use-sheet-motion";

export function SheetHeader({ title, closeLabel, onClose, gesture }: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  gesture: ReturnType<typeof useSheetMotion>["dragGesture"];
}) {
  const theme = useAppTheme();
  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false}>
        <View aria-hidden style={{ alignSelf: "center", width: theme.layout.sheetDragHandleWidth, height: theme.layout.sheetDragHandleHeight, borderRadius: theme.radius.full, backgroundColor: theme.colors.borderStrong, marginVertical: theme.spacing.sm }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <AppText accessibilityRole="header" variant="sectionTitle" style={{ flex: 1 }}>{title}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={({ pressed }) => ({ width: theme.layout.compactTouchTarget, minHeight: theme.layout.compactTouchTarget, alignItems: "center", justifyContent: "center", opacity: pressed ? theme.motion.pressOpacity : 1 })}>
            <AppIcon name="close" size={theme.layout.iconSmall} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    </GestureDetector>
  );
}
