import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import {
  tripEnvelopeSchema,
  tripPlaceEnvelopeSchema,
  tripPlacesEnvelopeSchema,
  tripsEnvelopeSchema,
  type AddTripPlaceRequest,
  type CreateTripRequest,
  type TripPlaceResponse,
  type TripResponse,
  type UpdateTripPlaceRequest,
  type UpdateTripRequest,
} from "./trip-types";

const base = "/api/v1/trips";
function parse<T>(schema: { safeParse(value: unknown): { success: boolean; data?: { data: T } } }, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success || !result.data) throw new ApiError("INVALID_RESPONSE");
  return result.data.data;
}

export const tripApi = {
  async list(signal?: AbortSignal): Promise<TripResponse[]> {
    const response = await apiClient.get<unknown>(base, { signal });
    return parse(tripsEnvelopeSchema, response.data);
  },
  async get(tripId: string, signal?: AbortSignal): Promise<TripResponse> {
    const response = await apiClient.get<unknown>(`${base}/${tripId}`, { signal });
    return parse(tripEnvelopeSchema, response.data);
  },
  async create(request: CreateTripRequest): Promise<TripResponse> {
    const response = await apiClient.post<unknown>(base, request);
    return parse(tripEnvelopeSchema, response.data);
  },
  async update(tripId: string, request: UpdateTripRequest): Promise<TripResponse> {
    const response = await apiClient.put<unknown>(`${base}/${tripId}`, request);
    return parse(tripEnvelopeSchema, response.data);
  },
  async remove(tripId: string): Promise<void> {
    await apiClient.delete(`${base}/${tripId}`);
  },
  async listPlaces(tripId: string, signal?: AbortSignal): Promise<TripPlaceResponse[]> {
    const response = await apiClient.get<unknown>(`${base}/${tripId}/places`, { signal });
    return parse(tripPlacesEnvelopeSchema, response.data);
  },
  async addPlace(tripId: string, request: AddTripPlaceRequest): Promise<TripPlaceResponse> {
    const response = await apiClient.post<unknown>(`${base}/${tripId}/places`, request);
    return parse(tripPlaceEnvelopeSchema, response.data);
  },
  async updatePlace(tripId: string, placeId: string, request: UpdateTripPlaceRequest): Promise<TripPlaceResponse> {
    const response = await apiClient.put<unknown>(`${base}/${tripId}/places/${placeId}`, request);
    return parse(tripPlaceEnvelopeSchema, response.data);
  },
  async removePlace(tripId: string, placeId: string): Promise<void> {
    await apiClient.delete(`${base}/${tripId}/places/${placeId}`);
  },
};
