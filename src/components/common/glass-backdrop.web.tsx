import { useAppTheme } from "@/hooks/use-app-theme";

export function GlassBackdrop({
  borderRadius,
  variant = "default",
}: {
  borderRadius: number;
  variant?:
    | "default"
    | "clock"
    | "navigation"
    | "weather"
    | "photo"
    | "camera"
    | "camera-overlay"
    | "camera-navigation";
}) {
  const theme = useAppTheme();
  const navigation = variant === "navigation";
  const clock = variant === "clock";
  const weather = variant === "weather";
  const photo = variant === "photo";
  const cameraNavigation = variant === "camera-navigation";
  const cameraOverlay = variant === "camera-overlay";
  const camera = variant === "camera" || cameraNavigation || cameraOverlay;
  const blur = camera
    ? theme.glass.navigationBlurRadius
    : photo
      ? theme.glass.photoBlurRadius
      : navigation
        ? theme.glass.navigationBlurRadius
        : weather
          ? theme.glass.weatherBlurRadius
          : clock
            ? theme.glass.clockBlurRadius
            : theme.glass.blurRadius;

  const saturation = weather
    ? theme.glass.weatherSaturation
    : clock
      ? theme.glass.clockSaturation
      : theme.glass.saturation;
  const filter = `blur(${blur}px) saturate(${saturation})`;
  const surface = camera
    ? cameraNavigation
      ? theme.colors.cameraNavigationSurface
      : cameraOverlay
        ? theme.colors.cameraOverlaySurface
        : theme.colors.cameraControlSurface
    : photo
      ? theme.colors.photoGlassSurface
      : navigation
        ? theme.colors.navigationSurface
        : weather
          ? theme.colors.weatherGlassSurface
          : clock
            ? theme.colors.glassClockSurface
            : theme.colors.glassSurface;

  const border = camera
    ? theme.colors.cameraGlassBorder
    : photo
      ? theme.colors.photoGlassBorder
      : navigation
        ? theme.colors.navigationBorder
        : clock || weather
          ? theme.colors.glassClockBorder
          : theme.colors.glassBorder;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius,
        border: `1px solid ${border}`,
        backgroundColor: surface,
        backgroundImage:
          variant === "camera" || cameraNavigation
            ? `linear-gradient(160deg, ${theme.colors.cameraGlassBorder}, transparent 45%)`
            : undefined,
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
      }}
    />
  );
}
