import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import { isCalendarDate } from "@/utils/calendar-date";
import {
  itineraryEnvelopeSchema,
  optimizationEnvelopeSchema,
  saveItineraryRequestSchema,
  saveItineraryDaySchema,
  type SaveItineraryDayRequest,
  type ItineraryOptimizationProposal,
  type ItineraryResponse,
  type SaveItineraryRequest,
} from "./itinerary-types";

function parse<T>(
  schema: {
    safeParse(value: unknown): { success: boolean; data?: { data: T } };
  },
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success || !result.data) throw new ApiError("INVALID_RESPONSE");
  return result.data.data;
}

const path = (tripId: string) =>
  `/api/v1/trips/${encodeURIComponent(tripId)}/itinerary`;

export const itineraryApi = {
  async get(tripId: string, signal?: AbortSignal): Promise<ItineraryResponse> {
    const response = await apiClient.get<unknown>(path(tripId), { signal });
    return parse(itineraryEnvelopeSchema, response.data);
  },
  async save(
    tripId: string,
    request: SaveItineraryRequest,
  ): Promise<ItineraryResponse> {
    const body = saveItineraryRequestSchema.safeParse(request);
    if (!body.success) throw new ApiError("INVALID_ITINERARY");
    const response = await apiClient.put<unknown>(path(tripId), body.data);
    return parse(itineraryEnvelopeSchema, response.data);
  },
  async saveDay(
    tripId: string,
    date: string,
    request: SaveItineraryDayRequest,
  ): Promise<ItineraryResponse> {
    const body = saveItineraryDaySchema.safeParse(request);
    if (!body.success || !isCalendarDate(date))
      throw new ApiError("INVALID_ITINERARY");
    const response = await apiClient.put<unknown>(
      `${path(tripId)}/days/${encodeURIComponent(date)}`,
      body.data,
    );
    const saved = parse(itineraryEnvelopeSchema, response.data);
    if (saved.tripId !== tripId) throw new ApiError("INVALID_RESPONSE");
    return saved;
  },
  async optimize(
    tripId: string,
    signal?: AbortSignal,
  ): Promise<{
    sourceUpdatedAt: string;
    proposal: ItineraryOptimizationProposal;
  }> {
    const response = await apiClient.post<unknown>(
      `${path(tripId)}/optimize`,
      {},
      { signal },
    );
    const data = parse(optimizationEnvelopeSchema, response.data);
    return { sourceUpdatedAt: data.sourceUpdatedAt, proposal: data.proposal };
  },
  async applyOptimization(
    tripId: string,
    input: {
      expectedUpdatedAt: string;
      proposal: ItineraryOptimizationProposal;
    },
  ): Promise<ItineraryResponse> {
    const response = await apiClient.post<unknown>(
      `${path(tripId)}/apply-optimization`,
      input,
    );
    return parse(itineraryEnvelopeSchema, response.data);
  },
};
