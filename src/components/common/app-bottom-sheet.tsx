import { SheetHeader } from "./sheet-header";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { GlassBackdrop } from "@/components/common/glass-backdrop";

import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useSheetMotion } from "@/hooks/use-sheet-motion";

export function AppBottomSheet({
  closeLabel,
  decoration,
  title,
  children,
  onClose,
  onShow,
  contentKey,
  topSpacing,
  heightRatio,
  footer,
  scrollEnabled = true,
  variant = "default",
  contentGap,
  dismissDisabled = false,
}: {
  closeLabel: string;
  decoration?: ReactNode;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onShow?: () => void;
  contentKey?: string;
  topSpacing?: number;
  heightRatio?: number;
  footer?: ReactNode;
  scrollEnabled?: boolean;
  variant?: "default" | "weather";
  contentGap?: number;
  dismissDisabled?: boolean;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();
  const weather = variant === "weather";
  const safeTop = insets.top + (topSpacing ?? theme.spacing.lg);
  const { sheetMotion, backdropMotion, dragGesture, close, reduceMotion } =
    useSheetMotion(onClose, dismissDisabled);
  const handle = (
    <View
      aria-hidden
      style={{
        alignSelf: "center",
        marginVertical: weather ? 0 : theme.spacing.sm,
        width: theme.layout.sheetDragHandleWidth,
        height: theme.layout.sheetDragHandleHeight,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderStrong,
      }}
    />
  );
  return (
    <Modal
      transparent
      visible
      onShow={onShow}
      statusBarTranslucent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={() => close()}
    >
      <GestureHandlerRootView style={styles.fill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[
            styles.backdrop,
            { paddingTop: safeTop },
            weather
              ? {
                  paddingLeft: insets.left + theme.spacing.sm,
                  paddingRight: insets.right + theme.spacing.sm,
                }
              : null,
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.overlay },
              backdropMotion,
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            style={StyleSheet.absoluteFill}
            onPress={() => close()}
          />
          <Animated.View
            accessibilityViewIsModal
            aria-modal
            accessibilityLabel={weather ? title : undefined}
            onAccessibilityEscape={() => close()}
            style={[
              styles.sheet,
              sheetMotion,
              {
                maxWidth: theme.layout.contentMaxWidth,
                ...(topSpacing !== undefined
                  ? {
                      maxHeight: Math.max(
                        theme.layout.touchTarget,
                        windowHeight - safeTop,
                      ),
                    }
                  : {}),
                height:
                  heightRatio !== undefined
                    ? Math.min(
                        windowHeight * heightRatio,
                        windowHeight - safeTop,
                      )
                    : weather
                      ? windowHeight * theme.layout.weatherSheetHeightRatio
                      : undefined,
                backgroundColor: weather
                  ? theme.colors.weatherGlassSurface
                  : theme.colors.surface,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                paddingBottom: insets.bottom + theme.spacing.lg,
              },
            ]}
          >
            {weather ? (
              decoration
            ) : (
              <GlassBackdrop borderRadius={theme.radius.xl} variant="weather" />
            )}
            {weather ? (
              <GestureDetector gesture={dragGesture}>
                <View
                  collapsable={false}
                  style={{ paddingHorizontal: theme.spacing.lg }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={closeLabel}
                    onPress={() => close()}
                    style={{
                      minHeight: theme.layout.compactTouchTarget,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {handle}
                  </Pressable>
                </View>
              </GestureDetector>
            ) : (
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <SheetHeader
                  title={title}
                  closeLabel={closeLabel}
                  onClose={() => close()}
                  gesture={dragGesture}
                />
              </View>
            )}
            <ScrollView
              key={contentKey}
              scrollEnabled={scrollEnabled}
              style={
                heightRatio !== undefined
                  ? { flex: 1, minHeight: 0 }
                  : undefined
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.sm,
                paddingBottom: footer ? theme.spacing.lg : undefined,
                gap: contentGap ?? theme.spacing.lg,
              }}
            >
              {children}
            </ScrollView>
            {footer ? (
              <View
                style={{
                  flexShrink: 0,
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.softActionBorder,
                }}
              >
                {footer}
              </View>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: {
    width: "100%",
    maxHeight: "100%",
    overflow: "hidden",
    flexShrink: 1,
  },
});
