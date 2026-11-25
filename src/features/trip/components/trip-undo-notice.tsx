import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripUndoNotice({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const offset = useSharedValue(0);
  const width = useSharedValue<number>(theme.layout.contentMaxWidth);
  const closing = useSharedValue(false);
  const threshold = theme.layout.sheetDismissDistance;
  const duration = theme.motion.sheetDismissDuration;
  const velocity = theme.motion.sheetDismissVelocity;
  const gesture = Gesture.Pan()
    .activeOffsetX([-theme.spacing.sm, theme.spacing.sm])
    .failOffsetY([-theme.spacing.sm, theme.spacing.sm])
    .onUpdate((event) => {
      if (!closing.get()) offset.set(event.translationX);
    })
    .onEnd((event) => {
      if (closing.get()) return;
      if (
        Math.abs(offset.get()) >= threshold ||
        (Math.abs(offset.get()) > theme.spacing.md &&
          Math.abs(event.velocityX) > velocity)
      ) {
        closing.set(true);
        offset.set(
          withTiming(
            offset.get() < 0 ? -width.get() : width.get(),
            { duration, reduceMotion: ReduceMotion.System },
            (finished) => {
              if (finished) scheduleOnRN(onDismiss);
            },
          ),
        );
      } else
        offset.set(
          withSpring(0, {
            ...theme.motion.photoViewerSpring,
            reduceMotion: ReduceMotion.System,
          }),
        );
    })
    .onFinalize((_event, success) => {
      if (!success && !closing.get())
        offset.set(
          withSpring(0, {
            ...theme.motion.photoViewerSpring,
            reduceMotion: ReduceMotion.System,
          }),
        );
    });

  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
    opacity: Math.max(0, 1 - Math.abs(offset.get()) / width.get()),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={(event) => width.set(event.nativeEvent.layout.width)}
        entering={FadeInDown.duration(theme.motion.enterDuration).reduceMotion(
          ReduceMotion.System,
        )}
        style={[
          {
            width: "100%",
            maxWidth: theme.layout.contentMaxWidth,
            alignSelf: "center",
            paddingHorizontal: theme.spacing.lg,
            marginVertical: theme.spacing.sm,
          },
          motion,
        ]}
      >
        <View
          style={[
            styles.row,
            {
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.softActionBorder,
              backgroundColor: theme.colors.surfaceTint,
              boxShadow: [
                { ...theme.elevation.glass, color: theme.colors.glassShadow },
              ],
            },
          ]}
        >
          <GlassBackdrop borderRadius={theme.radius.lg} />
          <View
            aria-hidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: theme.layout.compactIconButtonSurfaceSize,
              height: theme.layout.compactIconButtonSurfaceSize,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.softActionSurface,
            }}
          >
            <AppIcon
              name="check"
              size={theme.layout.iconSmall}
              color={theme.colors.primaryText}
            />
          </View>
          <AppText
            accessibilityLiveRegion="polite"
            variant="caption"
            style={styles.message}
          >
            {message}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.undo}
            onPress={() => {
              if (closing.get() || Math.abs(offset.get()) > theme.spacing.xs)
                return;
              onUndo();
            }}
            style={({ pressed }) => ({
              minHeight: theme.layout.compactTouchTarget,
              minWidth: theme.layout.compactTouchTarget,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: theme.spacing.sm,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppText
              variant="caption"
              tone="primary"
              style={{ fontFamily: theme.typography.fontFamily.semibold }}
            >
              {copy.undo}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.dismissNotice}
            onPress={onDismiss}
            style={({ pressed }) => ({
              minHeight: theme.layout.compactTouchTarget,
              minWidth: theme.layout.compactTouchTarget,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppIcon
              name="close"
              size={theme.layout.iconSmall}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  message: { flex: 1, minWidth: 0 },
});
