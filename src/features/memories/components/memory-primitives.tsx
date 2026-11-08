import { Image, type ImageSource } from "expo-image";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from "react-native";
import { router } from "expo-router";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMemoriesCopy } from "../i18n/memories-copy";

export function MemoryIconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: AppIconName;
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: theme.layout.touchTarget,
        minHeight: theme.layout.touchTarget,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.full,
        backgroundColor:
          icon === "back" ? "transparent" : theme.colors.surfaceTint,
        opacity: disabled || pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      <AppIcon name={icon} variant="light" color={theme.colors.primaryText} />
    </Pressable>
  );
}

export function MemoryPage({
  title,
  subtitle,
  children,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  onBack?: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  return (
    <ScreenSafeArea
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            gap: theme.spacing.sm,
            padding: theme.spacing.lg,
            paddingTop: theme.spacing.xl,
            marginBottom: theme.spacing.sm,
            maxWidth: theme.layout.contentMaxWidth,
          },
        ]}
      >
        <MemoryIconButton
          icon="back"
          label={copy.back}
          onPress={
            onBack ??
            (() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/tabs/memories"))
          }
        />
        <View style={[styles.flex, { gap: theme.spacing.xs }]}>
          <AppText accessibilityRole="header" variant="subheading">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" tone="muted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </ScreenSafeArea>
  );
}

export function MemoryEmpty({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children?: ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        alignItems: "center",
        padding: theme.spacing.xxl,
        gap: theme.spacing.lg,
      }}
    >
      <View
        style={{
          padding: theme.spacing.xl,
          borderRadius: theme.radius.xxl,
          backgroundColor: theme.colors.surfaceTint,
        }}
      >
        <AppIcon
          name="memories"
          variant="outline"
          size={theme.layout.iconLarge}
        />
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText tone="muted" style={styles.center}>
        {hint}
      </AppText>
      {children}
    </View>
  );
}

export function MemoryPicture({
  source,
  label,
  aspectRatio = 1,
  contentFit = "cover",
  onLoad,
  retryable = false,
}: {
  source: ImageSource | string | number;
  label: string;
  aspectRatio?: number;
  contentFit?: "cover" | "contain";
  onLoad?: (uri: string) => void;
  retryable?: boolean;
}) {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  return (
    <View
      style={{
        width: "100%",
        aspectRatio,
        backgroundColor: theme.colors.surfaceVariant,
        overflow: "hidden",
      }}
    >
      <Image
        key={attempt}
        source={source}
        accessible
        accessibilityLabel={label}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        style={StyleSheet.absoluteFill}
        onLoad={(event) => {
          setState("loaded");
          onLoad?.(event.source.url);
        }}
        onError={() => setState("error")}
      />
      {state === "loading" ? (
        <ActivityIndicator
          color={theme.colors.primaryText}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {state === "error" && retryable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.photoError}. ${copy.retry}`}
          onPress={() => {
            setState("loading");
            setAttempt((value) => value + 1);
          }}
          style={[
            StyleSheet.absoluteFill,
            {
              minHeight: theme.layout.touchTarget,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.surfaceVariant,
              padding: theme.spacing.sm,
            },
          ]}
        >
          <AppIcon name="cameraGallery" variant="light" />
          <AppText variant="caption" style={styles.center}>
            {copy.retry}
          </AppText>
        </Pressable>
      ) : state === "error" ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.surfaceVariant,
              padding: theme.spacing.sm,
            },
          ]}
        >
          <AppIcon name="cameraGallery" variant="light" />
          <AppText variant="caption" style={styles.center}>
            {copy.photoError}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
  },
  center: { textAlign: "center" },
});
