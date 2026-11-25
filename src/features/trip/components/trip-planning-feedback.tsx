import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

export function TripPlanningLoadingCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surfaceTint,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surface,
        }}
      >
        <ActivityIndicator
          color={theme.colors.primaryText}
          accessibilityLabel={title}
        />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="body" tone="muted">
          {message}
        </AppText>
      </View>
    </View>
  );
}

export function TripPlanningErrorCard({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.errorSurface,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: theme.spacing.md,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.surface,
          }}
        >
          <AppIcon
            name="info"
            size={theme.layout.iconSmall}
            color={theme.colors.error}
          />
        </View>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="label" tone="error">
            {title}
          </AppText>
          <AppText variant="body" tone="error">
            {message}
          </AppText>
        </View>
      </View>
      {children ? (
        <View style={{ gap: theme.spacing.sm }}>{children}</View>
      ) : null}
    </View>
  );
}
