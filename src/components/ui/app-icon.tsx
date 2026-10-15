import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

const symbols = {
  home: { ios: "house", android: "home", web: "home" },
  map: { ios: "map", android: "map", web: "map" },
  trips: { ios: "suitcase.rolling", android: "luggage", web: "luggage" },
  memories: {
    ios: "photo.on.rectangle",
    android: "photo_library",
    web: "photo_library",
  },
  person: {
    ios: "person.crop.circle",
    android: "account_circle",
    web: "account_circle",
  },
  route: {
    ios: "point.topleft.down.to.point.bottomright.curvepath",
    android: "route",
    web: "route",
  },
  pin: {
    ios: "mappin.and.ellipse",
    android: "location_on",
    web: "location_on",
  },
  calendar: {
    ios: "calendar",
    android: "calendar_today",
    web: "calendar_today",
  },
  arrow: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  chevron: {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
  plus: { ios: "plus", android: "add", web: "add" },
  close: { ios: "xmark", android: "close", web: "close" },
  check: {
    ios: "checkmark.circle.fill",
    android: "check_circle",
    web: "check_circle",
  },
  rain: { ios: "cloud.rain", android: "rainy", web: "rainy" },
  sun: { ios: "sun.max.fill", android: "light_mode", web: "light_mode" },
  cloud: { ios: "cloud.fill", android: "cloud", web: "cloud" },
  camera: { ios: "camera", android: "photo_camera", web: "photo_camera" },
  tune: { ios: "slider.horizontal.3", android: "tune", web: "tune" },
  sparkles: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  clock: { ios: "clock", android: "schedule", web: "schedule" },
  flag: { ios: "flag", android: "flag", web: "flag" },
} as const satisfies Record<string, ComponentProps<typeof SymbolView>["name"]>;

export type AppIconName = keyof typeof symbols;

const navigationAssets = {
  home: {
    outline: require("@/assets/icons/navigation/home-outline.svg"),
    solid: require("@/assets/icons/navigation/home-solid.svg"),
  },
  map: {
    outline: require("@/assets/icons/navigation/map-outline.svg"),
    solid: require("@/assets/icons/navigation/map-solid.svg"),
  },
  memories: {
    outline: require("@/assets/icons/navigation/memories-outline.svg"),
    solid: require("@/assets/icons/navigation/memories-solid.svg"),
  },
  person: {
    outline: require("@/assets/icons/navigation/person-outline.svg"),
    solid: require("@/assets/icons/navigation/person-solid.svg"),
  },
};
function isNavigationIcon(
  name: AppIconName,
): name is keyof typeof navigationAssets {
  return (
    name === "home" ||
    name === "map" ||
    name === "memories" ||
    name === "person"
  );
}

/** The surrounding control/text supplies the accessible name. */
export function AppIcon({
  name,
  color,
  size,
  variant,
}: {
  name: AppIconName;
  color?: ComponentProps<typeof SymbolView>["tintColor"];
  size?: number;
  variant?: "outline" | "solid";
}) {
  const theme = useAppTheme();
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.decorative}
    >
      {variant && isNavigationIcon(name) ? (
        <Image
          accessible={false}
          source={navigationAssets[name][variant]}
          tintColor={
            typeof color === "string" ? color : theme.colors.primaryText
          }
          contentFit="contain"
          cachePolicy="memory"
          style={{
            width: size ?? theme.layout.iconMedium,
            height: size ?? theme.layout.iconMedium,
          }}
        />
      ) : (
        <SymbolView
          accessible={false}
          name={symbols[name]}
          size={size ?? theme.layout.iconMedium}
          tintColor={color ?? theme.colors.primaryText}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ decorative: { pointerEvents: "none" } });
