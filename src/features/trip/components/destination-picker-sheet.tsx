import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePickerSheetMotion } from "../hooks/use-picker-sheet-motion";
import { useTripCopy } from "../i18n/trip-copy";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, typography, layout, radius } from "@/theme/tokens";

const webInputReset: TextStyle = Platform.select({
  web: { outlineWidth: 0 },
  default: {},
});

type DestinationPickerSheetProps = {
  visible: boolean;
  currentDestination: string;
  onSelect: (dest: string) => void;
  onClose: () => void;
};

const popularDestinations = [
  { name: "Đà Lạt, Lâm Đồng", city: "Đà Lạt" },
  { name: "Đà Nẵng", city: "Đà Nẵng" },
  { name: "Hội An, Quảng Nam", city: "Hội An" },
  { name: "Nha Trang, Khánh Hòa", city: "Nha Trang" },
  { name: "Sapa, Lào Cai", city: "Sapa" },
  { name: "Phú Quốc, Kiên Giang", city: "Phú Quốc" },
  { name: "Hà Nội", city: "Hà Nội" },
  { name: "Quy Nhơn, Bình Định", city: "Quy Nhơn" },
];

export function DestinationPickerSheet(props: DestinationPickerSheetProps) {
  return props.visible ? <DestinationPickerSession {...props} /> : null;
}

function DestinationPickerSession({
  visible,
  currentDestination,
  onSelect,
  onClose,
}: DestinationPickerSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [customInput, setCustomInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const { sheetMotion, backdropMotion, dragGesture, close, reduceMotion } =
    usePickerSheetMotion(onClose);
  const { copy } = useTripCopy();
  const handleSelect = (dest: string) => {
    close(() => onSelect(dest));
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      close(() => onSelect(customInput.trim()));
    }
  };

  const filteredDestinations = useMemo(() => {
    const q = customInput.trim();
    if (!q) return popularDestinations;
    const lower = q.toLowerCase();
    const matched = popularDestinations.filter(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        d.city.toLowerCase().includes(lower),
    );
    const hasExactMatch = popularDestinations.some(
      (d) => d.name.toLowerCase() === lower || d.city.toLowerCase() === lower,
    );
    if (!hasExactMatch) {
      return [{ name: q, city: q }, ...matched];
    }
    return matched;
  }, [customInput]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType={reduceMotion ? "none" : "fade"}
      statusBarTranslucent
      onRequestClose={() => close()}
    >
      <GestureHandlerRootView style={styles.root}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.backdrop}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.overlay },
              backdropMotion,
            ]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
          <Animated.View
            style={[
              styles.sheet,
              sheetMotion,
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: theme.radius.xxl,
                borderTopRightRadius: theme.radius.xxl,
                paddingBottom:
                  Math.max(insets.bottom, theme.spacing.lg) + theme.spacing.md,
              },
            ]}
          >
            {/* Drag Handle & Header */}
            <GestureDetector gesture={dragGesture}>
              <View collapsable={false} style={styles.dragHeaderZone}>
                <View style={styles.handleWrapper}>
                  <View
                    style={[
                      styles.handle,
                      { backgroundColor: theme.colors.borderStrong },
                    ]}
                  />
                </View>

                {/* Header */}
                <View style={styles.headerRow}>
                  <AppText
                    variant="heading"
                    style={[
                      styles.headerTitle,
                      {
                        color: theme.colors.text,
                        fontFamily: theme.typography.fontFamily.medium,
                      },
                    ]}
                  >
                    {copy.chooseDestination}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.close}
                    onPress={() => close()}
                    hitSlop={12}
                    style={({ pressed }) => [
                      styles.closeButton,
                      { opacity: pressed ? theme.motion.pressOpacity : 1 },
                    ]}
                  >
                    <AppIcon
                      name="close"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            </GestureDetector>

            {/* Search Input Box */}
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.radius.md,
                  borderColor: isInputFocused
                    ? theme.colors.focus
                    : theme.colors.border,
                },
              ]}
            >
              <AppIcon
                name="pin"
                size={16}
                color={theme.colors.textSecondary}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                  webInputReset,
                ]}
                accessibilityLabel={copy.destination}
                placeholder={copy.destinationSearch}
                placeholderTextColor={theme.colors.textDisabled}
                value={customInput}
                onChangeText={setCustomInput}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                cursorColor={theme.colors.primaryText}
                selectionColor={theme.colors.surfaceTint}
                underlineColorAndroid="transparent"
                onSubmitEditing={handleCustomSubmit}
                returnKeyType="done"
              />
              {customInput.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.clearSearch}
                  onPress={() => setCustomInput("")}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.clearButton,
                    { opacity: pressed ? theme.motion.pressOpacity : 1 },
                  ]}
                >
                  <AppIcon
                    name="close"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>

            {/* Suggestions label */}
            <AppText variant="caption" tone="muted" style={styles.sectionLabel}>
              {customInput.trim()
                ? copy.searchResults
                : copy.popularDestinations}
            </AppText>

            {/* Destinations List */}
            <FlatList
              data={filteredDestinations}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected =
                  currentDestination
                    .toLowerCase()
                    .includes(item.city.toLowerCase()) ||
                  currentDestination.toLowerCase() === item.name.toLowerCase();
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: currentDestination === item.name,
                    }}
                    onPress={() => handleSelect(item.name)}
                    style={({ pressed }) => [
                      styles.item,
                      {
                        borderColor: theme.colors.border,
                        opacity: pressed ? theme.motion.pressOpacity : 1,
                      },
                    ]}
                  >
                    <View style={styles.itemLeft}>
                      <AppIcon
                        name="pin"
                        size={16}
                        color={
                          isSelected
                            ? theme.colors.primaryText
                            : theme.colors.textSecondary
                        }
                      />
                      <AppText
                        style={[
                          styles.itemText,
                          {
                            color: isSelected
                              ? theme.colors.primaryText
                              : theme.colors.text,
                            fontFamily: isSelected
                              ? theme.typography.fontFamily.semibold
                              : theme.typography.fontFamily.regular,
                          },
                        ]}
                      >
                        {item.name}
                      </AppText>
                    </View>
                    {isSelected ? (
                      <AppIcon
                        name="check"
                        size={16}
                        color={theme.colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    maxHeight: "85%",
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingTop: spacing.sm,
  },
  dragHeaderZone: {
    width: "100%",
  },
  handleWrapper: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  handle: {
    width: layout.sheetDragHandleWidth,
    height: layout.sheetDragHandleHeight,
    borderRadius: radius.full,
    opacity: 0.35,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.md,
  },
  closeButton: {
    minWidth: layout.compactTouchTarget,
    minHeight: layout.compactTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: layout.compactTouchTarget,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    height: "100%",
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: layout.pickerListMaxHeight,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + spacing.xxs,
    flex: 1,
  },
  itemText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.compactAction,
  },
});
