import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

const symbols = {
  more: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  edit: { ios: "square.and.pencil", android: "edit", web: "edit" },
  car: { ios: "car", android: "directions_car", web: "directions_car" },
  motorcycle: { ios: "motorcycle", android: "two_wheeler", web: "two_wheeler" },
  walk: {
    ios: "figure.walk",
    android: "directions_walk",
    web: "directions_walk",
  },
  up: { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" },
  down: { ios: "arrow.down", android: "arrow_downward", web: "arrow_downward" },
  drag: {
    ios: "line.3.horizontal",
    android: "drag_handle",
    web: "drag_handle",
  },
  reorder: {
    ios: "arrow.up.arrow.down",
    android: "swap_vert",
    web: "swap_vert",
  },
  home: { ios: "house", android: "home", web: "home" },
  map: { ios: "map", android: "map", web: "map" },
  compass: { ios: "safari", android: "explore", web: "explore" },
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
  pinAdd: {
    ios: "mappin.and.ellipse",
    android: "add_location_alt",
    web: "add_location_alt",
  },
  calendar: {
    ios: "calendar",
    android: "calendar_today",
    web: "calendar_today",
  },
  arrow: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  navigation: {
    ios: "location.north.fill",
    android: "near_me",
    web: "near_me",
  },
  chevron: {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
  plus: { ios: "plus", android: "add", web: "add" },
  minus: { ios: "minus", android: "remove", web: "remove" },
  tick: { ios: "checkmark", android: "check", web: "check" },
  close: { ios: "xmark", android: "close", web: "close" },
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  share: { ios: "square.and.arrow.up", android: "share", web: "share" },
  download: { ios: "arrow.down.to.line", android: "download", web: "download" },
  trash: { ios: "trash", android: "delete_outline", web: "delete_outline" },
  heart: { ios: "heart", android: "favorite_border", web: "favorite_border" },
  heartFilled: { ios: "heart.fill", android: "favorite", web: "favorite" },
  info: { ios: "info.circle", android: "info", web: "info" },
  expand: {
    ios: "arrow.up.left.and.arrow.down.right",
    android: "open_in_full",
    web: "open_in_full",
  },
  collapse: {
    ios: "arrow.down.right.and.arrow.up.left",
    android: "close_fullscreen",
    web: "close_fullscreen",
  },
  locate: {
    ios: "location.viewfinder",
    android: "my_location",
    web: "my_location",
  },
  check: {
    ios: "checkmark.circle.fill",
    android: "check_circle",
    web: "check_circle",
  },
  rain: { ios: "cloud.rain", android: "rainy", web: "rainy" },
  sun: { ios: "sun.max.fill", android: "light_mode", web: "light_mode" },
  cloud: { ios: "cloud.fill", android: "cloud", web: "cloud" },
  umbrella: { ios: "umbrella.fill", android: "umbrella", web: "umbrella" },
  camera: { ios: "camera", android: "photo_camera", web: "photo_camera" },
  tune: { ios: "slider.horizontal.3", android: "tune", web: "tune" },
  bell: { ios: "bell", android: "notifications", web: "notifications" },
  sparkles: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  clock: { ios: "clock", android: "schedule", web: "schedule" },
  flag: { ios: "flag", android: "flag", web: "flag" },
  ticket: {
    ios: "ticket",
    android: "confirmation_number",
    web: "confirmation_number",
  },
} as const satisfies Record<string, ComponentProps<typeof SymbolView>["name"]>;

export type AppIconName = keyof typeof symbols;

const navigationAssets = {
  compass: {
    outline: require("@/assets/icons/navigation/compass-outline.svg"),
    solid: require("@/assets/icons/navigation/compass-solid.svg"),
  },
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
const lightAssets = {
  locate: require("@/assets/icons/navigation/map-locate.svg"),
  expand: require("@/assets/icons/navigation/map-expand.svg"),
  collapse: require("@/assets/icons/navigation/map-collapse.svg"),
  pinAdd: require("@/assets/icons/navigation/plan-pin.svg"),
  camera: require("@/assets/icons/navigation/camera-outline.svg"),
  bell: require("@/assets/icons/navigation/header-bell.svg"),
  person: require("@/assets/icons/navigation/header-person.svg"),
  back: require("@/assets/icons/photo/back.svg"),
  chevron: require("@/assets/icons/photo/next.svg"),
  share: require("@/assets/icons/photo/share.svg"),
  download: require("@/assets/icons/photo/download.svg"),
  trash: require("@/assets/icons/photo/trash.svg"),
  heart: require("@/assets/icons/photo/heart.svg"),
  heartFilled: require("@/assets/icons/photo/heart-filled.svg"),
  info: require("@/assets/icons/photo/info.svg"),
};
function isLightIcon(name: AppIconName): name is keyof typeof lightAssets {
  return (
    name === "locate" ||
    name === "expand" ||
    name === "collapse" ||
    name === "pinAdd" ||
    name === "camera" ||
    name === "bell" ||
    name === "person" ||
    name === "back" ||
    name === "chevron" ||
    name === "share" ||
    name === "download" ||
    name === "trash" ||
    name === "heart" ||
    name === "heartFilled" ||
    name === "info"
  );
}
function isNavigationIcon(
  name: AppIconName,
): name is keyof typeof navigationAssets {
  return (
    name === "compass" ||
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
  variant?: "outline" | "solid" | "light";
}) {
  const theme = useAppTheme();
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.decorative}
    >
      {variant === "light" && isLightIcon(name) ? (
        <Image
          accessible={false}
          source={lightAssets[name]}
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
      ) : variant && variant !== "light" && isNavigationIcon(name) ? (
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
