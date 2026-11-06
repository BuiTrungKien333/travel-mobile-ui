import { useAppTheme } from "@/hooks/use-app-theme";
import { NavigationBarSurface } from "./navigation-bar-surface";

export function NotchedNavigationBackdrop({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const theme = useAppTheme();
  return (
    <NavigationBarSurface
      width={width}
      height={height}
      renderBackdrop={(path) => (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            clipPath: `path('${path}')`,
            backdropFilter: `blur(${theme.glass.navigationBlurRadius}px) saturate(${theme.glass.saturation})`,
            WebkitBackdropFilter: `blur(${theme.glass.navigationBlurRadius}px) saturate(${theme.glass.saturation})`,
          }}
        />
      )}
    />
  );
}
