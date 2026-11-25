import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { placeDiscoveryApi, type PlaceScope } from "./place-discovery-api";
import { placeDiscoveryKeys } from "./place-discovery-query-keys";

export function usePlaceDiscovery(
  scope: PlaceScope,
  search: string,
  locale: "vi" | "en",
  enabled = true,
) {
  const owner = useProfile().data?.id;
  const q = useDebouncedValue(search.trim());
  const query = useInfiniteQuery({
    queryKey: placeDiscoveryKeys.list(owner, scope, q, locale),
    enabled: !!owner && enabled,
    initialPageParam: 0,
    retry: false,
    queryFn: ({ pageParam, signal }) =>
      placeDiscoveryApi.list(scope, q, pageParam, locale, signal),
    getNextPageParam: (page) =>
      page.page + 1 < page.totalPages ? page.page + 1 : undefined,
  });

  return { query, isDebouncing: search.trim() !== q };
}

export function usePlaceDetail(id: string | undefined, locale: "vi" | "en") {
  const owner = useProfile().data?.id;

  return useQuery({
    queryKey: placeDiscoveryKeys.detail(owner, id, locale),
    enabled: !!owner && !!id,
    retry: false,
    queryFn: ({ signal }) => placeDiscoveryApi.detail(id ?? "", locale, signal),
  });
}
