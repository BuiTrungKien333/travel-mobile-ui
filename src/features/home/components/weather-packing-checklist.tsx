import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useScreenInsets } from "@/hooks/use-screen-insets";

import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { PackingItem } from "../data/weather-preview";
import { useWeatherCopy } from "../i18n/weather-copy";
import { homeStyles } from "./home-primitives";
import { PackingConfetti, PackingProgress } from "./packing-feedback";

const packingIcons: Record<PackingItem, AppIconName> = {
  layer: "trips",
  umbrella: "umbrella",
  sun: "sun",
  shoes: "route",
};

export function WeatherPackingChecklist({
  items,
  destination,
  animationProgress,
}: {
  items: PackingItem[];
  destination: string;
  animationProgress: SharedValue<number>;
}) {
  const theme = useAppTheme();
  const { copy } = useWeatherCopy();
  const insets = useScreenInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Partial<Record<PackingItem, boolean>>>(
    {},
  );
  const packed = items.filter((id) => checked[id]).length;
  const ratio = items.length ? packed / items.length : 0;
  const complete = items.length > 0 && packed === items.length;
  const wasComplete = useRef(false);
  const progress = useSharedValue(0);
  const burst = useSharedValue(0);
  const progressDuration = theme.motion.packingProgressDuration;
  const burstDuration = theme.motion.packingBurstDuration;
  const drift = theme.spacing.xxs;
  const notStarted = items.length > 0 && packed === 0;
  const canAnimate = !complete && !open && !reduceMotion;
  const showReminder = notStarted && canAnimate;
  const shakeWindow =
    theme.motion.packingShakeDuration /
    (theme.motion.tripCardAmbientDuration / 2);
  const shakeAngle = theme.motion.packingShakeAngle;
  const reminderOpacity = theme.motion.packingReminderOpacity;
  const reminderStyle = useAnimatedStyle(() => ({
    opacity:
      reminderOpacity *
      (0.5 + 0.5 * Math.sin(animationProgress.value * Math.PI * 4)),
  }));

  const luggageStyle = useAnimatedStyle(() => {
    // A short, soft shake every six seconds; the icon rests between reminders.
    const phase = ((animationProgress.value * 2) % 1) / shakeWindow;
    const shake =
      phase < 1 ? Math.sin(phase * Math.PI * 6) * Math.sin(phase * Math.PI) : 0;

    return {
      transform: [
        { translateX: canAnimate && notStarted ? shake * drift : 0 },
        {
          translateY:
            canAnimate && !notStarted
              ? Math.sin(animationProgress.value * Math.PI * 4) * drift
              : 0,
        },
        {
          rotate: !canAnimate
            ? "0deg"
            : notStarted
              ? `${shake * shakeAngle}deg`
              : `${Math.sin(animationProgress.value * Math.PI * 2) * 2}deg`,
        },
      ],
    };
  });

  useEffect(() => {
    progress.set(
      withTiming(ratio, {
        duration: progressDuration,
        reduceMotion: ReduceMotion.System,
      }),
    );

    return () => cancelAnimation(progress);
  }, [ratio, progressDuration, progress]);

  useEffect(() => {
    if (complete && !wasComplete.current && !reduceMotion) {
      burst.set(0);
      burst.set(
        withTiming(1, {
          duration: burstDuration,
          reduceMotion: ReduceMotion.System,
        }),
      );
    } else if (!complete || reduceMotion) {
      burst.set(0);
    }
    wasComplete.current = complete;

    return () => cancelAnimation(burst);
  }, [complete, reduceMotion, burstDuration, burst]);

  function handleToggle(id: PackingItem) {
    setChecked((previous) => ({ ...previous, [id]: !previous[id] }));
  }

  function renderItem(id: PackingItem) {
    return (
      <PackingCheckbox
        key={id}
        id={id}
        checked={Boolean(checked[id])}
        onToggle={() => handleToggle(id)}
      />
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.packing}. ${packed}/${items.length} ${copy.packed}`}
        accessibilityHint={copy.packingOpen}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          {
            padding: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
            gap: theme.spacing.xs,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: theme.radius.sm,
            borderColor: complete ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.packingSurface,
            boxShadow: [
              {
                ...theme.elevation.glass,
                color: complete
                  ? theme.colors.glassGlow
                  : theme.colors.glassShadow,
              },
            ],
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <View
          style={[
            homeStyles.row,
            { gap: theme.spacing.sm, minHeight: theme.layout.touchTarget },
          ]}
        >
          <Animated.View
            style={[
              styles.close,
              {
                width: theme.spacing.xxxl,
                height: theme.spacing.xxxl,
                borderRadius: theme.radius.md,
                backgroundColor: notStarted
                  ? theme.colors.weatherAmberGlass
                  : theme.colors.softActionSurface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: notStarted
                  ? theme.colors.weatherAmberBorder
                  : theme.colors.glassBorder,
              },
              luggageStyle,
            ]}
          >
            {showReminder ? (
              <Animated.View
                aria-hidden
                accessible={false}
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: theme.radius.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.weatherAmberBorder,
                    backgroundColor: theme.colors.weatherAmberGlass,
                  },
                  reminderStyle,
                ]}
              />
            ) : null}
            <AppIcon
              name={complete ? "check" : "trips"}
              size={theme.layout.iconMedium}
              color={
                notStarted
                  ? theme.colors.onWarningSurface
                  : theme.colors.primaryText
              }
            />
          </Animated.View>
          <View style={[homeStyles.grow, { gap: theme.spacing.xxs }]}>
            <AppText variant="label" tone="primary">
              {copy.packing}
            </AppText>
            <AppText
              variant="caption"
              tone={complete ? "primary" : "muted"}
              accessibilityLiveRegion="polite"
              style={{
                fontFamily: theme.typography.fontFamily.medium,
                fontVariant: ["tabular-nums"],
              }}
            >
              {packed}/{items.length} {copy.packed}
            </AppText>
          </View>
          <AppIcon
            name="chevron"
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
        </View>
        <PackingProgress
          progress={progress}
          packed={packed}
          total={items.length}
        />
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType={reduceMotion ? "none" : "slide"}
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: theme.colors.overlay,
              paddingTop: insets.top + theme.spacing.lg,
              paddingLeft: insets.left + theme.spacing.sm,
              paddingRight: insets.right + theme.spacing.sm,
            },
          ]}
        >
          <Pressable
            accessible={false}
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                maxHeight: height * theme.layout.packingSheetHeightRatio,
                maxWidth: theme.layout.contentMaxWidth,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                backgroundColor: theme.colors.background,
              },
            ]}
          >
            <View
              style={[
                homeStyles.row,
                {
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.sm,
                  gap: theme.spacing.sm,
                },
              ]}
            >
              <AppText
                accessibilityRole="header"
                variant="label"
                style={homeStyles.grow}
              >
                {copy.packingTitle.replace("{destination}", destination)}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.close}
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  styles.close,
                  {
                    width: theme.layout.touchTarget,
                    height: theme.layout.touchTarget,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  },
                ]}
              >
                <AppIcon name="close" size={theme.layout.iconSmall} />
              </Pressable>
            </View>
            {complete ? (
              <View
                style={{
                  padding: theme.spacing.md,
                  marginHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                  gap: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.softActionSurface,
                  boxShadow: [
                    {
                      ...theme.elevation.glass,
                      color: theme.colors.glassGlow,
                    },
                  ],
                }}
              >
                <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
                  <AppIcon name="flag" size={theme.layout.iconSmall} />
                  <AppText variant="label" tone="primary">
                    {copy.packingBadge}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  tone="primary"
                  accessibilityLiveRegion="polite"
                >
                  {copy.packingComplete.replace("{destination}", destination)}
                </AppText>
                {!reduceMotion ? <PackingConfetti progress={burst} /> : null}
              </View>
            ) : null}
            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.lg,
                paddingBottom: theme.spacing.md,
                gap: theme.spacing.md,
              }}
            >
              <AppText variant="caption" tone="muted">
                {packed}/{items.length} {copy.packed} · {copy.packingHint}
              </AppText>
              <PackingProgress
                progress={progress}
                packed={packed}
                total={items.length}
              />
              {items.length ? (
                <View style={{ gap: theme.spacing.sm }}>
                  {items.map(renderItem)}
                </View>
              ) : (
                <AppText variant="caption" tone="muted">
                  {copy.packingEmpty}
                </AppText>
              )}
            </ScrollView>
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.sm,
                paddingBottom: insets.bottom + theme.spacing.lg,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.glassBorder,
                backgroundColor: theme.colors.surface,
              }}
            >
              <AppButton
                variant="gradient"
                onPress={() => setOpen(false)}
                leadingIcon={
                  <AppIcon
                    name="check"
                    size={theme.layout.iconSmall}
                    color={theme.colors.onGradientAction}
                  />
                }
              >
                {complete ? copy.packingDone : copy.done}
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function PackingCheckbox({
  id,
  checked,
  onToggle,
}: {
  id: PackingItem;
  checked: boolean;
  onToggle: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useWeatherCopy();
  const scale = useSharedValue(1);
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  useEffect(() => () => cancelAnimation(scale), [scale]);

  function handlePress() {
    cancelAnimation(scale);
    scale.set(
      checked
        ? 1
        : withSequence(
            withTiming(1.15, {
              duration: theme.motion.packingCheckDuration,
              reduceMotion: ReduceMotion.System,
            }),
            withTiming(1, {
              duration: theme.motion.packingCheckDuration,
              reduceMotion: ReduceMotion.System,
            }),
          ),
    );
    onToggle();
  }

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={copy.packingItems[id]}
      accessibilityHint={copy.packingReasons[id]}
      accessibilityState={{ checked }}
      onPress={handlePress}
      style={({ pressed }) => [
        homeStyles.row,
        {
          minHeight: theme.layout.touchTarget,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
          borderRadius: theme.radius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: checked
            ? theme.colors.softActionBorder
            : theme.colors.glassBorder,
          backgroundColor: checked
            ? theme.colors.softActionSurface
            : theme.colors.surface,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        },
      ]}
    >
      <AppIcon name={packingIcons[id]} size={theme.layout.iconMedium} />
      <View style={[homeStyles.grow, { gap: theme.spacing.xxs }]}>
        <AppText variant="label" tone="primary">
          {copy.packingItems[id]}
        </AppText>
        <AppText variant="caption" tone="muted">
          {copy.packingReasons[id]}
        </AppText>
      </View>
      <Animated.View style={checkStyle}>
        {checked ? (
          <AppIcon name="check" size={theme.layout.iconMedium} />
        ) : (
          <View
            style={{
              width: theme.layout.iconMedium,
              height: theme.layout.iconMedium,
              borderRadius: theme.radius.sm,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.primaryText,
            }}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", overflow: "hidden" },
  body: { flexGrow: 0, flexShrink: 1 },
  close: { alignItems: "center", justifyContent: "center" },
});
