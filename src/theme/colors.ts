export const palette = {
  primary50: "#E9F9FA",
  primary100: "#D3F3F6",
  primary200: "#A7E7EC",
  primary300: "#7ADBE3",
  primary400: "#4ECFD9",
  primary500: "#21B5C3",
  primary600: "#1A919C",
  primary700: "#146D75",
  primary800: "#0D484E",
  primary900: "#072427",

  white: "#FFFFFF",
  black: "#000000",

  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  green500: "#22C55E",
  yellow500: "#F59E0B",
  red500: "#EF4444",
  blue500: "#3B82F6",
} as const;

export type AppColorTokens = {
  primary: string;
  primaryPressed: string;
  primaryText: string;
  onPrimary: string;

  secondary: string;
  onSecondary: string;

  background: string;
  surface: string;
  surfaceVariant: string;

  text: string;
  textSecondary: string;
  textDisabled: string;

  border: string;
  borderStrong: string;
  divider: string;
  focus: string;

  success: string;
  successSurface: string;
  onSuccessSurface: string;

  warning: string;
  onWarning: string;
  warningSurface: string;
  onWarningSurface: string;

  error: string;
  errorSurface: string;
  onErrorSurface: string;

  info: string;
  infoSurface: string;
  onInfoSurface: string;

  overlay: string;
  surfaceTint: string;
  heroSurface: string;
  onHero: string;
  onHeroMuted: string;
  navigationSurface: string;
  navigationIndicator: string;
  navigationActive: string;
  navigationInactive: string;
  navigationShadow: string;
  navigationCameraShadow: string;
  navigationFallback: string;
  navigationTint: string;
  navigationBorder: string;
  navigationIndicatorBorder: string;
  weatherSun: string;
  weatherCloud: string;
  weatherTemperatureCool: string;
  weatherTemperatureWarm: string;
  glassSurface: string;
  glassFallback: string;
  glassTint: string;
  glassBorder: string;
  glassInset: string;
  glassGlow: string;
  glassShadow: string;
  glassClockSurface: string;
  glassClockFallback: string;
  glassClockTint: string;
  glassClockInset: string;
  glassClockBorder: string;
  softActionSurface: string;
  softActionPressed: string;
  softActionBorder: string;
  onSoftAction: string;
  gradientActionStart: string;
  gradientActionEnd: string;
  onGradientAction: string;
  stopChipSurface: string;
  achievementWarmSurface: string;
  packingSurface: string;
  weatherDepthShadow: string;
  weatherAuroraMint: string;
  weatherAuroraLavender: string;
  weatherAmberGlass: string;
  weatherAmberBorder: string;
  weatherUmbrellaAccent: string;
  weatherGlassSurface: string;
  weatherGlassFallback: string;
  weatherGlassTint: string;
  weatherRainText: string;
  weatherRainSurface: string;
  journalFrameSurface: string;
  journalFrameBorder: string;
  journalFrameHighlight: string;
  journalFrameShadow: string;
  photoViewerBackdrop: string;
  cameraGlassBorder: string;
  cameraControlSurface: string;
  cameraOverlaySurface: string;
  cameraNavigationSurface: string;
  cameraNavigationActive: string;
  cameraMemoryBadge: string;
  cameraShutterAccent: string;
  photoViewerControls: string;
  photoViewerText: string;
  photoViewerMuted: string;
  photoViewerDanger: string;
  photoViewerBar: string;
  photoViewerButton: string;
  photoGlassSurface: string;
  photoGlassFallback: string;
  photoGlassTint: string;
  photoGlassBorder: string;
  photoControlText: string;
  photoControlMuted: string;
  photoControlDanger: string;
  raisedActionSurface: string;
  raisedActionPressed: string;
  raisedActionBorder: string;
  onRaisedAction: string;
  raisedActionHighlight: string;
};

