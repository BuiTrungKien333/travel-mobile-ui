import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "../api/maps-hooks";
import { searchDestinations } from "../api/destinations-api";

export function useDestinations(query: string) {
  const search = useDebouncedValue(query.trim());
  return useQuery({ queryKey: ["destinations", search], queryFn: ({ signal }) => searchDestinations(search, signal), staleTime: 300000 });
}
