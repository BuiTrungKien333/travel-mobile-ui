import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import { createPlanningDraftSchema, planningDraftSchema, planningLatestEnvelopeSchema, type CreatePlanningDraft } from "./planning-contract";
import { itineraryEnvelopeSchema } from "./itinerary-types";

const path = (tripId: string) => `/api/v1/trips/${encodeURIComponent(tripId)}/planning/drafts`;
const draftEnvelope = z.object({ success: z.literal(true), data: planningDraftSchema });
export const planningApi = {
  async latest(tripId: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(`${path(tripId)}/latest`, { signal });
    const parsed = planningLatestEnvelopeSchema.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
  async create(tripId: string, request: CreatePlanningDraft) {
    const response = await apiClient.post<unknown>(path(tripId), createPlanningDraftSchema.parse(request), { timeout: 75_000 });
    const parsed = draftEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
  async apply(tripId: string, draftId: string) {
    const response = await apiClient.post<unknown>(`${path(tripId)}/${encodeURIComponent(draftId)}/apply`);
    const parsed = itineraryEnvelopeSchema.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
};
