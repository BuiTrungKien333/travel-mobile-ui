export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

export const layout = {
  contentMaxWidth: 560,
  touchTarget: 48,
  iconSmall: 18,
  iconMedium: 22,
  iconLarge: 28,
  heroImageHeight: 156,
  firstTripIconFrameSize: 56,
  sampleStopImageSize: 64,
  sampleStopNumberSize: 24,
  compactTextActionPaddingVertical: 10,
  weatherArtworkSize: 40,
  headerLogoWidth: 120,
  headerLogoHeight: 40,
  tabBarHeight: 60,
  tabBarMaxWidth: 480,
  tabBarPadding: 6,
  tabBarIconSize: 20,
  tabBarItemPaddingVertical: 6,
} as const;

export const motion = {
  enterDuration: 280,
  pressOpacity: 0.72,
  tabTransitionDuration: 240,
  weatherDriftDuration: 2600,
} as const;

export const elevation = {
  floating: { offsetX: 0, offsetY: 4, blurRadius: 16, spreadDistance: 0 },
} as const;

export const typography = {
  fontFamily: {
    regular: "Roboto_400Regular",
    medium: "Roboto_500Medium",
    semibold: "Roboto_600SemiBold",
    bold: "Roboto_700Bold",
  },

  fontSize: {
    navigationLabel: 11,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 32,
  },

  lineHeight: {
    navigationLabel: 14,
    xs: 16,
    sm: 20,
    md: 24,
    lg: 26,
    xl: 28,
    xxl: 32,
    display: 40,
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;
