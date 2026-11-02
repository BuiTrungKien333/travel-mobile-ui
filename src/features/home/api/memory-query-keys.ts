export const memoryQueryKeys = {
  all: ["memories"] as const,
  list: (owner: string | undefined, tripId?: string) =>
    ["memories", owner, "list", tripId ?? "all"] as const,
};
