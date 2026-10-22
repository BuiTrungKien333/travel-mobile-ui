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
import { getPlacesForDestination } from "../data/place-bank";
import { usePickerSheetMotion } from "../hooks/use-picker-sheet-motion";
import { useTripCopy } from "../i18n/trip-copy";
import { tripMessage } from "../utils/create-trip-formatters";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, typography, layout, radius } from "@/theme/tokens";

const webInputReset: TextStyle = Platform.select({
  web: { outlineWidth: 0 },
  default: {},
});

type PlacePickerSheetProps = {
  visible: boolean;
  destination: string;
  initialSelected: TripStop[];
  excludedIds?: string[];
  onApply: (stops: TripStop[]) => void;
  onClose: () => void;
};

export function PlacePickerSheet(props: PlacePickerSheetProps) {
  return props.visible ? <PlacePickerSession {...props} /> : null;
}

function PlacePickerSession({
  visible,
  destination,
  initialSelected,
  excludedIds = [],
  onApply,
  onClose,
}: PlacePickerSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStops, setSelectedStops] = useState<TripStop[]>([
    ...initialSelected,
  ]);

  const { sheetMotion, backdropMotion, dragGesture, close, reduceMotion } =
    usePickerSheetMotion(onClose);
  const { copy, locale } = useTripCopy();
  const allPlaces = useMemo(
    () =>
      getPlacesForDestination(destination).filter(
        (stop) => !excludedIds.includes(stop.id),
      ),
    [destination, excludedIds],
  );

  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return allPlaces;
    const q = searchQuery.toLowerCase();
    return allPlaces.filter(
      (item) =>
        item.name.vi.toLowerCase().includes(q) ||
        item.name.en.toLowerCase().includes(q) ||
        item.kind.vi.toLowerCase().includes(q) ||
        item.kind.en.toLowerCase().includes(q),
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
    close(() => onApply([...selectedStops]));
  };

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
                    {copy.addPlace}
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
              <AppIcon
                name="pin"
                size={16}
                color={theme.colors.textSecondary}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                  webInputReset,
                ]}
                accessibilityLabel={copy.addPlace}
                placeholder={tripMessage(copy.placeSearch, { destination })}
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
                  accessibilityLabel={copy.clearSearch}
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
                {tripMessage(copy.selectedPlaces, {
                  count: selectedStops.length,
                })}
              </AppText>
            </View>

            {/* Place List */}
            <FlatList
              data={filteredPlaces}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View
                  style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
                >
                  <AppText>{copy.noPlaces}</AppText>
                  <AppText variant="caption" tone="muted">
                    {copy.noPlacesHint}
                  </AppText>
                </View>
              }
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isChecked = selectedStops.some((s) => s.id === item.id);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.name[locale]}
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
                        {item.name[locale]}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {item.kind[locale]}
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
                ? tripMessage(copy.addSelectedPlaces, {
                    count: selectedStops.length,
                  })
                : copy.done}
            </AppButton>
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: layout.compactTouchTarget,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    height: "100%",
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  countRow: {
    marginBottom: spacing.sm + spacing.xxs,
  },
  countText: {
    fontSize: typography.fontSize.compactAction,
  },
  list: {
    maxHeight: layout.pickerListMaxHeight,
    marginBottom: spacing.lg,
  },
  listContent: {
    gap: spacing.xs,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  placeInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  placeName: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.compactAction,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
