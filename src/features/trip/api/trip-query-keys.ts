export const tripQueryKeys = {
  root: ["trips"] as const,
  list: (owner: string | undefined) => ["trips", owner, "list"] as const,
  detail: (owner: string | undefined, id: string | undefined) =>
    ["trips", owner, "detail", id] as const,
  places: (owner: string | undefined, id: string | undefined) =>
    ["trips", owner, "places", id] as const,
  itinerary: (owner: string | undefined, id: string | undefined) =>
    ["trips", owner, "itinerary", id] as const,
};
