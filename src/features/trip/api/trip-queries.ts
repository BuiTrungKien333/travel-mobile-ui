import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { tripApi } from "./trip-api";
import { authSession } from "@/features/auth/services/auth-session";
import { ApiError } from "@/services/api/api-error";
import type {
  CreateTripPayload,
  UpdateTripPayload,
  DatePreviewRequest,
  TripReadDto,
} from "./trip-contract";
import { memoryQueryKeys } from "@/features/home/api/memory-query-keys";
import { weatherQueryKeys } from "@/features/weather/api/weather-query-keys";

import { tripQueryKeys } from "./trip-query-keys";
import { nextTravelDayRefreshDelay } from "@/utils/calendar-date";
export { tripQueryKeys } from "./trip-query-keys";

export function useTripsQuery() {
  const owner = useProfile().data?.id;
  return useInfiniteQuery({
    queryKey: tripQueryKeys.list(owner),
    enabled: !!owner,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => tripApi.list(pageParam, signal),
    getNextPageParam: (page) =>
      page.page + 1 < page.totalPages ? page.page + 1 : undefined,
  });
}
export function useTripQuery(id: string | undefined) {
  const owner = useProfile().data?.id;
  return useQuery<TripReadDto>({
    queryKey: tripQueryKeys.detail(owner, id),
    refetchInterval: (query) =>
      query.state.data
        ? nextTravelDayRefreshDelay(query.state.data.context)
        : false,
    enabled: !!owner && !!id,
    queryFn: ({ signal }) => {
      if (!id) throw new Error("Missing trip id");
      return tripApi.detail(id, signal);
    },
  });
}
export function useCreateTripMutation() {
  const owner = useProfile().data?.id;
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      const sessionVersion = authSession.getVersion();
      const result = await tripApi.create(payload);
      if (sessionVersion !== authSession.getVersion())
        throw new ApiError("CANCELLED");
      return result;
    },
    retry: false,
    onSuccess: (read) => {
      client.setQueryData(tripQueryKeys.detail(owner, read.trip.id), read);
      void client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) });
      void client.invalidateQueries({
        queryKey: tripQueryKeys.dashboard(owner),
      });
    },
  });
}

export function useUpdateTripMutation(id: string) {
  const owner = useProfile().data?.id;
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (payload: UpdateTripPayload) => {
      const sessionVersion = authSession.getVersion();
      const result = await tripApi.update(id, payload);
      if (sessionVersion !== authSession.getVersion())
        throw new ApiError("CANCELLED");
      return { read: result, sessionVersion };
    },
    onSuccess: async ({ read, sessionVersion }) => {
      await client.cancelQueries({ queryKey: tripQueryKeys.detail(owner, id) });
      if (sessionVersion !== authSession.getVersion())
        throw new ApiError("CANCELLED");
      client.setQueryData(tripQueryKeys.detail(owner, id), read);
      await Promise.all([
        client.invalidateQueries({
          queryKey: weatherQueryKeys.forTrip(owner, id),
        }),
        client.invalidateQueries({ queryKey: tripQueryKeys.dashboard(owner) }),
        client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) }),
        client.invalidateQueries({
          queryKey: tripQueryKeys.itinerary(owner, id),
        }),
        client.invalidateQueries({ queryKey: tripQueryKeys.places(owner, id) }),
      ]);
    },
  });
}
export function useTripDatePreviewMutation(id: string) {
  return useMutation({
    retry: false,
    mutationFn: async (payload: DatePreviewRequest) => {
      const version = authSession.getVersion();
      const result = await tripApi.previewDates(id, payload);
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
      return result;
    },
  });
}
export function useDeleteTripMutation(id: string) {
  const owner = useProfile().data?.id;
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (version: number) => {
      const sessionVersion = authSession.getVersion();
      await tripApi.remove(id, version);
      if (sessionVersion !== authSession.getVersion())
        throw new ApiError("CANCELLED");
      return sessionVersion;
    },
    onSuccess: async (sessionVersion) => {
      await client.cancelQueries({ queryKey: tripQueryKeys.detail(owner, id) });
      if (sessionVersion !== authSession.getVersion())
        throw new ApiError("CANCELLED");
      client.removeQueries({
        queryKey: tripQueryKeys.detail(owner, id),
        exact: true,
      });
      client.removeQueries({ queryKey: tripQueryKeys.itinerary(owner, id) });
      client.removeQueries({ queryKey: tripQueryKeys.places(owner, id) });
      client.removeQueries({ queryKey: weatherQueryKeys.forTrip(owner, id) });
      await Promise.all([
        client.invalidateQueries({ queryKey: tripQueryKeys.dashboard(owner) }),
        client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) }),
        client.invalidateQueries({ queryKey: memoryQueryKeys.list(owner) }),
        client.invalidateQueries({ queryKey: memoryQueryKeys.list(owner, id) }),
      ]);
    },
  });
}
