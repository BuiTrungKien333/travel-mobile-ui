import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-error";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: (count, error) => count < 1 && error instanceof ApiError &&
        (error.code === "NETWORK" || error.code === "TIMEOUT" || (error.status ?? 0) >= 500),
    },
    mutations: { retry: false },
  },
});
