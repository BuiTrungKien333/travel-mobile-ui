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
  navigationFallback: string;
  navigationTint: string;
  navigationBorder: string;
  navigationIndicatorBorder: string;
  weatherSun: string;
  weatherCloud: string;
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
  navigationSurface: "rgba(255, 255, 255, 0.82)",
  navigationIndicator: "rgba(33, 181, 195, 0.16)",
  navigationActive: palette.primary800,
  navigationInactive: "#365F69",
  navigationShadow: "rgba(13, 72, 78, 0.12)",
  navigationFallback: "rgba(255, 255, 255, 0.94)",
  navigationTint: "rgba(255, 255, 255, 0.36)",
  navigationBorder: "rgba(255, 255, 255, 0.78)",
  navigationIndicatorBorder: "rgba(33, 181, 195, 0.22)",
  weatherSun: palette.yellow500,
  weatherCloud: palette.gray400,
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
  raisedActionSurface: palette.primary500,
  raisedActionPressed: palette.primary600,
  raisedActionBorder: palette.primary600,
  onRaisedAction: palette.white,
  raisedActionHighlight: "rgba(255, 255, 255, 0.28)",
};

export const darkColors: AppColorTokens = {
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
  navigationFallback: "rgba(16, 32, 36, 0.96)",
  navigationTint: "rgba(16, 32, 36, 0.42)",
  navigationBorder: "rgba(167, 231, 236, 0.20)",
  navigationIndicatorBorder: "rgba(78, 207, 217, 0.26)",
  weatherSun: palette.yellow500,
  weatherCloud: palette.gray300,
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
  raisedActionSurface: palette.primary600,
  raisedActionPressed: palette.primary700,
  raisedActionBorder: palette.primary700,
  onRaisedAction: palette.white,
  raisedActionHighlight: "rgba(255, 255, 255, 0.20)",
};
