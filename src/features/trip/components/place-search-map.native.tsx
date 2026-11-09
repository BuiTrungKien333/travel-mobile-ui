import type { ComponentProps } from "react";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { PlaceSearchMap as FallbackMap } from "./place-search-map-fallback";

/** Native maps require an explicitly enabled, rebuilt development client. */
export function PlaceSearchMap(props: ComponentProps<typeof FallbackMap>) {
  if (
    UI_PREVIEW_ENABLED ||
    process.env.EXPO_PUBLIC_NATIVE_MAP_ENABLED !== "true"
  )
    return <FallbackMap {...props} />;
  const native: typeof import("./live-place-search-map.native") = require("./live-place-search-map.native");
  return <native.PlaceSearchMap {...props} />;
}
