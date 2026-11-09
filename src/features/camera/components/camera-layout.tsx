import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useIsFocused } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useCameraCopy } from "../i18n/camera-copy";
import { CameraIconButton } from "./camera-icon-button";

export type CameraLayoutProps = {
  title: string;
  count: number;
  onBack: () => void;
  onDetails: () => void;
  onHome: () => void;
  onJournal: () => void;
  embeddedBottomInset?: number;
  journalLabel?: string;
  subtitle?: string;
  onSelectTrip?: () => void;
  hideJournal?: boolean;
  bottomNavigation?: ReactNode;
};

export function CameraLayout({
  title,
  count,
  onBack,
  onDetails,
  onHome,
  onJournal,
  embeddedBottomInset,
  journalLabel,
  subtitle,
  onSelectTrip,
  hideJournal = false,
  bottomNavigation,
  frame,
  frameControls,
  onCapture,
  onLibrary,
  onFlip,
  onRetake,
  busy = false,
  pending = false,
  canCapture = false,
  status,
  error,
  overlay,
}: CameraLayoutProps & {
  frame: ReactNode;
  frameControls?: ReactNode;
  onCapture?: () => void;
  onLibrary?: () => void;
  onFlip?: () => void;
  onRetake?: () => void;
  busy?: boolean;
  pending?: boolean;
  canCapture?: boolean;
  status?: string;
  error?: string;
  overlay?: ReactNode;
}) {
  const theme = useAppTheme();
  const focused = useIsFocused();
  const embedded = embeddedBottomInset !== undefined;
  const textColor = theme.colors.photoViewerText;
  const mutedColor = theme.colors.photoViewerMuted;
  const { copy } = useCameraCopy();
  const insets = useScreenInsets();
  const { width } = useWindowDimensions();
  const size = Math.min(
    width - insets.left - insets.right - theme.layout.cameraFrameSideInset * 2,
    theme.layout.cameraContentMaxWidth - theme.layout.cameraFrameSideInset * 2,
  );
  const scale = useSharedValue(1);
  const shutterMotion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  const spring = {
    ...theme.motion.photoViewerSpring,
    reduceMotion: ReduceMotion.System,
  };
  return (
    <ScreenSafeArea
      edges={embedded ? ["top", "left", "right"] : undefined}
      style={{
        flex: 1,
        backgroundColor: theme.colors.photoViewerBackdrop,
      }}
    >
      {focused ? <StatusBar style="light" /> : null}
      <View
        style={{
          width: "100%",
          maxWidth: theme.layout.cameraContentMaxWidth,
          alignSelf: "center",
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <CameraIconButton
          size="header"
          icon="back"
          label={copy.back}
          onPress={onBack}
          disabled={busy}
        />
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <Pressable
            accessibilityRole={onSelectTrip ? "button" : undefined}
            accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
            disabled={!onSelectTrip || busy}
            onPress={onSelectTrip}
            style={({ pressed }) => ({
              flexShrink: 1,
              maxWidth: "100%",
              minWidth: 0,
              overflow: "hidden",
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              minHeight: theme.layout.compactTouchTarget,
              borderRadius: theme.radius.full,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: theme.spacing.sm,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <GlassBackdrop variant="camera" borderRadius={theme.radius.full} />
            <View style={{ flexShrink: 1, alignItems: "center" }}>
              <AppText
                numberOfLines={1}
                accessibilityRole="header"
                variant="caption"
                style={{
                  color: textColor,
                  fontSize: theme.typography.fontSize.sm,
                  lineHeight: theme.typography.lineHeight.sm,
                }}
              >
                {title}
              </AppText>
            </View>
            {onSelectTrip ? (
              <AppIcon
                name="chevron"
                variant="light"
                size={theme.layout.iconSmall}
                color={mutedColor}
              />
            ) : null}
          </Pressable>
        </View>
        <View
          accessible={false}
          style={{
            width: theme.layout.compactTouchTarget,
          }}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "space-evenly",
          gap: theme.spacing.xl,
          paddingVertical: theme.spacing.xl,
          paddingBottom: embedded
            ? embeddedBottomInset + theme.spacing.lg
            : theme.spacing.xl,
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: theme.layout.cameraViewfinderRadius,
            borderCurve: "continuous",
            overflow: "hidden",
            backgroundColor: theme.colors.photoViewerButton,
          }}
        >
          {frame}
          {frameControls}
        </View>
        <View
          style={{
            width: size - theme.spacing.lg * 2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            gap: theme.spacing.lg,
          }}
        >
          <CameraIconButton
            size="large"
            icon={pending ? "back" : "cameraGallery"}
            label={pending ? copy.retake : copy.gallery}
            disabled={busy || !(pending ? onRetake : onLibrary)}
            onPress={() => (pending ? onRetake?.() : onLibrary?.())}
          />
          <Animated.View style={shutterMotion}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={pending ? copy.save : copy.capture}
              accessibilityState={{ disabled: busy || !canCapture, busy }}
              disabled={busy || !canCapture}
              onPress={onCapture}
              onPressIn={() =>
                scale.set(withSpring(theme.motion.shutterPressScale, spring))
              }
              onPressOut={() => scale.set(withSpring(1, spring))}
              style={{
                width: theme.layout.cameraShutterSize,
                height: theme.layout.cameraShutterSize,
                borderRadius: theme.radius.full,
                borderWidth: theme.layout.cameraShutterBorderWidth,
                borderColor: theme.colors.cameraShutterAccent,
                padding: theme.layout.cameraShutterInset,
                opacity: !canCapture ? theme.motion.packingReminderOpacity : 1,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.photoViewerText,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {busy ? (
                  <ActivityIndicator color={theme.colors.primaryText} />
                ) : pending ? (
                  <AppIcon
                    name="tick"
                    size={theme.layout.iconLarge}
                    color={theme.colors.primaryText}
                  />
                ) : null}
              </View>
            </Pressable>
          </Animated.View>
          <CameraIconButton
            size="large"
            icon="cameraRotate"
            label={copy.flip}
            disabled={busy || pending || !onFlip}
            onPress={() => onFlip?.()}
          />
        </View>
        {error || status ? (
          <AppText
            accessibilityRole={error ? "alert" : undefined}
            accessibilityLiveRegion="polite"
            variant="caption"
            style={{
              color: error ? theme.colors.photoViewerDanger : mutedColor,
              textAlign: "center",
              maxWidth: size,
            }}
          >
            {error || status}
          </AppText>
        ) : null}
        {!hideJournal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            onPress={onJournal}
            disabled={busy}
            style={{
              minHeight: theme.layout.compactTouchTarget,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.xs,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs + theme.spacing.xxs,
                borderRadius: theme.radius.lg,
                overflow: "hidden",
              }}
            >
              <GlassBackdrop variant="camera" borderRadius={theme.radius.lg} />
              <View
                style={{
                  minWidth: theme.spacing.xl,
                  minHeight: theme.spacing.xl,
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: theme.spacing.xxs,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.cameraMemoryBadge,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: theme.colors.photoViewerBackdrop,
                  }}
                >
                  {count}
                </AppText>
              </View>
              <AppText variant="caption" style={{ color: textColor }}>
                {journalLabel ?? copy.journal}
              </AppText>
              <View style={{ transform: [{ rotate: "90deg" }] }}>
                <AppIcon
                  name="chevron"
                  variant="light"
                  size={theme.layout.iconSmall}
                  color={mutedColor}
                />
              </View>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
      {bottomNavigation}
      {!embedded ? (
        <View
          style={{
            marginBottom: theme.spacing.xl,
            alignSelf: "center",
            width: Math.min(
              width - insets.left - insets.right - theme.spacing.lg * 2,
              theme.layout.cameraNavigationWidth,
            ),
            borderRadius: theme.radius.full,
            overflow: "hidden",
            flexDirection: "row",
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <GlassBackdrop
            variant="camera-navigation"
            borderRadius={theme.radius.full}
          />
          {(
            [
              { icon: "compass", label: copy.details, onPress: onDetails },
              { icon: "home", label: copy.home, onPress: onHome },
              { icon: "memories", label: copy.journal, onPress: onJournal },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.icon}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              disabled={busy}
              onPress={item.onPress}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: theme.layout.compactTouchTarget,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.full,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <View
                style={{
                  width: "100%",
                  minHeight: theme.layout.touchTarget,
                  borderRadius: theme.radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: theme.spacing.xs,
                  backgroundColor:
                    item.icon === "home"
                      ? theme.colors.cameraNavigationActive
                      : undefined,
                }}
              >
                <AppIcon
                  name={item.icon}
                  variant={item.icon === "home" ? "solid" : "outline"}
                  size={theme.layout.iconMedium}
                  color={
                    item.icon === "home"
                      ? theme.colors.photoViewerText
                      : theme.colors.photoViewerMuted
                  }
                />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      {overlay}
    </ScreenSafeArea>
  );
}
