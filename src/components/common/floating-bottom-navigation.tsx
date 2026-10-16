import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "expo-router/js-tabs";
import { Fragment, useContext, useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";
import { NavigationCameraButton } from "./navigation-camera-button";
import { NotchedNavigationBackdrop } from "./notched-navigation-backdrop";

type FloatingBottomNavigationProps = BottomTabBarProps & {
  onCapture: () => void;
  captureLabel: string;
  animationEnabled?: boolean;
};

/** Floating over scenes; scroll content reserves the measured tab-bar height. */
export function FloatingBottomNavigation({
  state,
  descriptors,
  navigation,
  onCapture,
  captureLabel,
  animationEnabled = true,
}: FloatingBottomNavigationProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const [rowWidth, setRowWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const activeTab = state.index;
  const cameraSize = theme.layout.tabBarCameraSize;
  const itemWidth = theme.layout.touchTarget;
  // Native layout clamps negative gaps to zero; keep indicator geometry in sync.
  const groupGap = Math.max(0, theme.layout.tabBarGroupGap);
  const groupWidth = itemWidth * 2 + groupGap;
  // Fixed-size pairs stay compact; only the central clearance adapts on narrow screens.
  const cameraSlotWidth = Math.min(
    cameraSize + theme.layout.tabBarCameraSideSpacing * 2,
    Math.max(0, rowWidth - groupWidth * 2),
  );
  const sideWidth = (rowWidth - cameraSlotWidth) / 2;
  const activeTabOffset =
    activeTab < 2
      ? sideWidth - groupWidth + activeTab * (itemWidth + groupGap)
      : sideWidth + cameraSlotWidth + (activeTab - 2) * (itemWidth + groupGap);
  const indicatorWidth = theme.layout.tabBarActiveDotSize;
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
          translateX: withTiming(activeTabOffset, {
            duration,
            easing: Easing.out(Easing.cubic),
            reduceMotion: ReduceMotion.System,
          }),
        },
      ],
    }),
    [activeTabOffset, duration],
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
          paddingTop: theme.layout.tabBarCameraRise + theme.spacing.xs,
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
          },
        ]}
      >
        <NotchedNavigationBackdrop
          width={rowWidth ? rowWidth + theme.layout.tabBarPadding * 2 : 0}
          height={
            Math.max(
              theme.layout.touchTarget,
              theme.layout.tabBarHeight - theme.layout.tabBarPadding * 2,
            ) +
            theme.layout.tabBarPadding * 2
          }
        />
        <View
          accessibilityRole="tablist"
          onLayout={({ nativeEvent }) => setRowWidth(nativeEvent.layout.width)}
          style={styles.row}
        >
          {rowWidth > 0 ? (
            <Animated.View
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.indicator,
                {
                  left: (itemWidth - indicatorWidth) / 2,
                  width: indicatorWidth,
                  height: indicatorWidth,
                  bottom: theme.layout.tabBarItemPaddingVertical,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.navigationActive,
                },
                indicatorStyle,
              ]}
            />
          ) : null}
          {[state.routes.slice(0, 2), state.routes.slice(2)].map(
            (routes, groupIndex) => (
              <Fragment key={groupIndex === 0 ? "left" : "right"}>
                {groupIndex === 1 ? (
                  <View
                    aria-hidden
                    pointerEvents="none"
                    style={{ width: cameraSlotWidth, flexShrink: 0 }}
                  />
                ) : null}
                <View
                  style={[
                    styles.group,
                    {
                      gap: groupGap,
                      justifyContent:
                        groupIndex === 0 ? "flex-end" : "flex-start",
                    },
                  ]}
                >
                  {routes.map((route) => {
                    const index = state.routes.findIndex(
                      (item) => item.key === route.key,
                    );
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
                        accessibilityLabel={
                          options.tabBarAccessibilityLabel ?? label
                        }
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
                          navigation.emit({
                            type: "tabLongPress",
                            target: route.key,
                          })
                        }
                        style={({ pressed }) => [
                          styles.tab,
                          {
                            width: itemWidth,
                            minHeight: Math.max(
                              theme.layout.touchTarget,
                              theme.layout.tabBarHeight -
                                theme.layout.tabBarPadding * 2,
                            ),
                            paddingVertical:
                              theme.layout.tabBarItemPaddingVertical,
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
                      </Pressable>
                    );
                  })}
                </View>
              </Fragment>
            ),
          )}
        </View>
      </View>
      <View
        pointerEvents="box-none"
        style={[
          styles.camera,
          {
            marginLeft: -cameraSize / 2 + (insets.left - insets.right) / 2,
            top: theme.spacing.xs + theme.layout.tabBarPadding,
          },
        ]}
      >
        <NavigationCameraButton
          onPress={onCapture}
          accessibilityLabel={captureLabel}
          animationEnabled={animationEnabled}
        />
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
  shell: { width: "100%" },
  camera: { position: "absolute", left: "50%" },
  row: { flexDirection: "row", position: "relative", alignItems: "stretch" },
  group: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "stretch",
  },
  tab: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    position: "absolute",
    pointerEvents: "none",
  },
});
