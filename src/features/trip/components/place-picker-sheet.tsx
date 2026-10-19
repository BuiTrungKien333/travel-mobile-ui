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

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";

const webInputReset: TextStyle = Platform.select({
  web: { outlineStyle: "none", outlineWidth: 0 } as unknown as TextStyle,
  default: {},
});

type PlacePickerSheetProps = {
  visible: boolean;
  destination: string;
  initialSelected: TripStop[];
  onApply: (stops: TripStop[]) => void;
  onClose: () => void;
};

// Available suggested places by destination
const samplePlaceBank: Record<string, TripStop[]> = {
  "Đà Lạt": [
    {
      id: "lake",
      time: "09:30",
      name: { vi: "Hồ Xuân Hương", en: "Xuan Huong Lake" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "square",
      time: "11:00",
      name: { vi: "Quảng trường Lâm Viên", en: "Lam Vien Square" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "flower-garden",
      time: "14:00",
      name: { vi: "Vườn hoa Đà Lạt", en: "Dalat Flower Garden" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "museum",
      time: "15:30",
      name: { vi: "Bảo tàng Lâm Đồng", en: "Lam Dong Museum" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "datanla",
      time: "16:30",
      name: { vi: "Thác Datanla", en: "Datanla Waterfall" },
      kind: { vi: "Đà Lạt · Khám phá", en: "Da Lat · Adventure" },
    },
    {
      id: "station",
      time: "17:30",
      name: { vi: "Ga Đà Lạt", en: "Dalat Old Railway Station" },
      kind: { vi: "Đà Lạt · Di tích", en: "Da Lat · Historic" },
    },
  ],
  "Đà Nẵng": [
    {
      id: "dn-beach",
      time: "08:00",
      name: { vi: "Biển Mỹ Khê", en: "My Khe Beach" },
      kind: { vi: "Đà Nẵng · Tham quan", en: "Da Nang · Sightseeing" },
    },
    {
      id: "dn-bridge",
      time: "19:30",
      name: { vi: "Cầu Rồng Đà Nẵng", en: "Dragon Bridge" },
      kind: { vi: "Đà Nẵng · Tham quan", en: "Da Nang · Sightseeing" },
    },
    {
      id: "dn-sontra",
      time: "14:00",
      name: { vi: "Bán đảo Sơn Trà", en: "Son Tra Peninsula" },
      kind: { vi: "Đà Nẵng · Thiên nhiên", en: "Da Nang · Nature" },
    },
    {
      id: "dn-marble",
      time: "16:00",
      name: { vi: "Ngũ Hành Sơn", en: "Marble Mountains" },
      kind: { vi: "Đà Nẵng · Di tích", en: "Da Nang · Historic" },
    },
  ],
  "Hội An": [
    {
      id: "ha-oldtown",
      time: "16:00",
      name: { vi: "Phố cổ Hội An", en: "Hoi An Ancient Town" },
      kind: { vi: "Hội An · Tham quan", en: "Hoi An · Sightseeing" },
    },
    {
      id: "ha-market",
      time: "18:30",
      name: { vi: "Chợ đêm đèn lồng", en: "Lantern Night Market" },
      kind: { vi: "Hội An · Ẩm thực", en: "Hoi An · Food" },
    },
    {
      id: "ha-bridge",
      time: "10:00",
      name: { vi: "Chùa Cầu Hội An", en: "Japanese Covered Bridge" },
      kind: { vi: "Hội An · Văn hóa", en: "Hoi An · Culture" },
    },
  ],
  "Nha Trang": [
    {
      id: "nt-honmun",
      time: "09:00",
      name: { vi: "Đảo Hòn Mun", en: "Hon Mun Island" },
      kind: { vi: "Nha Trang · Lặn biển", en: "Nha Trang · Diving" },
    },
    {
      id: "nt-ponagar",
      time: "14:30",
      name: { vi: "Tháp Bà Ponagar", en: "Ponagar Cham Towers" },
      kind: { vi: "Nha Trang · Văn hóa", en: "Nha Trang · Culture" },
    },
    {
      id: "nt-vinwonders",
      time: "10:00",
      name: { vi: "VinWonders Nha Trang", en: "VinWonders Nha Trang" },
      kind: { vi: "Nha Trang · Vui chơi", en: "Nha Trang · Theme Park" },
    },
  ],
};

function getPlacesForDestination(dest: string): TripStop[] {
  const match = Object.keys(samplePlaceBank).find((key) =>
    dest.toLowerCase().includes(key.toLowerCase()),
  );
  return match ? samplePlaceBank[match] : samplePlaceBank["Đà Lạt"];
}

export function PlacePickerSheet({
  visible,
  destination,
  initialSelected,
  onApply,
  onClose,
}: PlacePickerSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStops, setSelectedStops] = useState<TripStop[]>(initialSelected);

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

  const allPlaces = useMemo(
    () => getPlacesForDestination(destination),
    [destination],
  );

  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return allPlaces;
    const q = searchQuery.toLowerCase();
    return allPlaces.filter(
      (item) =>
        item.name.vi.toLowerCase().includes(q) ||
        item.name.en.toLowerCase().includes(q) ||
        item.kind.vi.toLowerCase().includes(q),
    );
  }, [allPlaces, searchQuery]);

  const toggleSelect = (place: TripStop) => {
    const isSelected = selectedStops.some((s) => s.id === place.id);
    if (isSelected) {
      setSelectedStops((prev) => prev.filter((s) => s.id !== place.id));
    } else {
      setSelectedStops((prev) => [...prev, place]);
    }
  };

  const handleApply = () => {
    onApply(selectedStops);
    handleAnimatedClose();
  };

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
                    Thêm địa điểm
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

          {/* Search Box */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: theme.radius.md,
                borderColor: isSearchFocused
                  ? theme.colors.focus
                  : theme.colors.border,
              },
            ]}
          >
            <AppIcon name="pin" size={16} color={theme.colors.textSecondary} />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.regular,
                },
                webInputReset,
              ]}
              placeholder={`Tìm địa điểm ở ${destination || "điểm đến"}...`}
              placeholderTextColor={theme.colors.textDisabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              cursorColor={theme.colors.primaryText}
              selectionColor={theme.colors.surfaceTint}
              underlineColorAndroid="transparent"
              autoCorrect={false}
            />
            {searchQuery.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa nội dung tìm kiếm"
                onPress={() => setSearchQuery("")}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.clearSearchButton,
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

          {/* Selected count info */}
          <View style={styles.countRow}>
            <AppText
              style={[
                styles.countText,
                {
                  color: theme.colors.primaryText,
                  fontFamily: theme.typography.fontFamily.semibold,
                },
              ]}
            >
              Đã chọn {selectedStops.length} địa điểm
            </AppText>
          </View>

          {/* Place List */}
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isChecked = selectedStops.some((s) => s.id === item.id);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  onPress={() => toggleSelect(item)}
                  style={({ pressed }) => [
                    styles.placeItem,
                    {
                      borderColor: theme.colors.border,
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    },
                  ]}
                >
                  <View style={styles.placeInfo}>
                    <AppText
                      style={[
                        styles.placeName,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.typography.fontFamily.regular,
                        },
                      ]}
                    >
                      {item.name.vi}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {item.kind.vi}
                    </AppText>
                  </View>

                  {/* Custom Checkbox */}
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isChecked
                          ? theme.colors.primary
                          : theme.colors.borderStrong,
                        backgroundColor: isChecked
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderRadius: theme.radius.sm,
                      },
                    ]}
                  >
                    {isChecked ? (
                      <AppIcon
                        name="check"
                        size={14}
                        color={theme.colors.onPrimary}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
          />

          {/* Action Button */}
          <AppButton variant="raised" onPress={handleApply}>
            {selectedStops.length > 0
              ? `Thêm ${selectedStops.length} địa điểm`
              : "Xong"}
          </AppButton>
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  countRow: {
    marginBottom: 10,
  },
  countText: {
    fontSize: 13,
  },
  list: {
    maxHeight: 280,
    marginBottom: 16,
  },
  listContent: {
    gap: 4,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  placeInfo: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontSize: 14,
    lineHeight: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
