export const weatherQueryKeys = {
  forTrip: (owner: string | undefined, tripId: string) =>
    ["trips", owner, "weather", tripId] as const,
  trip: (
    owner: string | undefined,
    tripId: string | undefined,
    date?: string,
  ) => ["trips", owner, "weather", tripId, date ?? "trip"] as const,
};
