import { useId } from "react";

import { useAppTheme } from "@/hooks/use-app-theme";
import { navigationBarShape } from "./navigation-bar-shape";

export function NotchedNavigationBackdrop({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const theme = useAppTheme();
  const filterId = useId().replace(/:/g, "");
  if (!width) return null;
  const path = navigationBarShape({
    width,
    height,
    cameraSize: theme.layout.tabBarCameraSize,
    cameraRise: theme.layout.tabBarCameraRise,
    padding: theme.layout.tabBarPadding,
    gap: theme.layout.tabBarNotchGap,
    shoulder: theme.layout.tabBarNotchShoulder,
  });
  const shadow = theme.elevation.floating;
  const bleed = shadow.blurRadius;
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <svg
        width={width + bleed * 2}
        height={height + bleed * 2}
        viewBox={`${-bleed} ${-bleed} ${width + bleed * 2} ${height + bleed * 2}`}
        style={{ position: "absolute", left: -bleed, top: -bleed }}
      >
        <defs>
          <filter id={filterId} x="-50%" y="-100%" width="200%" height="300%">
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation={shadow.blurRadius / 2}
              result="blur"
            />
            <feOffset
              in="blur"
              dx={shadow.offsetX}
              dy={shadow.offsetY}
              result="offset"
            />
            <feFlood floodColor={theme.colors.navigationShadow} />
            <feComposite in2="offset" operator="in" />
          </filter>
        </defs>
        <path
          d={path}
          fill={theme.colors.navigationSurface}
          filter={`url(#${filterId})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `path('${path}')`,
          backgroundColor: theme.colors.navigationSurface,
          backdropFilter: `blur(${theme.glass.navigationBlurRadius}px) saturate(${theme.glass.saturation})`,
          WebkitBackdropFilter: `blur(${theme.glass.navigationBlurRadius}px) saturate(${theme.glass.saturation})`,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={path}
          fill="none"
          stroke={theme.colors.navigationBorder}
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
