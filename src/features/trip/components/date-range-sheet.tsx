import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
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
import { dayDistance } from "@/features/home/utils/select-home";
import { useAppTheme } from "@/hooks/use-app-theme";

type DateRangeSheetProps = {
  visible: boolean;
  startDate: string;
  endDate: string;
  today: string;
  onApply: (start: string, end: string) => void;
  onClose: () => void;
};

function formatDisplayDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function DateRangeSheet({
  visible,
  startDate,
  endDate,
  today,
  onApply,
  onClose,
}: DateRangeSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [selectedStart, setSelectedStart] = useState(startDate);
  const [selectedEnd, setSelectedEnd] = useState(endDate);

  const initialMonthDate = useMemo(() => {
    const base = startDate || today || new Date().toISOString().slice(0, 10);
    const [y, m] = base.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1));
  }, [startDate, today]);

  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonthDate);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getUTCFullYear();
    const month = currentMonth.getUTCMonth();
    const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    // Monday is index 0 (0: Mon, ..., 6: Sun)
    const firstDayIndex = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

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
        Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1),
      ),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(
        Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1),
      ),
    );
  };

  const handleDatePress = (dateStr: string) => {
    if (dateStr < today) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(dateStr);
      setSelectedEnd("");
    } else if (selectedStart && !selectedEnd) {
      if (dateStr < selectedStart) {
        setSelectedStart(dateStr);
      } else {
        setSelectedEnd(dateStr);
      }
    }
  };

  const durationDays = useMemo(() => {
    if (!selectedStart || !selectedEnd) return 0;
    return dayDistance(selectedStart, selectedEnd) + 1;
  }, [selectedStart, selectedEnd]);

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
      setSelectedStart(startDate);
      setSelectedEnd(endDate);
      const base = startDate || today || new Date().toISOString().slice(0, 10);
      const [y, m] = base.split("-").map(Number);
      setCurrentMonth(new Date(Date.UTC(y, m - 1, 1)));
      translateY.value = 280;
      translateY.value = withTiming(0, {
        duration: snapDuration,
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [visible, startDate, endDate, today, snapDuration, translateY, isClosing]);

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

  const monthLabel = useMemo(() => {
    const month = currentMonth.getUTCMonth() + 1;
    const year = currentMonth.getUTCFullYear();
    return `Tháng ${month}, ${year}`;
  }, [currentMonth]);

  const weekHeaders = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const handleApply = () => {
    if (!selectedStart) return;
    const finalStart = selectedStart;
    const finalEnd = selectedEnd || finalStart;
    onApply(finalStart, finalEnd);
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
                    Chọn ngày đi và ngày về
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
            <View style={styles.bannerColumn}>
              <AppText variant="caption" tone="muted">
                Ngày đi
              </AppText>
              <AppText
                style={[
                  styles.bannerDate,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.bold,
                  },
                ]}
              >
                {formatDisplayDate(selectedStart) || "--/--/----"}
              </AppText>
            </View>

            <View
              style={[styles.bannerDivider, { backgroundColor: theme.colors.border }]}
            />

            <View style={styles.bannerColumn}>
              <AppText variant="caption" tone="muted">
                Ngày về
              </AppText>
              <AppText
                style={[
                  styles.bannerDate,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamily.bold,
                  },
                ]}
              >
                {formatDisplayDate(selectedEnd || selectedStart) || "--/--/----"}
              </AppText>
            </View>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tháng trước"
              onPress={handlePrevMonth}
              hitSlop={12}
              style={({ pressed }) => [
                styles.navArrow,
                { opacity: pressed ? theme.motion.pressOpacity : 1 },
              ]}
            >
              <AppIcon name="back" size={18} color={theme.colors.primaryText} />
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
              accessibilityLabel="Tháng sau"
              onPress={handleNextMonth}
              hitSlop={12}
              style={({ pressed }) => [
                styles.navArrow,
                { opacity: pressed ? theme.motion.pressOpacity : 1 },
              ]}
            >
              <AppIcon name="chevron" size={18} color={theme.colors.primaryText} />
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
                return <View key={`empty-${index}`} style={styles.dayCell} />;
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
                          color: isStart || isEnd
                            ? theme.colors.onPrimary
                            : isPast
                              ? theme.colors.textDisabled
                              : theme.colors.text,
                          fontFamily: isStart || isEnd
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
                {durationDays} ngày
              </AppText>
            </View>
          ) : null}

          {/* Apply Button */}
          <AppButton
            variant="raised"
            disabled={!selectedStart}
            onPress={handleApply}
          >
            Áp dụng
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
  rangeBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  bannerColumn: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  bannerDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  bannerDate: {
    fontSize: 14,
    lineHeight: 18,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  navArrow: {
    padding: 6,
  },
  monthLabel: {
    fontSize: 15,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dayCell: {
    width: "14.285%",
    height: 40,
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
    fontSize: 13,
  },
  durationRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  durationText: {
    fontSize: 14,
  },
});