export const lightColors: AppColorTokens = {
  primary: "#21B5C3",
  primaryPressed: "#1EA6B3",
  primaryText: "#146D75",
  onPrimary: "#052F33",

  secondary: "#FF8A65",
  onSecondary: "#431407",

  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceVariant: "#F1F5F9",

  text: "#0F172A",
  textSecondary: "#475569",
  textDisabled: "#94A3B8",

  // Border dùng để trang trí.
  border: "#E2E8F0",

  // Border của input, checkbox, control...
  borderStrong: "#8795A8",

  divider: "#F1F5F9",
  focus: "#146D75",

  success: "#15803D",
  successSurface: "#DCFCE7",
  onSuccessSurface: "#14532D",

  warning: "#A15C00",
  onWarning: palette.white,
  warningSurface: "#FEF3C7",
  onWarningSurface: "#78350F",

  error: "#B91C1C",
  errorSurface: "#FEE2E2",
  onErrorSurface: "#7F1D1D",

  info: "#1D4ED8",
  infoSurface: "#DBEAFE",
  onInfoSurface: "#1E3A8A",

  overlay: "rgba(15, 23, 42, 0.45)",
  surfaceTint: palette.primary50,
  heroSurface: palette.primary900,
  onHero: palette.white,
  onHeroMuted: palette.primary100,
  navigationSurface: "rgba(255, 255, 255, 0.80)",
  navigationIndicator: "rgba(33, 181, 195, 0.16)",
  navigationActive: palette.primary700,
  navigationInactive: "#365F69",
  navigationShadow: "rgba(13, 72, 78, 0.12)",
  navigationCameraShadow: "rgba(13, 72, 78, 0.26)",
  navigationFallback: "rgba(255, 255, 255, 0.80)",
  navigationTint: "rgba(255, 255, 255, 0.22)",
  navigationBorder: "rgba(255, 255, 255, 0.78)",
  navigationIndicatorBorder: "rgba(33, 181, 195, 0.22)",
  weatherSun: palette.yellow500,
  weatherCloud: palette.gray400,
  weatherTemperatureCool: palette.primary400,
  weatherTemperatureWarm: "#F3C48B",
  glassSurface: "rgba(255, 255, 255, 0.45)",
  glassFallback: "rgba(255, 255, 255, 0.88)",
  glassTint: "rgba(255, 255, 255, 0.20)",
  glassBorder: "rgba(255, 255, 255, 0.45)",
  glassInset: "rgba(255, 255, 255, 0.35)",
  glassGlow: "rgba(33, 181, 195, 0.25)",
  glassShadow: "rgba(13, 72, 78, 0.12)",
  glassClockSurface: "rgba(255, 255, 255, 0.24)",
  glassClockFallback: "rgba(255, 255, 255, 0.36)",
  glassClockTint: "rgba(255, 255, 255, 0.12)",
  glassClockInset: "rgba(255, 255, 255, 0.08)",
  glassClockBorder: "rgba(255, 255, 255, 0.88)",
  softActionSurface: palette.primary100,
  softActionPressed: palette.primary200,
  softActionBorder: palette.primary200,
  onSoftAction: palette.primary800,
  gradientActionStart: palette.primary800,
  gradientActionEnd: "#156068",
  onGradientAction: palette.white,
  stopChipSurface: "rgba(33, 181, 195, 0.10)",
  achievementWarmSurface: "#F9DFA1",
  packingSurface: "rgba(255, 255, 255, 0.74)",
  weatherDepthShadow: "rgba(13, 72, 78, 0.18)",
  weatherAuroraMint: "#91DCD1",
  weatherAuroraLavender: "#B7B9E4",
  weatherAmberGlass: "rgba(245, 158, 11, 0.10)",
  weatherAmberBorder: "rgba(245, 158, 11, 0.30)",
  weatherUmbrellaAccent: "#C87520",
  weatherGlassSurface: "rgba(255, 255, 255, 0.30)",
  weatherGlassFallback: "rgba(255, 255, 255, 0.42)",
  weatherGlassTint: "rgba(255, 255, 255, 0.10)",
  weatherRainText: "#21689B",
  weatherRainSurface: "rgba(77, 159, 220, 0.12)",
  journalFrameSurface: "#E5D3B8",
  journalFrameBorder: "#D6C3A7",
  journalFrameHighlight: "#FAF3E8",
  journalFrameShadow: "rgba(105, 78, 44, 0.18)",
  photoViewerBackdrop: "#000000",
  cameraGlassBorder: "rgba(255, 255, 255, 0.16)",
  cameraControlSurface: "rgba(28, 30, 33, 0.78)",
  cameraOverlaySurface: "rgba(0, 0, 0, 0.4)",
  cameraNavigationSurface: "rgba(38, 44, 48, 0.52)",
  cameraNavigationActive: "rgba(220, 238, 240, 0.16)",
  cameraMemoryBadge: "#FFAE00",
  cameraShutterAccent: "#49DCE2",
  photoViewerControls: "rgba(16, 24, 30, 0.76)",
  photoViewerText: "#FFFFFF",
  photoViewerMuted: "#D5E2E6",
  photoViewerDanger: "#FFAAA2",
  photoViewerBar: "rgba(0, 0, 0, 0.78)",
  photoViewerButton: "rgba(20, 20, 20, 0.64)",
  photoGlassSurface: "rgba(233, 247, 246, 0.84)",
  photoGlassFallback: "rgba(233, 247, 246, 0.94)",
  photoGlassTint: "rgba(214, 239, 239, 0.78)",
  photoGlassBorder: "rgba(255, 255, 255, 0.82)",
  photoControlText: "#163F49",
  photoControlMuted: "#4F6B73",
  photoControlDanger: "#9B444B",
  raisedActionSurface: palette.primary500,
  raisedActionPressed: palette.primary600,
  raisedActionBorder: palette.primary600,
  onRaisedAction: palette.white,
  raisedActionHighlight: "rgba(255, 255, 255, 0.28)",
};

