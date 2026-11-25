import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import {
  addTripPlaceRequestSchema,
  updateTripPlaceRequestSchema,
  tripPlaceEnvelopeSchema,
  tripPlacesEnvelopeSchema,
  type AddTripPlaceRequest,
  type TripPlaceResponse,
  type UpdateTripPlaceRequest,
} from "./trip-types";

const base = "/api/v1/trips";

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

export const tripPlacesApi = {
  async addPlaces(
    tripId: string,
    placeIds: string[],
    date?: string,
  ): Promise<TripPlaceResponse[]> {
    if (
      !placeIds.length ||
      placeIds.length > 50 ||
      new Set(placeIds).size !== placeIds.length ||
      placeIds.some(
        (placeId) => !addTripPlaceRequestSchema.safeParse({ placeId }).success,
      )
    )
      throw new ApiError("INVALID_PLACE");

    const response = await apiClient.post<unknown>(
      `${base}/${encodeURIComponent(tripId)}/places/batch`,
      { placeIds, ...(date ? { date } : {}) },
    );

    return parse(tripPlacesEnvelopeSchema, response.data);
  },
  async listPlaces(
    tripId: string,
    signal?: AbortSignal,
  ): Promise<TripPlaceResponse[]> {
    const response = await apiClient.get<unknown>(
      `${base}/${encodeURIComponent(tripId)}/places`,
      { signal },
    );

    return parse(tripPlacesEnvelopeSchema, response.data);
  },
  async addPlace(
    tripId: string,
    request: AddTripPlaceRequest,
  ): Promise<TripPlaceResponse> {
    const body = addTripPlaceRequestSchema.safeParse(request);
    if (!body.success) throw new ApiError("INVALID_PLACE");
    const response = await apiClient.post<unknown>(
      `${base}/${encodeURIComponent(tripId)}/places`,
      body.data,
    );

    return parse(tripPlaceEnvelopeSchema, response.data);
  },
  async updatePlace(
    tripId: string,
    placeId: string,
    request: UpdateTripPlaceRequest,
  ): Promise<TripPlaceResponse> {
    const body = updateTripPlaceRequestSchema.safeParse(request);
    if (!body.success) throw new ApiError("INVALID_PLACE");
    const response = await apiClient.put<unknown>(
      `${base}/${encodeURIComponent(tripId)}/places/${encodeURIComponent(placeId)}`,
      body.data,
    );

    return parse(tripPlaceEnvelopeSchema, response.data);
  },
  async removePlace(tripId: string, placeId: string): Promise<void> {
    await apiClient.delete(
      `${base}/${encodeURIComponent(tripId)}/places/${encodeURIComponent(placeId)}`,
    );
  },
};
