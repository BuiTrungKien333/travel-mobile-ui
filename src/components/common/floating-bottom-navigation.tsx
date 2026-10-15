import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "expo-router/js-tabs";
import { useContext, useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { GlassBackdrop } from "./glass-backdrop";

/** Floating over scenes; scroll content reserves the measured tab-bar height. */
export function FloatingBottomNavigation({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const [rowWidth, setRowWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const activeTab = state.index;
  const tabGap = theme.spacing.sm;
  const itemWidth = Math.max(
    0,
    (rowWidth - tabGap * (state.routes.length - 1)) / state.routes.length,
  );
  const duration = theme.motion.tabTransitionDuration;
  const hideOnKeyboard =
    descriptors[state.routes[activeTab].key].options.tabBarHideOnKeyboard;
  const hidden = hideOnKeyboard && keyboardVisible;

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (hidden) onHeightChange?.(0);
  }, [hidden, onHeightChange]);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: withTiming(activeTab * (itemWidth + tabGap), {
            duration,
            easing: Easing.out(Easing.cubic),
            reduceMotion: ReduceMotion.System,
          }),
        },
      ],
    }),
    [activeTab, itemWidth, tabGap, duration],
  );

  if (hidden) return null;

  return (
    <View
      pointerEvents="box-none"
      onLayout={({ nativeEvent }) =>
        onHeightChange?.(nativeEvent.layout.height)
      }
      style={[
        styles.dock,
        {
          paddingTop: theme.spacing.xs,
          paddingBottom: Math.max(
            theme.spacing.lg,
            insets.bottom + theme.spacing.xs,
          ),
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
        },
      ]}
    >
      <View
        style={[
          styles.shell,
          {
            maxWidth: theme.layout.tabBarMaxWidth,
            padding: theme.layout.tabBarPadding,
            borderRadius: theme.radius.full,
            boxShadow: [
              {
                ...theme.elevation.floating,
                color: theme.colors.navigationShadow,
              },
            ],
          },
        ]}
      >
        <GlassBackdrop borderRadius={theme.radius.full} variant="navigation" />
        <View
          accessibilityRole="tablist"
          onLayout={({ nativeEvent }) => setRowWidth(nativeEvent.layout.width)}
          style={[styles.row, { gap: tabGap }]}
        >
          {rowWidth > 0 ? (
            <Animated.View
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.indicator,
                {
                  left: -theme.spacing.xxs,
                  width: itemWidth + theme.spacing.xxs * 2,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.navigationIndicator,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.navigationIndicatorBorder,
                },
                indicatorStyle,
              ]}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const focused = activeTab === index;
            const options = descriptors[route.key].options;
            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : (options.title ?? route.name);
            const color = focused
              ? theme.colors.navigationActive
              : theme.colors.navigationInactive;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                accessibilityState={{ selected: focused }}
                testID={options.tabBarButtonTestID}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
                onLongPress={() =>
                  navigation.emit({ type: "tabLongPress", target: route.key })
                }
                style={({ pressed }) => [
                  styles.tab,
                  {
                    minHeight: Math.max(
                      theme.layout.touchTarget,
                      theme.layout.tabBarHeight -
                        theme.layout.tabBarPadding * 2,
                    ),
                    paddingVertical: theme.layout.tabBarItemPaddingVertical,
                    paddingHorizontal: theme.spacing.xs,
                    gap: theme.spacing.xxs,
                    borderRadius: theme.radius.full,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  },
                ]}
              >
                {options.tabBarIcon?.({
                  focused,
                  color,
                  size: theme.layout.tabBarIconSize,
                })}
                <AppText
                  variant="caption"
                  style={{
                    color,
                    fontSize: theme.typography.fontSize.navigationLabel,
                    lineHeight: theme.typography.lineHeight.navigationLabel,
                    textAlign: "center",
                    fontFamily: focused
                      ? theme.typography.fontFamily.semibold
                      : theme.typography.fontFamily.medium,
                  }}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  shell: { width: "100%", overflow: "hidden" },
  row: { flexDirection: "row", position: "relative", alignItems: "stretch" },
  tab: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center" },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    pointerEvents: "none",
  },
});
