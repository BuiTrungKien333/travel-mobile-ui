import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePickerSheetMotion } from "../hooks/use-picker-sheet-motion";
import { useTripCopy } from "../i18n/trip-copy";
import { formatDisplayDate } from "../utils/create-trip-formatters";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { dayDistance } from "@/features/home/utils/select-home";
import { todayCalendarDate } from "@/utils/calendar-date";
import { useAppTheme } from "@/hooks/use-app-theme";
import { spacing, typography, layout, radius } from "@/theme/tokens";

type DateRangeSheetProps = {
  visible: boolean;
  startDate: string;
  endDate: string;
  today: string;
  onApply: (start: string, end: string) => void;
  onClose: () => void;
};

export function DateRangeSheet(props: DateRangeSheetProps) {
  return props.visible ? <DateRangeSession {...props} /> : null;
}

function DateRangeSession({
  visible,
  startDate,
  endDate,
  today,
  onApply,
  onClose,
}: DateRangeSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [selectedRange, setSelectedRange] = useState({ start: startDate, end: endDate });
  const [activeDateField, setActiveDateField] = useState<"start" | "end">(
    startDate ? "end" : "start",
  );
  const selectedStart = selectedRange.start;
  const selectedEnd = selectedRange.end;

  const initialMonthDate = useMemo(() => {
    const base = startDate || today || todayCalendarDate();
    const [y, m] = base.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1));
  }, [startDate, today]);

  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonthDate);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getUTCFullYear();
    const month = currentMonth.getUTCMonth();
    const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    // Monday is index 0 (0: Mon, ..., 6: Sun)
    const firstDayIndex =
      (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

    const days: ({ dateStr: string; dayNum: number } | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      days.push({
        dateStr: `${year}-${monthStr}-${dayStr}`,
        dayNum: d,
      });
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(
        Date.UTC(
          currentMonth.getUTCFullYear(),
          currentMonth.getUTCMonth() - 1,
          1,
        ),
      ),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(
        Date.UTC(
          currentMonth.getUTCFullYear(),
          currentMonth.getUTCMonth() + 1,
          1,
        ),
      ),
    );
  };

  const handleDatePress = (dateStr: string) => {
    if (dateStr < today) return;

    setSelectedRange((current) => {
      if (activeDateField === "start" || !current.start) {
        return {
          start: dateStr,
          end: current.end && current.end >= dateStr ? current.end : "",
        };
      }
      if (dateStr < current.start) return { start: dateStr, end: "" };
      return { ...current, end: dateStr };
    });
    if (activeDateField === "start") setActiveDateField("end");
    else if (dateStr >= selectedStart) setActiveDateField("start");
  };

  const durationDays = useMemo(() => {
    if (!selectedStart || !selectedEnd) return 0;
    return dayDistance(selectedStart, selectedEnd) + 1;
  }, [selectedStart, selectedEnd]);

  const { sheetMotion, backdropMotion, dragGesture, close, reduceMotion } =
    usePickerSheetMotion(onClose);
  const { copy, locale } = useTripCopy();
  const monthLabel = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" },
  ).format(currentMonth);
  const weekHeaders =
    locale === "vi"
      ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const handleApply = () => {
    if (!selectedStart) return;
    const finalStart = selectedStart;
    const finalEnd = selectedEnd || finalStart;
    close(() => onApply(finalStart, finalEnd));
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
        <View style={styles.backdrop}>
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
                    {copy.chooseDates}
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

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Selected Range Banner */}
              <View
                style={[
                  styles.rangeBanner,
                  {
                    backgroundColor: theme.colors.surfaceTint,
                    borderRadius: theme.radius.md,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Pressable accessibilityRole="button" accessibilityState={{ selected: activeDateField === "start" }} onPress={() => setActiveDateField("start")} style={[styles.bannerColumn, activeDateField === "start" && { backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm }]}>
                  <AppText variant="caption" tone="muted">
                    {copy.startDate}
                  </AppText>
                  <AppText
                    style={[
                      styles.bannerDate,
                      {
                        color: activeDateField === "start" ? theme.colors.primaryText : theme.colors.text,
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {formatDisplayDate(selectedStart, locale) || "--/--/----"}
                  </AppText>
                </Pressable>

                <View
                  style={[
                    styles.bannerDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />

                <Pressable accessibilityRole="button" accessibilityState={{ selected: activeDateField === "end" }} onPress={() => setActiveDateField("end")} style={[styles.bannerColumn, activeDateField === "end" && { backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm }]}>
                  <AppText variant="caption" tone="muted">
                    {copy.endDate}
                  </AppText>
                  <AppText
                    style={[
                      styles.bannerDate,
                      {
                        color: activeDateField === "end" ? theme.colors.primaryText : theme.colors.text,
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {formatDisplayDate(selectedEnd || selectedStart, locale) ||
                      "--/--/----"}
                  </AppText>
                </Pressable>
              </View>

              {selectedStart && !selectedEnd ? (
                <AppText variant="caption" tone="muted" style={{ marginBottom: theme.spacing.md, textAlign: "center" }}>
                  {locale === "vi"
                    ? activeDateField === "start" ? "Chọn ngày đi trên lịch." : "Chọn ngày về sau ngày đi trên lịch."
                    : activeDateField === "start" ? "Choose your departure date on the calendar." : "Choose a return date after departure on the calendar."}
                </AppText>
              ) : null}

              {/* Month Navigation */}
              <View style={styles.monthNavRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.previousMonth}
                  onPress={handlePrevMonth}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.navArrow,
                    { opacity: pressed ? theme.motion.pressOpacity : 1 },
                  ]}
                >
                  <AppIcon
                    name="back"
                    size={18}
                    color={theme.colors.primaryText}
                  />
                </Pressable>
                <AppText
                  style={[
                    styles.monthLabel,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                >
                  {monthLabel}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.nextMonth}
                  onPress={handleNextMonth}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.navArrow,
                    { opacity: pressed ? theme.motion.pressOpacity : 1 },
                  ]}
                >
                  <AppIcon
                    name="chevron"
                    size={18}
                    color={theme.colors.primaryText}
                  />
                </Pressable>
              </View>

              {/* Weekday Row */}
              <View style={styles.weekdayRow}>
                {weekHeaders.map((head, idx) => (
                  <AppText
                    key={head + idx}
                    variant="caption"
                    tone="muted"
                    style={styles.weekdayCell}
                  >
                    {head}
                  </AppText>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {daysInMonth.map((cell, index) => {
                  if (!cell) {
                    return (
                      <View key={`empty-${index}`} style={styles.dayCell} />
                    );
                  }

                  const { dateStr, dayNum } = cell;
                  const isPast = dateStr < today;
                  const isStart = dateStr === selectedStart;
                  const isEnd = dateStr === selectedEnd;
                  const isInRange =
                    selectedStart &&
                    selectedEnd &&
                    dateStr > selectedStart &&
                    dateStr < selectedEnd;

                  return (
                    <Pressable
                      key={dateStr}
                      accessibilityRole="button"
                      accessibilityLabel={new Intl.DateTimeFormat(
                        locale === "vi" ? "vi-VN" : "en-US",
                        { dateStyle: "full", timeZone: "UTC" },
                      ).format(new Date(`${dateStr}T12:00:00Z`))}
                      accessibilityState={{
                        disabled: isPast,
                        selected: Boolean(isStart || isEnd || isInRange),
                      }}
                      disabled={isPast}
                      onPress={() => handleDatePress(dateStr)}
                      style={[
                        styles.dayCell,
                        isInRange && {
                          backgroundColor: theme.colors.surfaceTint,
                        },
                        isStart &&
                          selectedEnd &&
                          selectedEnd !== selectedStart && {
                            borderTopLeftRadius: theme.radius.full,
                            borderBottomLeftRadius: theme.radius.full,
                            backgroundColor: theme.colors.surfaceTint,
                          },
                        isEnd &&
                          selectedStart &&
                          selectedEnd !== selectedStart && {
                            borderTopRightRadius: theme.radius.full,
                            borderBottomRightRadius: theme.radius.full,
                            backgroundColor: theme.colors.surfaceTint,
                          },
                      ]}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          (isStart || isEnd) && {
                            backgroundColor: theme.colors.primary,
                            borderRadius: theme.radius.full,
                          },
                        ]}
                      >
                        <AppText
                          style={[
                            styles.dayText,
                            {
                              color:
                                isStart || isEnd
                                  ? theme.colors.onPrimary
                                  : isPast
                                    ? theme.colors.textDisabled
                                    : theme.colors.text,
                              fontFamily:
                                isStart || isEnd
                                  ? theme.typography.fontFamily.bold
                                  : theme.typography.fontFamily.regular,
                            },
                          ]}
                        >
                          {dayNum}
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Duration Summary */}
              {durationDays > 0 ? (
                <View style={styles.durationRow}>
                  <AppText
                    style={[
                      styles.durationText,
                      {
                        color: theme.colors.primaryText,
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    {durationDays} {copy.days}
                  </AppText>
                </View>
              ) : null}
            </ScrollView>
            {/* Apply Button */}
            <AppButton
              variant="raised"
              disabled={!selectedStart}
              onPress={handleApply}
            >
              {copy.apply}
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
    maxHeight: "90%",
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
  rangeBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + spacing.xxs,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  bannerColumn: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xxs,
  },
  bannerDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  bannerDate: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.compactAction,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  navArrow: {
    minWidth: layout.compactTouchTarget,
    minHeight: layout.compactTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs + spacing.xxs,
  },
  monthLabel: {
    fontSize: typography.fontSize.md,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.fontSize.xs,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg,
  },
  dayCell: {
    width: "14.285%",
    height: layout.compactTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: typography.fontSize.compactAction,
  },
  durationRow: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
  },
});
