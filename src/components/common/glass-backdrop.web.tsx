import { useAppTheme } from "@/hooks/use-app-theme";

export function GlassBackdrop({
  borderRadius,
  variant = "default",
}: {
  borderRadius: number;
  variant?: "default" | "clock" | "navigation";
}) {
  const theme = useAppTheme();
  const navigation = variant === "navigation";
  const clock = variant === "clock";
  const blur = navigation
    ? theme.glass.navigationBlurRadius
    : clock
      ? theme.glass.clockBlurRadius
      : theme.glass.blurRadius;
  const saturation = clock
    ? theme.glass.clockSaturation
    : theme.glass.saturation;
  const filter = `blur(${blur}px) saturate(${saturation})`;
  const surface = navigation
    ? theme.colors.navigationSurface
    : variant === "clock"
      ? theme.colors.glassClockSurface
      : theme.colors.glassSurface;
  const border = navigation
    ? theme.colors.navigationBorder
    : clock
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
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
      }}
    />
  );
}
