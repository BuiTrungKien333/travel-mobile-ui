import { svgDataUri } from "@/utils/svg-data-uri";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

/** Static, soft gradients give the sheet depth without an animated blur pass. */
export function WeatherAtmosphere() {
  const theme = useAppTheme();
  const { colors } = theme;
  const uri = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" preserveAspectRatio="none">
      <defs>
        <radialGradient id="mint"><stop stop-color="${colors.weatherAuroraMint}" stop-opacity=".75"/><stop offset="1" stop-color="${colors.weatherAuroraMint}" stop-opacity="0"/></radialGradient>
        <radialGradient id="lavender"><stop stop-color="${colors.weatherAuroraLavender}" stop-opacity=".6"/><stop offset="1" stop-color="${colors.weatherAuroraLavender}" stop-opacity="0"/></radialGradient>
        <radialGradient id="amber"><stop stop-color="${colors.weatherTemperatureWarm}" stop-opacity=".22"/><stop offset="1" stop-color="${colors.weatherTemperatureWarm}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="600" fill="${colors.background}" fill-opacity=".55"/>
      <ellipse cx="30" cy="170" rx="300" ry="230" fill="url(#mint)"/>
      <ellipse cx="380" cy="20" rx="270" ry="340" fill="url(#lavender)"/>
      <ellipse cx="330" cy="580" rx="300" ry="230" fill="url(#amber)"/>
    </svg>`,
  );

  return (
    <View pointerEvents="none" aria-hidden style={StyleSheet.absoluteFill}>
      <Image
        accessible={false}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        cachePolicy="memory"
      />
      <TripGlassBackdrop borderRadius={theme.radius.xl} variant="weather" />
    </View>
  );
}
