import { SheetHeader } from "@/components/common/sheet-header";
import { useMemo, useState } from "react";
import { FlatList, ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, TextStyle, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { useDestinationsQuery } from "../api/destinations-queries";
import { tripFormLimits } from "../constants/trip-form";
import { AppButton } from "@/components/ui/app-button";
import { usePickerSheetMotion } from "../hooks/use-picker-sheet-motion";
import { useTripCopy } from "../i18n/trip-copy";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, typography, layout } from "@/theme/tokens";

const webInputReset: TextStyle = Platform.select({
  web: { outlineWidth: 0 },
  default: {},
});

type DestinationPickerSheetProps = {
  visible: boolean;
  currentDestination: string;
  currentProvinceId?: string | null;
  onSelect: (dest: string, provinceId?: string | null) => void;
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
type DestinationItem = {
  name: string;
  city: string;
  id?: string;
  custom?: boolean;
};

export function DestinationPickerSheet(props: DestinationPickerSheetProps) {
  return props.visible ? <DestinationPickerSession {...props} /> : null;
}

function DestinationPickerSession({
  visible,
  currentDestination,
  currentProvinceId,
  onSelect,
  onClose,
}: DestinationPickerSheetProps) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const [customInput, setCustomInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { query: catalog, isDebouncing } = useDestinationsQuery(
    customInput,
    !UI_PREVIEW_ENABLED,
  );
  const catalogRows = useMemo(
    () => catalog.data?.pages.flatMap((page) => page.content) ?? [],
    [catalog.data],
  );

  const { sheetMotion, backdropMotion, dragGesture, close, reduceMotion } =
    usePickerSheetMotion(onClose);
  const { copy } = useTripCopy();
  const handleSelect = (dest: string, provinceId: string | null = null) => {
    close(() => onSelect(dest, provinceId));
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      close(() => onSelect(customInput.trim(), null));
    }
  };

  const filteredDestinations = useMemo<DestinationItem[]>(() => {
    const q = customInput.trim();
    if (!UI_PREVIEW_ENABLED) {
      const items = isDebouncing
        ? []
        : catalogRows.map((item) => ({
          id: item.id,
          name: item.name,
          city: item.name,
        }));
      return q ? [{ name: q, city: q, custom: true }, ...items] : items;
    }
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
  }, [customInput, catalogRows, isDebouncing]);

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
          style={[
            styles.backdrop,
            {
              paddingTop: insets.top + theme.spacing.sm,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
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
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                paddingBottom:
                  Math.max(insets.bottom, theme.spacing.lg) + theme.spacing.md,
              },
            ]}
          >
            {/* Drag Handle & Header */}
            <SheetHeader title={copy.chooseDestination} closeLabel={copy.close} onClose={() => close()} gesture={dragGesture} />

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
                maxLength={tripFormLimits.destination}
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
                : UI_PREVIEW_ENABLED
                  ? copy.popularDestinations
                  : copy.provinceCatalog}
            </AppText>

            {/* Destinations List */}
            <FlatList
              data={filteredDestinations}
              keyExtractor={(item) =>
                item.custom ? "custom" : (item.id ?? item.name)
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              ListHeaderComponent={
                !UI_PREVIEW_ENABLED && (catalog.isPending || isDebouncing) ? (
                  <View
                    style={{
                      padding: theme.spacing.md,
                      gap: theme.spacing.sm,
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator
                      accessibilityLabel={copy.catalogLoading}
                      color={theme.colors.primaryText}
                    />
                    <AppText
                      variant="caption"
                      tone="muted"
                      accessibilityLiveRegion="polite"
                    >
                      {copy.catalogLoading}
                    </AppText>
                  </View>
                ) : null
              }
              ListFooterComponent={
                !UI_PREVIEW_ENABLED ? (
                  <View
                    style={{
                      gap: theme.spacing.sm,
                      paddingVertical: theme.spacing.sm,
                    }}
                  >
                    {!isDebouncing && catalog.isError ? (
                      <>
                        <AppText
                          accessibilityRole="alert"
                          variant="caption"
                          tone="error"
                        >
                          {copy.catalogError}
                        </AppText>
                        <AppButton
                          variant="outline"
                          size="small"
                          loading={catalog.isFetching}
                          onPress={() => {
                            if (catalog.isFetchNextPageError)
                              void catalog.fetchNextPage();
                            else void catalog.refetch();
                          }}
                        >
                          {copy.catalogRetry}
                        </AppButton>
                      </>
                    ) : !catalog.isPending &&
                      !isDebouncing &&
                      catalogRows.length === 0 ? (
                      <AppText
                        variant="caption"
                        tone="muted"
                        accessibilityLiveRegion="polite"
                      >
                        {customInput.trim()
                          ? copy.catalogNoMatch
                          : copy.catalogEmpty}
                      </AppText>
                    ) : null}
                    {!catalog.isError &&
                      !isDebouncing &&
                      catalog.hasNextPage ? (
                      <AppButton
                        variant="outline"
                        size="small"
                        loading={catalog.isFetchingNextPage}
                        disabled={catalog.isFetching}
                        onPress={() => {
                          void catalog.fetchNextPage();
                        }}
                      >
                        {copy.catalogMore}
                      </AppButton>
                    ) : null}
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const isSelected = !UI_PREVIEW_ENABLED
                  ? item.id
                    ? currentProvinceId === item.id
                    : !currentProvinceId && currentDestination === item.name
                  : currentDestination
                    .toLowerCase()
                    .includes(item.city.toLowerCase()) ||
                  currentDestination.toLowerCase() ===
                  item.name.toLowerCase();
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: isSelected,
                    }}
                    onPress={() => handleSelect(item.name, item.id ?? null)}
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
                      <View
                        style={{ flex: 1, minWidth: 0, gap: theme.spacing.xxs }}
                      >
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
                        {item.custom ? (
                          <AppText variant="caption" tone="muted">
                            {copy.customDestination}
                          </AppText>
                        ) : null}
                      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    minHeight: layout.compactTouchTarget,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    minHeight: layout.compactTouchTarget,
    paddingVertical: spacing.sm,
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
    minWidth: 0,
  },
  itemText: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
  },
});
