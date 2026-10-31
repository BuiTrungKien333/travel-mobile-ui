export const tripQueryKeys = {
  all: ["trips"] as const,
  list: () => [...tripQueryKeys.all, "list"] as const,
  detail: (tripId: string) => [...tripQueryKeys.all, "detail", tripId] as const,
  places: (tripId: string) => [...tripQueryKeys.all, "places", tripId] as const,
  itinerary: (tripId: string) => [...tripQueryKeys.all, "itinerary", tripId] as const,
};
