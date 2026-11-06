import type { PlaceScope } from "./place-discovery-api";
export const placeDiscoveryKeys = {
  root: ["place-discovery"] as const,
  list: (
    owner: string | undefined,
    scope: PlaceScope,
    q: string,
    locale: string,
  ) => ["place-discovery", owner, "list", scope, q, locale] as const,
  detail: (owner: string | undefined, id: string | undefined, locale: string) =>
    ["place-discovery", owner, "detail", id, locale] as const,
};