export const darkColors: AppColorTokens = {
  cameraOverlaySurface: "rgba(0, 0, 0, 0.4)",
  cameraControlSurface: "rgba(28, 30, 33, 0.78)",
  cameraNavigationSurface: "rgba(38, 44, 48, 0.52)",
  cameraNavigationActive: "rgba(220, 238, 240, 0.16)",
  cameraMemoryBadge: "#FFAE00",
  cameraShutterAccent: "#49DCE2",
  cameraGlassBorder: "rgba(255, 255, 255, 0.16)",
  primary: "#4ECFD9",
  primaryPressed: "#21B5C3",
  primaryText: "#7ADBE3",
  onPrimary: "#052F33",

  secondary: "#FFAB91",
  onSecondary: "#431407",

  background: "#081315",
  surface: "#102024",
  surfaceVariant: "#192C30",

  text: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textDisabled: "#64748B",

  border: "#2B4146",
  borderStrong: "#52747A",

  divider: "#1F3438",
  focus: "#7ADBE3",

  success: "#4ADE80",
  successSurface: "#123524",
  onSuccessSurface: "#BBF7D0",

  warning: "#FBBF24",
  onWarning: "#3A2A05",
  warningSurface: "#3A2A05",
  onWarningSurface: "#FDE68A",

  error: "#F87171",
  errorSurface: "#3B171B",
  onErrorSurface: "#FECACA",

  info: "#60A5FA",
  infoSurface: "#132A4F",
  onInfoSurface: "#BFDBFE",

  overlay: "rgba(0, 0, 0, 0.65)",
  surfaceTint: palette.primary900,
  heroSurface: palette.primary900,
  onHero: palette.white,
  onHeroMuted: palette.primary100,
  navigationSurface: "rgba(16, 32, 36, 0.88)",
  navigationIndicator: "rgba(78, 207, 217, 0.18)",
  navigationActive: palette.primary200,
  navigationInactive: "#B2CFD4",
  navigationShadow: "rgba(0, 0, 0, 0.20)",
  navigationCameraShadow: "rgba(0, 0, 0, 0.36)",
  navigationFallback: "rgba(16, 32, 36, 0.96)",
  navigationTint: "rgba(16, 32, 36, 0.42)",
  navigationBorder: "rgba(167, 231, 236, 0.20)",
  navigationIndicatorBorder: "rgba(78, 207, 217, 0.26)",
  weatherSun: palette.yellow500,
  weatherCloud: palette.gray300,
  weatherTemperatureCool: palette.primary400,
  weatherTemperatureWarm: "#F3C48B",
  glassSurface: "rgba(16, 32, 36, 0.80)",
  glassFallback: "rgba(16, 32, 36, 0.95)",
  glassTint: "rgba(16, 32, 36, 0.42)",
  glassBorder: "rgba(255, 255, 255, 0.20)",
  glassInset: "rgba(255, 255, 255, 0.08)",
  glassGlow: "rgba(78, 207, 217, 0.24)",
  glassShadow: "rgba(0, 0, 0, 0.20)",
  glassClockSurface: "rgba(16, 32, 36, 0.48)",
  glassClockFallback: "rgba(16, 32, 36, 0.68)",
  glassClockTint: "rgba(16, 32, 36, 0.24)",
  glassClockInset: "rgba(255, 255, 255, 0.04)",
  glassClockBorder: "rgba(255, 255, 255, 0.24)",
  softActionSurface: palette.primary900,
  softActionPressed: palette.primary800,
  softActionBorder: palette.primary700,
  onSoftAction: palette.primary100,
  gradientActionStart: palette.primary800,
  gradientActionEnd: "#156068",
  onGradientAction: palette.white,
  stopChipSurface: "rgba(78, 207, 217, 0.10)",
  achievementWarmSurface: "#5C3C13",
  packingSurface: "rgba(16, 32, 36, 0.74)",
  weatherDepthShadow: "rgba(0, 0, 0, 0.28)",
  weatherAuroraMint: "#235E61",
  weatherAuroraLavender: "#464568",
  weatherAmberGlass: "rgba(245, 158, 11, 0.12)",
  weatherAmberBorder: "rgba(251, 191, 36, 0.30)",
  weatherUmbrellaAccent: "#F3C48B",
  weatherGlassSurface: "rgba(16, 32, 36, 0.38)",
  weatherGlassFallback: "rgba(16, 32, 36, 0.66)",
  weatherGlassTint: "rgba(16, 32, 36, 0.12)",
  weatherRainText: "#9ACDF0",
  weatherRainSurface: "rgba(77, 159, 220, 0.16)",
  journalFrameSurface: "#5C4D39",
  journalFrameBorder: "#827055",
  journalFrameHighlight: "#A28B69",
  journalFrameShadow: "rgba(0, 0, 0, 0.24)",
  photoViewerBackdrop: "#000000",
  photoViewerControls: "rgba(16, 24, 30, 0.76)",
  photoViewerText: "#FFFFFF",
  photoViewerMuted: "#D5E2E6",
  photoViewerDanger: "#FFAAA2",
  photoViewerBar: "rgba(0, 0, 0, 0.78)",
  photoViewerButton: "rgba(20, 20, 20, 0.64)",
  photoGlassSurface: "rgba(233, 247, 246, 0.84)",
  photoGlassFallback: "rgba(233, 247, 246, 0.94)",
  photoGlassTint: "rgba(214, 239, 239, 0.78)",
  photoGlassBorder: "rgba(255, 255, 255, 0.82)",
  photoControlText: "#163F49",
  photoControlMuted: "#4F6B73",
  photoControlDanger: "#9B444B",
  raisedActionSurface: palette.primary600,
  raisedActionPressed: palette.primary700,
  raisedActionBorder: palette.primary700,
  onRaisedAction: palette.white,
  raisedActionHighlight: "rgba(255, 255, 255, 0.20)",
};
