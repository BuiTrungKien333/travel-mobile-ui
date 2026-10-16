import { Image } from "expo-image";

import { useAppTheme } from "@/hooks/use-app-theme";
import { navigationBarShape } from "./navigation-bar-shape";

/** SVG leaves the cradle transparent on native without a mask dependency. */
export function NotchedNavigationBackdrop({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const theme = useAppTheme();
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width + bleed * 2}" height="${height + bleed * 2}" viewBox="${-bleed} ${-bleed} ${width + bleed * 2} ${height + bleed * 2}"><defs><filter id="shadow" x="-50%" y="-100%" width="200%" height="300%"><feDropShadow dx="${shadow.offsetX}" dy="${shadow.offsetY}" stdDeviation="${shadow.blurRadius / 2}" flood-color="${theme.colors.navigationShadow}"/></filter></defs><path d="${path}" fill="${theme.colors.navigationFallback}" stroke="${theme.colors.navigationBorder}" stroke-width="1" filter="url(#shadow)"/></svg>`;
  return (
    <Image
      accessible={false}
      pointerEvents="none"
      source={{
        uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      }}
      contentFit="fill"
      style={{
        position: "absolute",
        left: -bleed,
        top: -bleed,
        width: width + bleed * 2,
        height: height + bleed * 2,
      }}
    />
  );
}
