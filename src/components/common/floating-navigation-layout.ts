import type { layout } from "@/theme/tokens";

type NavigationMetricTokens = Pick<
  typeof layout,
  | "tabBarHeight"
  | "tabBarPadding"
  | "tabBarCameraSize"
  | "tabBarCameraSideSpacing"
  | "tabBarGroupGap"
  | "tabBarOuterTabOffset"
  | "touchTarget"
  | "compactTouchTarget"
>;

type NavigationMetrics = { [Key in keyof NavigationMetricTokens]: number };

/** Frame coordinates shared by Yoga, the browser and the active marker. */
export function floatingNavigationLayout(
  width: number,
  metrics: NavigationMetrics,
) {
  const rowWidth = Math.max(0, width - metrics.tabBarPadding * 2);
  const groupGap = Math.max(0, metrics.tabBarGroupGap);
  const preferredSlot =
    metrics.tabBarCameraSize + metrics.tabBarCameraSideSpacing * 2;
  const itemWidth =
    rowWidth >= preferredSlot + metrics.touchTarget * 4 + groupGap * 2
      ? metrics.touchTarget
      : metrics.compactTouchTarget;
  const baseGroupWidth = itemWidth * 2 + groupGap;
  const cameraSlotWidth = Math.min(
    preferredSlot,
    Math.max(0, rowWidth - baseGroupWidth * 2),
  );
  const sideWidth = (rowWidth - cameraSlotWidth) / 2;
  const left = sideWidth - baseGroupWidth;
  const right = sideWidth + cameraSlotWidth;
  // Move only the outer tabs, keeping the camera's adjacent controls in place.
  const outerOffset = Math.min(metrics.tabBarOuterTabOffset, Math.max(0, left));

  return {
    barHeight: Math.max(
      metrics.tabBarHeight,
      metrics.compactTouchTarget + metrics.tabBarPadding * 2,
      metrics.tabBarCameraSize + metrics.tabBarPadding * 2,
    ),
    itemWidth,
    groupGap: groupGap + outerOffset,
    groupWidth: baseGroupWidth + outerOffset,
    groupLeft: [left - outerOffset, right] as const,
    tabLeft: [
      left - outerOffset,
      left + itemWidth + groupGap,
      right,
      right + itemWidth + groupGap + outerOffset,
    ] as const,
    cameraLeft: (width - metrics.tabBarCameraSize) / 2,
  };
}
