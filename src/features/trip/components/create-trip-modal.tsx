import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { TripStop } from "@/features/home/types/home-types";
import { dayDistance } from "@/features/home/utils/select-home";
import { useAppTheme } from "@/hooks/use-app-theme";
import { DateRangeSheet } from "./date-range-sheet";
import { DestinationPickerSheet } from "./destination-picker-sheet";
import { PlacePickerSheet } from "./place-picker-sheet";

type CreateTripModalProps = {
  visible: boolean;
  onClose: () => void;
};

const PREFERENCE_CHIPS = [
  "Thiên nhiên",
  "Ẩm thực",
  "Văn hóa",
  "Nghỉ dưỡng",
  "Check-in",
  "Phiêu lưu",
  "Mua sắm",
  "Biển đảo",
];

function formatDisplayDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "--/--/----";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function getDestinationRegion(dest: string): string {
  if (!dest || !dest.trim()) return "Chưa chọn điểm đến";
  const d = dest.toLowerCase();
  if (d.includes("đà nẵng")) return "Việt Nam • Miền Trung";
  if (d.includes("hội an") || d.includes("quảng nam")) return "Việt Nam • Miền Trung";
  if (d.includes("huế")) return "Việt Nam • Miền Trung";
  if (d.includes("đà lạt") || d.includes("lâm đồng")) return "Việt Nam • Tây Nguyên";
  if (d.includes("hà nội") || d.includes("sapa") || d.includes("hạ long") || d.includes("ninh bình")) return "Việt Nam • Miền Bắc";
  if (d.includes("phú quốc") || d.includes("hồ chí minh") || d.includes("sài gòn") || d.includes("vũng tàu")) return "Việt Nam • Miền Nam";
  if (d.includes("nha trang") || d.includes("quy nhơn") || d.includes("phú yên")) return "Việt Nam • Duyên hải Nam Trung Bộ";
  return "Việt Nam • Điểm đến du lịch";
}

function generateDefaultTitle(destination: string, start: string, end: string): string {
  if (!destination || !destination.trim()) return "";
  const destName = destination.split(",")[0].trim();
  if (start && end && end >= start) {
    const days = dayDistance(start, end) + 1;
    const nights = Math.max(0, days - 1);
    if (nights > 0) {
      return `Chuyến đi ${destName} ${days}N${nights}Đ`;
    }
    return `Chuyến đi ${destName} 1 ngày`;
  }
  return `Chuyến đi ${destName}`;
}

function formatVND(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("vi-VN").format(Number(digits));
}

const webInputReset: TextStyle = Platform.select({
  web: { outlineStyle: "none", outlineWidth: 0 } as unknown as TextStyle,
  default: {},
});

