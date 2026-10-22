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
import { WeatherAtmosphere } from "@/features/home/components/weather-atmosphere";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { usePickerSheetMotion } from "../hooks/use-picker-sheet-motion";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripDetailsSheet({
  title,
  children,
  onClose,
  onShow,
  contentKey,
  topSpacing,
  variant = "default",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onShow?: () => void;
  contentKey?: string;
  topSpacing?: number;
  variant?: "default" | "weather";
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();
  const weather = variant === "weather";
  const safeTop = insets.top + (topSpacing ?? theme.spacing.lg);
  const { copy } = useTripDetailsCopy();
  const { sheetMotion, backdropMotion, dragGesture, close, reduceMotion } =
    usePickerSheetMotion(onClose);
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
            accessibilityLabel={copy.close}
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
                height: weather
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
              <WeatherAtmosphere />
            ) : (
              <GlassBackdrop borderRadius={theme.radius.xl} variant="weather" />
            )}
            <GestureDetector gesture={dragGesture}>
              <View
                collapsable={false}
                style={{ paddingHorizontal: theme.spacing.lg }}
              >
                {weather ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.close}
                    onPress={() => close()}
                    style={{
                      minHeight: theme.layout.compactTouchTarget,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {handle}
                  </Pressable>
                ) : (
                  handle
                )}
                {!weather ? (
                  <View style={styles.heading}>
                    <AppText
                      accessibilityRole="header"
                      variant="label"
                      style={styles.grow}
                    >
                      {title}
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={copy.close}
                      onPress={() => close()}
                      style={[
                        styles.control,
                        {
                          minWidth: theme.layout.compactTouchTarget,
                          minHeight: theme.layout.compactTouchTarget,
                        },
                      ]}
                    >
                      <AppIcon
                        name="close"
                        size={theme.layout.iconSmall}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </GestureDetector>
            <ScrollView
              key={contentKey}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.sm,
                gap: theme.spacing.lg,
              }}
            >
              {children}
            </ScrollView>
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
  heading: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
  control: { alignItems: "center", justifyContent: "center" },
});
