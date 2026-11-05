import type { Trip } from "@/features/home/types/home-types";
import { tripApi } from "./trip-api";
import { createTripRequestSchema } from "./trip-types";
import { createRequestId } from "@/utils/create-request-id";

type TripInput = Pick<Trip, "destination" | "title" | "startDate" | "endDate" | "preferences" | "budget">;
export async function createServerTrip(trip: TripInput, clientRequestId = createRequestId()) {
  const created = await tripApi.create(createTripRequestSchema.parse({
    clientRequestId, title: trip.title || trip.destination, destination: { name: trip.destination },
    startDate: trip.startDate, endDate: trip.endDate,
    budget: trip.budget, preferences: trip.preferences ?? [],
  }));
  return created.id;
}