export function CreateTripModal({ visible, onClose }: CreateTripModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { today, createDraft } = useTripPreview((state) => ({
    today: state.today,
    createDraft: state.createDraft,
  }));

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripTitle, setTripTitle] = useState("");
  const [isTitleManual, setIsTitleManual] = useState(false);

  // Places
  const [selectedStops, setSelectedStops] = useState<TripStop[]>([]);

  // Accordion (Tùy chọn thêm)
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Sheets
  const [showDestSheet, setShowDestSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showPlaceSheet, setShowPlaceSheet] = useState(false);

  // Validation & state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);

  // Reset all fields when modal opens
  useEffect(() => {
    if (visible) {
      setDestination("");
      setStartDate("");
      setEndDate("");
      setTripTitle("");
      setIsTitleManual(false);
      setSelectedStops([]);
      setIsAccordionOpen(false);
      setBudget("");
      setSelectedTags([]);
      setError(null);
    }
  }, [visible]);

  const durationDays = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    return dayDistance(startDate, endDate) + 1;
  }, [startDate, endDate]);

  const handleSelectDestination = (newDest: string) => {
    setDestination(newDest);
    if (!isTitleManual) {
      setTripTitle(generateDefaultTitle(newDest, startDate, endDate));
    }
  };

  const handleApplyDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (!isTitleManual) {
      setTripTitle(generateDefaultTitle(destination, start, end));
    }
  };

  const handleRemoveStop = (id: string) => {
    setSelectedStops((prev) => prev.filter((stop) => stop.id !== id));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleBudgetChange = (text: string) => {
    setBudget(formatVND(text));
  };

  const handleSubmit = () => {
    Keyboard.dismiss();

    if (!destination.trim()) {
      setError("Vui lòng chọn điểm đến chính.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Vui lòng chọn ngày đi và ngày về.");
      return;
    }
    if (endDate < startDate) {
      setError("Ngày về phải cùng ngày hoặc sau ngày đi.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const finalTitle =
      tripTitle.trim() || generateDefaultTitle(destination, startDate, endDate);

    const success = createDraft({
      destination: destination.trim(),
      startDate,
      endDate,
      title: finalTitle,
      initialStops: selectedStops.length > 0 ? selectedStops : undefined,
    });

    setIsSubmitting(false);

    if (success) {
      onClose();
    } else {
      setError("Đã đạt giới hạn số lượng chuyến đi bản nháp.");
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 20) + theme.spacing.lg,
              paddingBottom: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppIcon name="back" size={20} color={theme.colors.text} />
          </Pressable>

          <View style={styles.headerTextCol}>
            <AppText
              variant="heading"
              style={[
                styles.headerTitle,
                {
                  fontFamily: theme.typography.fontFamily.medium,
                  color: theme.colors.text,
                  marginTop: 2,
                },
              ]}
            >
              Tạo chuyến đi
            </AppText>
          </View>
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: insets.bottom + 100,
              gap: theme.spacing.md,
            },
          ]}
        >
          {/* Card 1: Điểm đến chính */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Điểm đến chính: ${destination}`}
            onPress={() => setShowDestSheet(true)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceTint },
                ]}
              >
                <AppIcon
                  name="pin"
                  size={20}
                  color={theme.colors.primaryText}
                />
              </View>

              <View style={styles.cardInfoCol}>
                <AppText variant="caption" tone="muted">
                  Điểm đến chính
                </AppText>
                <AppText
                  style={[
                    styles.destinationTitle,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: destination
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {destination || "Chọn điểm đến"}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {getDestinationRegion(destination)}
                </AppText>
              </View>

              <AppIcon
                name="chevron"
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
          </Pressable>

          {/* Card 2: Thời gian chuyến đi */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Thời gian: Ngày đi ${formatDisplayDate(startDate)}, Ngày về ${formatDisplayDate(endDate)}, ${durationDays} ngày`}
            onPress={() => setShowDateSheet(true)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <View style={styles.dateHeaderRow}>
              <View style={styles.dateHeaderLeft}>
                <View
                  style={[
                    styles.iconCircleSmall,
                    { backgroundColor: theme.colors.surfaceTint },
                  ]}
                >
                  <AppIcon
                    name="calendar"
                    size={15}
                    color={theme.colors.primaryText}
                  />
                </View>
                <AppText
                  style={[
                    styles.dateCardTitle,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: theme.colors.text,
                    },
                  ]}
                >
                  Thời gian chuyến đi
                </AppText>
              </View>

              {/* Duration badge */}
              <View
                style={[
                  styles.durationBadge,
                  { backgroundColor: theme.colors.surfaceTint },
                ]}
              >
                <AppText
                  style={[
                    styles.durationText,
                    {
                      color: theme.colors.primaryText,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                >
                  {durationDays > 0 ? `${durationDays} ngày` : "--"}
                </AppText>
              </View>
            </View>

            {/* 2 separate columns with middle divider */}
            <View
              style={[
                styles.dateColumnsContainer,
                {
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              {/* Ngày đi */}
              <View style={styles.dateColumnBlock}>
                <AppText variant="caption" tone="muted">
                  Ngày đi
                </AppText>
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.dateValueText,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: startDate
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {formatDisplayDate(startDate)}
                </AppText>
              </View>

              {/* Vertical divider */}
              <View
                style={[
                  styles.dateVerticalDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              {/* Ngày về */}
              <View style={[styles.dateColumnBlock, { paddingLeft: 8 }]}>
                <AppText variant="caption" tone="muted">
                  Ngày về
                </AppText>
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.dateValueText,
                    {
                      fontFamily: theme.typography.fontFamily.bold,
                      color: endDate
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {formatDisplayDate(endDate)}
                </AppText>
              </View>
            </View>
          </Pressable>

          {/* Section 3: Tên chuyến đi */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                gap: theme.spacing.xs,
              },
            ]}
          >
            <AppText
              variant="label"
              style={{
                fontFamily: theme.typography.fontFamily.medium,
                color: theme.colors.text,
              }}
            >
              Tên chuyến đi
            </AppText>
            <View
              style={[
                styles.titleInputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isTitleFocused
                    ? theme.colors.focus
                    : theme.colors.borderStrong,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <TextInput
                value={tripTitle}
                onChangeText={(text) => {
                  setTripTitle(text);
                  setIsTitleManual(true);
                }}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
                placeholder="VD: Khám phá Đà Nẵng 4N3Đ"
                placeholderTextColor={theme.colors.textSecondary}
                cursorColor={theme.colors.primaryText}
                selectionColor={theme.colors.surfaceTint}
                underlineColorAndroid="transparent"
                style={[
                  styles.titleInput,
                  { color: theme.colors.text },
                  webInputReset,
                ]}
              />
              {tripTitle.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xóa tên chuyến đi"
                  onPress={() => {
                    setTripTitle("");
                    setIsTitleManual(true);
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.clearTitleButton,
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
            <AppText variant="caption" tone="muted">
              Đặt tên gợi nhớ để dễ dàng theo dõi hành trình của bạn.
            </AppText>
          </View>

          {/* Section 4: Địa điểm dự kiến */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <AppText
                style={[
                  styles.sectionHeading,
                  {
                    fontFamily: theme.typography.fontFamily.bold,
                    color: theme.colors.text,
                  },
                ]}
              >
                Địa điểm dự kiến
              </AppText>

              {selectedStops.length > 0 ? (
                <AppText
                  variant="caption"
                  style={{
                    color: theme.colors.primaryText,
                    fontFamily: theme.typography.fontFamily.medium,
                  }}
                >
                  Đã chọn {selectedStops.length} điểm
                </AppText>
              ) : null}
            </View>

            {selectedStops.length === 0 ? (
              /* State 01: Empty state button */
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thêm địa điểm"
                onPress={() => {
                  if (!destination.trim()) {
                    setShowDestSheet(true);
                  } else {
                    setShowPlaceSheet(true);
                  }
                }}
                style={({ pressed }) => [
                  styles.addPlaceDashedCard,
                  {
                    borderColor: theme.colors.borderStrong,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.addPlaceIconCircle,
                    { backgroundColor: theme.colors.surfaceTint },
                  ]}
                >
                  <AppIcon
                    name="plus"
                    size={16}
                    color={theme.colors.primaryText}
                  />
                </View>
                <View style={styles.addPlaceTextCol}>
                  <AppText
                    style={[
                      styles.addPlaceTitle,
                      {
                        fontFamily: theme.typography.fontFamily.medium,
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    Thêm địa điểm
                  </AppText>
                </View>
                <AppIcon
                  name="chevron"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            ) : (
              /* State 04: Populated stops list */
              <View style={styles.stopsList}>
                {selectedStops.map((stop, index) => {
                  const stopName =
                    typeof stop.name === "string"
                      ? stop.name
                      : stop.name.vi || stop.name.en;

                  return (
                    <View
                      key={stop.id}
                      style={[
                        styles.stopItemRow,
                        {
                          backgroundColor: theme.colors.surfaceTint,
                          borderRadius: theme.radius.md,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.stopIndexBadge,
                          { backgroundColor: theme.colors.surface },
                        ]}
                      >
                        <AppText
                          style={[
                            styles.stopIndexText,
                            {
                              color: theme.colors.primaryText,
                              fontFamily: theme.typography.fontFamily.bold,
                            },
                          ]}
                        >
                          {index + 1}
                        </AppText>
                      </View>

                      <View style={styles.stopInfoCol}>
                        <AppText
                          numberOfLines={1}
                          style={[
                            styles.stopNameText,
                            {
                              fontFamily: theme.typography.fontFamily.regular,
                              color: theme.colors.text,
                            },
                          ]}
                        >
                          {stopName}
                        </AppText>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Xóa ${stopName}`}
                        onPress={() => handleRemoveStop(stop.id)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.removeStopBtn,
                          { opacity: pressed ? theme.motion.pressOpacity : 1 },
                        ]}
                      >
                        <AppIcon
                          name="close"
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  );
                })}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Thêm địa điểm khác"
                  onPress={() => setShowPlaceSheet(true)}
                  style={({ pressed }) => [
                    styles.addMoreStopsBtn,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    },
                  ]}
                >
                  <AppIcon
                    name="plus"
                    size={14}
                    color={theme.colors.primaryText}
                  />
                  <AppText
                    style={[
                      styles.addMoreStopsText,
                      {
                        color: theme.colors.primaryText,
                        fontFamily: theme.typography.fontFamily.medium,
                      },
                    ]}
                  >
                    Thêm địa điểm khác
                  </AppText>
                </Pressable>
              </View>
            )}
          </View>

          {/* Section 5: Accordion (Tùy chọn thêm) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở rộng tùy chọn thêm: ngân sách và sở thích"
              accessibilityState={{ expanded: isAccordionOpen }}
              onPress={() => setIsAccordionOpen((prev) => !prev)}
              style={({ pressed }) => [
                styles.accordionHeader,
                { opacity: pressed ? theme.motion.pressOpacity : 1 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceTint },
                ]}
              >
                <AppIcon
                  name="tune"
                  size={18}
                  color={theme.colors.primaryText}
                />
              </View>

              <View style={styles.cardInfoCol}>
                <AppText
                  style={[
                    styles.accordionTitle,
                    {
                      fontFamily: theme.typography.fontFamily.medium,
                      color: theme.colors.text,
                    },
                  ]}
                >
                  Tùy chọn thêm
                </AppText>
                <AppText variant="caption" tone="muted">
                  Ngân sách, sở thích
                </AppText>
              </View>

              <View
                style={{
                  transform: [{ rotate: isAccordionOpen ? "-90deg" : "90deg" }],
                }}
              >
                <AppIcon
                  name="chevron"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </View>
            </Pressable>

            {/* Expanded Content (State 04) */}
            {isAccordionOpen ? (
              <View
                style={[
                  styles.accordionBody,
                  {
                    borderTopColor: theme.colors.border,
                    paddingTop: theme.spacing.md,
                    gap: theme.spacing.md,
                  },
                ]}
              >
                {/* Ngân sách */}
                <View style={{ gap: theme.spacing.xs }}>
                  <AppText
                    variant="label"
                    style={{
                      fontFamily: theme.typography.fontFamily.medium,
                      color: theme.colors.text,
                    }}
                  >
                    Ngân sách dự kiến cho cả chuyến
                  </AppText>
                  <View
                    style={[
                      styles.budgetInputWrapper,
                      {
                        borderColor: isBudgetFocused
                          ? theme.colors.focus
                          : theme.colors.borderStrong,
                        borderRadius: theme.radius.md,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <TextInput
                      value={budget}
                      onChangeText={handleBudgetChange}
                      onFocus={() => setIsBudgetFocused(true)}
                      onBlur={() => setIsBudgetFocused(false)}
                      keyboardType="numeric"
                      placeholder="VD: 3.000.000"
                      placeholderTextColor={theme.colors.textSecondary}
                      cursorColor={theme.colors.primaryText}
                      selectionColor={theme.colors.surfaceTint}
                      underlineColorAndroid="transparent"
                      style={[
                        styles.budgetInput,
                        { color: theme.colors.text },
                        webInputReset,
                      ]}
                    />
                    <AppText
                      style={[
                        styles.budgetSuffix,
                        {
                          color: theme.colors.primaryText,
                          fontFamily: theme.typography.fontFamily.bold,
                        },
                      ]}
                    >
                      VND
                    </AppText>
                  </View>
                  <AppText variant="caption" tone="muted">
                    Dự trù chi phí ước tính để tối ưu lộ trình phù hợp.
                  </AppText>
                </View>

                {/* Sở thích trải nghiệm */}
                <View style={{ gap: theme.spacing.xs }}>
                  <AppText
                    variant="label"
                    style={{
                      fontFamily: theme.typography.fontFamily.medium,
                      color: theme.colors.text,
                    }}
                  >
                    Sở thích trải nghiệm
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    Chọn các hoạt động bạn quan tâm:
                  </AppText>

                  <View style={styles.chipsContainer}>
                    {PREFERENCE_CHIPS.map((chip) => {
                      const isSelected = selectedTags.includes(chip);
                      return (
                        <Pressable
                          key={chip}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => toggleTag(chip)}
                          style={({ pressed }) => [
                            styles.chip,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.surfaceTint
                                : theme.colors.surface,
                              borderColor: isSelected
                                ? theme.colors.primaryText
                                : theme.colors.border,
                              borderRadius: theme.radius.full,
                              opacity: pressed ? theme.motion.pressOpacity : 1,
                            },
                          ]}
                        >
                          {isSelected ? (
                            <AppText
                              style={[
                                styles.chipCheck,
                                { color: theme.colors.primaryText },
                              ]}
                            >
                              ✓{" "}
                            </AppText>
                          ) : null}
                          <AppText
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? theme.colors.primaryText
                                  : theme.colors.textSecondary,
                                fontFamily: isSelected
                                  ? theme.typography.fontFamily.medium
                                  : theme.typography.fontFamily.regular,
                              },
                            ]}
                          >
                            {chip}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* Error Message Banner */}
          {error ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: theme.colors.surfaceTint,
                  borderColor: theme.colors.error,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText tone="error" style={styles.errorText}>
                {error}
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky Bottom Action Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <AppButton
            variant="raised"
            loading={isSubmitting}
            onPress={handleSubmit}
            style={styles.createButton}
          >
            Tạo chuyến đi
          </AppButton>
          <AppText
            variant="caption"
            tone="muted"
            style={styles.bottomHintText}
          >
            Bạn có thể chỉnh sửa sau khi tạo.
          </AppText>
        </View>

        {/* Modal Pickers */}
        <DestinationPickerSheet
          visible={showDestSheet}
          currentDestination={destination}
          onSelect={handleSelectDestination}
          onClose={() => setShowDestSheet(false)}
        />

        <DateRangeSheet
          visible={showDateSheet}
          startDate={startDate}
          endDate={endDate}
          today={today}
          onApply={handleApplyDateRange}
          onClose={() => setShowDateSheet(false)}
        />

        <PlacePickerSheet
          visible={showPlaceSheet}
          destination={destination}
          initialSelected={selectedStops}
          onApply={(stops) => {
            setSelectedStops(stops);
            setShowPlaceSheet(false);
          }}
          onClose={() => setShowPlaceSheet(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfoCol: {
    flex: 1,
    gap: 2,
  },
  destinationTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCardTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  dateColumnsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateColumnBlock: {
    flex: 1,
    gap: 4,
  },
  dateVerticalDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 10,
  },
  dateValueText: {
    fontSize: 13,
    lineHeight: 18,
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  durationText: {
    fontSize: 12,
  },
  titleInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  titleInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  clearTitleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeading: {
    fontSize: 15,
  },
  addPlaceDashedCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  addPlaceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addPlaceTextCol: {
    flex: 1,
    gap: 2,
  },
  addPlaceTitle: {
    fontSize: 14,
  },
  stopsList: {
    gap: 8,
    marginTop: 4,
  },
  stopItemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  stopIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stopIndexText: {
    fontSize: 11,
  },
  stopInfoCol: {
    flex: 1,
    justifyContent: "center",
  },
  stopNameText: {
    fontSize: 14,
  },
  removeStopBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreStopsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    height: 40,
    gap: 6,
    marginTop: 4,
  },
  addMoreStopsText: {
    fontSize: 13,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  accordionTitle: {
    fontSize: 15,
  },
  accordionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
  },
  budgetInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 12,
  },
  budgetInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  budgetSuffix: {
    fontSize: 13,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  chipCheck: {
    fontSize: 12,
    fontWeight: "bold",
  },
  chipText: {
    fontSize: 13,
  },
  errorBanner: {
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  createButton: {
    width: "100%",
    height: 48,
  },
  bottomHintText: {
    textAlign: "center",
    marginTop: 8,
  },
});
