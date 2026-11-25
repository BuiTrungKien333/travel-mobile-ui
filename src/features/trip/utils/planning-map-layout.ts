import { layout, spacing } from "@/theme/tokens";

/** Reserve the date strip even when the map takes most of a small screen. */
export function getPlanningMapBounds({
  screenHeight,
  viewportHeight,
  headerHeight,
  selectorHeight,
}: {
  screenHeight: number;
  viewportHeight: number;
  headerHeight: number;
  selectorHeight: number;
}) {
  const available = Math.max(0, viewportHeight - selectorHeight);
  const expanded = Math.min(
    screenHeight * layout.tripPlanningMapExpandedRatio,
    available,
  );

  const minimum =
    headerHeight +
    layout.touchTarget * 2 +
    spacing.xxl +
    layout.compactTouchTarget;

  const collapsed = Math.min(
    expanded,
    Math.max(minimum, screenHeight * layout.tripPlanningMapCollapsedRatio),
    Math.max(0, available - layout.touchTarget),
  );

  return { collapsed, expanded };
}
