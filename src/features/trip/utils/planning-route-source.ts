/** Stored drafts from the first release used Haversine before route metadata reached the UI. */
export function planningRouteSource(metadata?: Record<string, string>) {
  if (metadata?.routeStatus === "UNREACHABLE") return "UNREACHABLE";
  if (metadata?.routeSource === "MAPBOX_DRIVING") return "ROAD";
  if (metadata?.routeSource === "NOT_CALCULATED") return "NOT_CALCULATED";
  return "ESTIMATED";
}
