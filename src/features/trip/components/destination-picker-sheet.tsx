import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

const webInputReset: TextStyle = Platform.select({
  web: { outlineStyle: "none", outlineWidth: 0 } as unknown as TextStyle,
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

export function DestinationPickerSheet({
  visible,
  currentDestination,
  onSelect,
  onClose,
}: DestinationPickerSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [customInput, setCustomInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const isClosing = useSharedValue(false);
  const translateY = useSharedValue(0);
  const dismissDistance = theme.layout.sheetDismissDistance;
  const dismissVelocity = theme.motion.sheetDismissVelocity;
  const snapDuration = theme.motion.tabTransitionDuration;
  const minimumSwipe = theme.spacing.md;

  const sheetMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropMotion = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - translateY.value / 350)),
  }));

  useEffect(() => () => cancelAnimation(translateY), [translateY]);

  useEffect(() => {
    if (visible) {
      isClosing.value = false;
      translateY.value = 280;
      translateY.value = withTiming(0, {
        duration: snapDuration,
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [visible, snapDuration, translateY, isClosing]);

  const handleAnimatedClose = () => {
    if (isClosing.value) return;
    isClosing.value = true;
    translateY.value = withTiming(
      600,
      {
        duration: 180,
        reduceMotion: ReduceMotion.System,
      },
      (finished) => {
        if (finished) {
          scheduleOnRN(onClose);
        }
      },
    );
  };

  const dragGesture = Gesture.Pan()
    .activeOffsetY(theme.spacing.sm)
    .failOffsetX([-theme.spacing.lg, theme.spacing.lg])
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (
        event.translationY >= dismissDistance ||
        (event.translationY > minimumSwipe &&
          event.velocityY >= dismissVelocity)
      ) {
        isClosing.value = true;
        translateY.value = withTiming(
          600,
          {
            duration: 180,
            reduceMotion: ReduceMotion.System,
          },
          (finished) => {
            if (finished) {
              scheduleOnRN(onClose);
            }
          },
        );
      } else {
        translateY.value = withTiming(0, {
          duration: snapDuration,
          reduceMotion: ReduceMotion.System,
        });
      }
    })
    .onFinalize((_event, success) => {
      if (!success && !isClosing.value) {
        translateY.value = withTiming(0, {
          duration: snapDuration,
          reduceMotion: ReduceMotion.System,
        });
      }
    });

  const handleSelect = (dest: string) => {
    onSelect(dest);
    handleAnimatedClose();
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      onSelect(customInput.trim());
      handleAnimatedClose();
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
      (d) =>
        d.name.toLowerCase() === lower || d.city.toLowerCase() === lower,
    );
    if (!hasExactMatch) {
      return [{ name: q, city: q }, ...matched];
    }
    return matched;
  }, [customInput]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleAnimatedClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.overlay },
              backdropMotion,
            ]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={handleAnimatedClose} />
          <Animated.View
            style={[
              styles.sheet,
              sheetMotion,
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: theme.radius.xxl,
                borderTopRightRadius: theme.radius.xxl,
                paddingBottom: Math.max(insets.bottom, 16) + theme.spacing.md,
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
                    Chọn điểm đến chính
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Đóng"
                    onPress={handleAnimatedClose}
                    hitSlop={12}
                    style={({ pressed }) => [
                      styles.closeButton,
                      { opacity: pressed ? theme.motion.pressOpacity : 1 },
                    ]}
                  >
                    <AppIcon name="close" size={20} color={theme.colors.textSecondary} />
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
              <AppIcon name="pin" size={16} color={theme.colors.textSecondary} />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                  webInputReset,
                ]}
                placeholder="Tìm kiếm hoặc nhập điểm đến..."
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
                  accessibilityLabel="Xóa nội dung tìm kiếm"
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
              {customInput.trim() ? "Kết quả tìm kiếm" : "Điểm đến phổ biến"}
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
                  currentDestination.toLowerCase().includes(item.city.toLowerCase()) ||
                  currentDestination.toLowerCase() === item.name.toLowerCase();
                return (
                  <Pressable
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
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dragHeaderZone: {
    width: "100%",
  },
  handleWrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    opacity: 0.35,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  closeButton: {
    padding: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: "100%",
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  list: {
    maxHeight: 280,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 18,
  },
});
