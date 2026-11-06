import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "expo-router/js-tabs";
import { useContext, useEffect, useState, type ReactNode } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import { floatingNavigationLayout } from "./floating-navigation-layout";
import { NavigationCameraButton } from "./navigation-camera-button";
import { NotchedNavigationBackdrop } from "./notched-navigation-backdrop";

type FloatingBottomNavigationProps = BottomTabBarProps & {
  onCapture: () => void;
  captureLabel: string;
  animationEnabled?: boolean;
};

type NavigationItem = {
  key: string;
  label: string;
  icon: (focused: boolean, color: string, size: number) => ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  testID?: string;
};

export function FloatingBottomNavigation({
  state,
  descriptors,
  navigation,
  ...props
}: FloatingBottomNavigationProps) {
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  return (
    <FloatingNavigation
      {...props}
      activeTab={state.index}
      hideOnKeyboard={
        descriptors[state.routes[state.index].key].options.tabBarHideOnKeyboard
      }
      onHeightChange={onHeightChange}
      items={state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        return {
          key: route.key,
          label:
            options.tabBarAccessibilityLabel ??
            (typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : (options.title ?? route.name)),
          testID: options.tabBarButtonTestID,
          icon: (focused, color, size) =>
            options.tabBarIcon?.({ focused, color, size }),
          onPress: () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (state.index !== index && !event.defaultPrevented)
              navigation.navigate(route.name, route.params);
          },
          onLongPress: () =>
            navigation.emit({ type: "tabLongPress", target: route.key }),
        };
      })}
    />
  );
}

/** One measured frame also supplies the quick-capture navigation. */
export function FloatingNavigation({
  items,
  activeTab,
  onCapture,
  captureLabel,
  animationEnabled = true,
  hideOnKeyboard = false,
  onHeightChange,
}: {
  items: NavigationItem[];
  activeTab?: number;
  onCapture: () => void;
  captureLabel: string;
  animationEnabled?: boolean;
  hideOnKeyboard?: boolean;
  onHeightChange?: (height: number) => void;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [frameWidth, setFrameWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const geometry = floatingNavigationLayout(frameWidth, theme.layout);
  const indicatorWidth = theme.layout.tabBarActiveDotSize;
  const activeTabOffset =
    activeTab === undefined
      ? 0
      : geometry.tabLeft[activeTab] + (geometry.itemWidth - indicatorWidth) / 2;
  const duration = animationEnabled ? theme.motion.tabTransitionDuration : 0;
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
  const rowHeight = geometry.barHeight - theme.layout.tabBarPadding * 2;

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
            theme.spacing.xl,
            insets.bottom + theme.spacing.md,
          ),
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
        },
      ]}
    >
      <View
        pointerEvents="box-none"
        onLayout={({ nativeEvent }) => setFrameWidth(nativeEvent.layout.width)}
        style={[
          styles.frame,
          {
            maxWidth: theme.layout.tabBarMaxWidth,
            paddingTop: theme.layout.tabBarCameraRise,
            opacity: frameWidth > 0 ? 1 : 0,
          },
        ]}
      >
        <View
          style={{
            height: geometry.barHeight,
            padding: theme.layout.tabBarPadding,
          }}
        >
          <NotchedNavigationBackdrop
            width={frameWidth}
            height={geometry.barHeight}
          />
          <View
            accessibilityRole="tablist"
            style={[styles.row, { height: rowHeight }]}
          >
            {frameWidth > 0 && activeTab !== undefined ? (
              <Animated.View
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[
                  styles.indicator,
                  {
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
            {[items.slice(0, 2), items.slice(2)].map((routes, groupIndex) => (
              <View
                key={groupIndex === 0 ? "left" : "right"}
                style={[
                  styles.group,
                  {
                    left: geometry.groupLeft[groupIndex],
                    width: geometry.groupWidth,
                    height: rowHeight,
                    gap: geometry.groupGap,
                  },
                ]}
              >
                {routes.map((route) => {
                  const index = items.findIndex(
                    (item) => item.key === route.key,
                  );
                  const focused = activeTab === index;
                  const color = focused
                    ? theme.colors.navigationActive
                    : theme.colors.navigationInactive;
                  return (
                    <Pressable
                      key={route.key}
                      accessibilityRole="tab"
                      accessibilityLabel={route.label}
                      accessibilityState={{ selected: focused }}
                      testID={route.testID}
                      onPress={route.onPress}
                      onLongPress={route.onLongPress}
                      style={({ pressed }) => [
                        styles.tab,
                        {
                          width: geometry.itemWidth,
                          height: rowHeight,
                          borderRadius: theme.radius.full,
                          opacity: pressed ? theme.motion.pressOpacity : 1,
                        },
                      ]}
                    >
                      <View
                        pointerEvents="none"
                        style={[
                          styles.icon,
                          {
                            width: theme.layout.tabBarIconSize,
                            height: theme.layout.tabBarIconSize,
                          },
                        ]}
                      >
                        {route.icon(
                          focused,
                          color,
                          theme.layout.tabBarIconSize,
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        <View
          pointerEvents="box-none"
          style={[
            styles.camera,
            {
              left: geometry.cameraLeft,
              top: theme.layout.tabBarPadding,
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
  frame: { width: "100%", position: "relative" },
  camera: { position: "absolute" },
  row: { position: "relative" },
  group: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  tab: { flexShrink: 0, alignItems: "center", justifyContent: "center" },
  icon: { alignItems: "center", justifyContent: "center" },
  indicator: { position: "absolute", left: 0, pointerEvents: "none" },
});
