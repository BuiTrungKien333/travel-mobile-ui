import { useInfiniteQuery } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { destinationQueryKeys, destinationsApi } from "./destinations-api";

export function useDestinationsQuery(search: string, enabled: boolean) {
  const owner = useProfile().data?.id;
  const normalized = search.trim();
  const debounced = useDebouncedValue(normalized);
  const query = useInfiniteQuery({
    queryKey: destinationQueryKeys.list(owner, debounced),
    enabled: enabled && !!owner && debounced.length <= 120,
    initialPageParam: 0,
    staleTime: 5 * 60_000,
    queryFn: ({ pageParam, signal }) =>
      destinationsApi.list(debounced, pageParam, signal),
    getNextPageParam: (page) =>
      page.page + 1 < page.totalPages ? page.page + 1 : undefined,
  });
  return { query, isDebouncing: normalized !== debounced };
}
