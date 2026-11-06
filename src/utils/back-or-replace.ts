import { router, type Href } from "expo-router";

/** Preserve the existing caller and its screen state; deep links need a safe fallback. */
export function backOrReplace(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
