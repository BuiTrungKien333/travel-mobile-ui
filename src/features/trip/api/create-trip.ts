import { z } from "zod";
import type { Trip } from "@/features/home/types/home-types";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import { createRequestId } from "@/utils/create-request-id";

const createdTripSchema = z.object({
  success: z.literal(true),
  data: z.object({ trip: z.object({ id: z.guid() }) }),
});

type TripInput = Pick<Trip, "destination" | "title" | "startDate" | "endDate" | "preferences" | "budget">;
const requests = new Map<string, { payload: string; requestId: string }>();

export async function createServerTrip(userId: string, localId: string, trip: TripInput) {
  const input = {
    title: trip.title ?? "", destination: { name: trip.destination },
    startDate: trip.startDate, endDate: trip.endDate,
    budget: trip.budget, preferences: trip.preferences ?? [],
  };
  const key = `${userId}:${localId}`;
  const payload = JSON.stringify(input);
  const previous = requests.get(key);
  const requestId = previous?.payload === payload ? previous.requestId : createRequestId();
  requests.set(key, { payload, requestId });
  const response = await apiClient.post<unknown>("/api/v1/trips", { ...input, clientRequestId: requestId });
  const parsed = createdTripSchema.safeParse(response.data);
  if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
  return parsed.data.data.trip.id;
}
