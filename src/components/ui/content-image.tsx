import { useState } from "react";
import { Image, type ImageSource } from "expo-image";
import { StyleSheet, View } from "react-native";
import { AppIcon } from "./app-icon";
import { AppText } from "./app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

/** Parent reserves the image geometry; missing/failed images keep a deliberate fallback. */
export function ContentImage({ source, label, emptyLabel }: {
  source?: ImageSource | string | number | null; label: string; emptyLabel: string;
}) {
  const theme = useAppTheme();
  const [failedSource, setFailedSource] = useState<typeof source>();
  return source && source !== failedSource ? <Image accessible accessibilityLabel={label}
    source={source} contentFit="cover" cachePolicy="memory-disk" style={StyleSheet.absoluteFill}
    onError={() => setFailedSource(source)} /> : <View accessible accessibilityLabel={`${label}, ${emptyLabel}`} style={[
      { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.xs,
        padding: theme.spacing.sm, backgroundColor: theme.colors.surfaceTint },
    ]}>
    <AppIcon name="memories" color={theme.colors.primaryText} />
    <AppText variant="caption" tone="muted" style={{ textAlign: "center" }}>{emptyLabel}</AppText>
  </View>;
}
