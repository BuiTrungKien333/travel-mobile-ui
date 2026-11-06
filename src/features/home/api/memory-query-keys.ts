export const memoryQueryKeys = {
  all: ["memories"] as const,
  list: (tripId?: string) => [...memoryQueryKeys.all, "list", tripId ?? "all"] as const,
};
