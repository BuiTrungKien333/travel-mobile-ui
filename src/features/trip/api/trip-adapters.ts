import type { Trip, TripDay, TripPreference, TripStop } from "@/features/home/types/home-types";
import type { TripPlaceResponse, TripResponse } from "./trip-types";

const preferenceValues = new Set<TripPreference>([
  "nature", "food", "culture", "relaxation", "photography", "adventure", "shopping", "beach",
]);

function tripDays(startDate: string | null, endDate: string | null): TripDay[] {
  if (!startDate || !endDate || startDate > endDate) return [];
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const count = Math.min(Math.floor((end.getTime() - start.getTime()) / 86400000) + 1, 60);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10);
    return { date, stops: [] };
  });
}

export function toTripStop(value: TripPlaceResponse): TripStop {
  const place = value.place;
  const name = place.name;
  const category = place.category ?? "Place";
  return {
    id: place.id,
    ...(place.providerPlaceId ? { providerPlaceId: place.providerPlaceId } : {}),
    time: "",
    name: { vi: name, en: name },
    kind: { vi: category, en: category },
    ...(place.address ? { address: { vi: place.address, en: place.address } } : {}),
    ...(place.latitude !== null && place.longitude !== null
      ? { location: { latitude: place.latitude, longitude: place.longitude } }
      : {}),
    ...(value.estimatedDuration !== null ? { durationMinutes: value.estimatedDuration } : {}),
    note: value.notes ?? undefined,
    visited: value.visited,
    plannedOrder: value.plannedOrder,
  } as TripStop;
}

export function toTrip(value: TripResponse, places: TripPlaceResponse[] = []): Trip {
  const status = value.status === "COMPLETED" ? "completed"
    : value.status === "CANCELLED" ? "cancelled"
      : value.status === "PLANNING" ? "draft" : "planned";
  return {
    id: value.id,
    destination: value.destination,
    title: value.name,
    budget: value.budget === null ? undefined : { amount: value.budget, currency: "VND" },
    preferences: value.preferences.filter((item): item is TripPreference => preferenceValues.has(item as TripPreference)),
    accommodation: undefined,
    notes: value.description ?? undefined,
    unscheduledStops: places
      .slice()
      .sort((a, b) => (a.plannedOrder ?? Number.MAX_SAFE_INTEGER) - (b.plannedOrder ?? Number.MAX_SAFE_INTEGER))
      .map(toTripStop),
    startDate: value.startDate ?? undefined,
    endDate: value.endDate ?? undefined,
    status,
    days: tripDays(value.startDate, value.endDate),
    coverImage: value.coverImage ?? undefined,
  };
}
