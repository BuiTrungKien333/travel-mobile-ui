import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import {
  tripEnvelopeSchema,
  createTripRequestSchema,
  updateTripRequestSchema,
  tripDateChangeSchema,
  tripDateImpactEnvelopeSchema,
  tripPlaceEnvelopeSchema,
  tripPlacesEnvelopeSchema,
  tripsEnvelopeSchema,
  type AddTripPlaceRequest,
  type CreateTripRequest,
  type TripPlaceResponse,
  type TripResponse,
  type TripSummary,
  type TripDateChange,
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
  async list(signal?: AbortSignal): Promise<TripSummary[]> {
    const trips: TripSummary[] = [];
    for (let page = 0; ; page++) {
      const response = await apiClient.get<unknown>(base, { params: { page, size: 100 }, signal });
      const data = parse(tripsEnvelopeSchema, response.data);
      if (data.page !== page || (page < data.totalPages && !data.content.length)) throw new ApiError("INVALID_RESPONSE");
      trips.push(...data.content);
      if (page + 1 >= data.totalPages) return trips;
    }
  },
  async get(tripId: string, signal?: AbortSignal): Promise<TripResponse> {
    const response = await apiClient.get<unknown>(`${base}/${tripId}`, { signal });
    return parse(tripEnvelopeSchema, response.data).trip;
  },
  async create(request: CreateTripRequest): Promise<TripResponse> {
    const response = await apiClient.post<unknown>(base, createTripRequestSchema.parse(request));
    return parse(tripEnvelopeSchema, response.data).trip;
  },
  async update(tripId: string, request: UpdateTripRequest): Promise<TripResponse> {
    const response = await apiClient.patch<unknown>(`${base}/${tripId}`, updateTripRequestSchema.parse(request));
    return parse(tripEnvelopeSchema, response.data).trip;
  },
  async previewDates(tripId: string, request: TripDateChange) {
    const response = await apiClient.post<unknown>(`${base}/${tripId}/date-change-preview`, tripDateChangeSchema.parse(request));
    return parse(tripDateImpactEnvelopeSchema, response.data);
  },
  async remove(tripId: string, version: number): Promise<void> {
    await apiClient.delete(`${base}/${tripId}`, { params: { version } });
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
