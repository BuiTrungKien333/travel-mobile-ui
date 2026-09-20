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
};
