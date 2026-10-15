import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  type Theme as NavigationTheme,
} from "expo-router/react-navigation";

import { darkColors, lightColors, type AppColorTokens } from "./colors";
import {
  elevation,
  glass,
  layout,
  motion,
  radius,
  spacing,
  typography,
} from "./tokens";

export type AppTheme = Omit<NavigationTheme, "colors"> & {
  colors: NavigationTheme["colors"] & AppColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  layout: typeof layout;
  motion: typeof motion;
  elevation: typeof elevation;
  glass: typeof glass;
};

export const lightTheme: AppTheme = {
  ...NavigationLightTheme,

  colors: {
    ...NavigationLightTheme.colors,
    ...lightColors,

    card: lightColors.surface,
    notification: lightColors.error,
  },

  spacing,
  radius,
  typography,
  layout,
  motion,
  elevation,
  glass,
};

export const darkTheme: AppTheme = {
  ...NavigationDarkTheme,

  colors: {
    ...NavigationDarkTheme.colors,
    ...darkColors,

    card: darkColors.surface,
    notification: darkColors.error,
  },

  spacing,
  radius,
  typography,
  layout,
  motion,
  elevation,
  glass,
};
