import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { ApiError } from "@/services/api/api-error";
import { planningApi } from "./planning-api";
import { tripQueryKeys } from "./trip-query-keys";
import type { CreatePlanningDraft, PlanningDraft } from "./planning-contract";

export function usePlanningDraft(tripId: string | undefined) {
  const owner = useProfile().data?.id;
  const client = useQueryClient();
  const key = ["trips", owner, "planning-draft", tripId] as const;
  const latest = useQuery<PlanningDraft | null>({
    queryKey: key, enabled: !!owner && !!tripId, retry: false,
    refetchInterval: query => query.state.error instanceof ApiError && query.state.error.code === "DRAFT_003" ? 2500 : false,
    queryFn: ({ signal }) => planningApi.latest(tripId ?? "", signal),
  });
  const create = useMutation({
    retry: false,
    mutationFn: async (request: CreatePlanningDraft) => {
      const session = authSession.getVersion();
      const draft = await planningApi.create(tripId ?? "", request);
      if (session !== authSession.getVersion()) throw new ApiError("CANCELLED");
      await client.cancelQueries({ queryKey: key });
      if (session !== authSession.getVersion()) throw new ApiError("CANCELLED");
      client.setQueryData(key, draft);
      return draft;
    },
  });
  const apply = useMutation({
    retry: false,
    mutationFn: async (draftId: string) => {
      const session = authSession.getVersion();
      const itinerary = await planningApi.apply(tripId ?? "", draftId);
      if (session !== authSession.getVersion()) throw new ApiError("CANCELLED");
      await client.cancelQueries({ queryKey: tripQueryKeys.itinerary(owner, tripId) });
      if (session !== authSession.getVersion()) throw new ApiError("CANCELLED");
      client.setQueryData(tripQueryKeys.itinerary(owner, tripId), itinerary);
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: tripQueryKeys.detail(owner, tripId) }),
        client.invalidateQueries({ queryKey: tripQueryKeys.places(owner, tripId) }),
        client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) }),
        client.invalidateQueries({ queryKey: tripQueryKeys.dashboard(owner) }),
      ]);
      return itinerary;
    },
  });
  return { latest, create, apply };
}
