import type { Trip, TripDay, TripPreference, TripStop } from "@/features/home/types/home-types";
import type { ItineraryResponse, SaveItineraryRequest } from "./itinerary-types";
import type { TripPlaceResponse, TripResponse, TripSummary } from "./trip-types";

const preferenceValues = new Set<TripPreference>([
  "nature", "food", "culture", "relaxation", "photography", "adventure", "shopping", "beach",
]);

function tripDays(startDate: string | null, endDate: string | null): TripDay[] {
  if (!startDate || !endDate || startDate > endDate) return [];
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const count = Math.min(Math.floor((end.getTime() - start.getTime()) / 86400000) + 1, 365);
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

export function toTrip(
  value: TripResponse | TripSummary,
  places: TripPlaceResponse[] = [],
  itinerary?: ItineraryResponse,
): Trip {
  const status = value.status === "COMPLETED" ? "completed"
    : value.status === "CANCELLED" ? "cancelled"
      : value.status === "PLANNING" ? "draft" : "planned";
  const placeStops = places.map(toTripStop);
  const placeById = new Map(placeStops.map((stop) => [stop.id, stop]));
  const scheduledIds = new Set<string>();
  const days = tripDays(value.startDate, value.endDate).map((day) => {
    const settings = "days" in value ? value.days.find((entry) => entry.date === day.date) : undefined;
    const scheduled = itinerary?.days.find((entry) => entry.date === day.date);
    const stops = (scheduled?.stops ?? []).flatMap((entry) => {
      const base = placeById.get(entry.placeId);
      if (!base) return [];
      scheduledIds.add(entry.placeId);
      return [{
        ...base,
        time: entry.arrivalTime?.slice(11, 16) ?? "",
        durationMinutes: entry.durationMinutes,
        note: entry.note ?? undefined,
        plannedOrder: entry.sequence,
      }];
    });
    return {
      ...day, stops,
      ...(settings ? {
        startLocation: settings.startLocation ?? undefined,
        startTime: settings.startTime ?? undefined,
        returnToStart: settings.returnToStart,
        transport: settings.transport === "MOTORCYCLE" ? "motorcycle" as const
          : settings.transport === "WALK" ? "walk" as const : "car" as const,
      } : {}),
    };
  });
  return {
    id: value.id,
    serverVersion: value.version,
    destination: value.destination.name,
    title: value.title,
    budget: "budget" in value ? value.budget ?? undefined : undefined,
    preferences: "preferences" in value ? value.preferences.filter((item): item is TripPreference => preferenceValues.has(item as TripPreference)) : [],
    accommodation: "accommodation" in value ? value.accommodation ?? undefined : undefined,
    notes: "notes" in value ? value.notes ?? undefined : undefined,
    unscheduledStops: places
      .slice()
      .sort((a, b) => (a.plannedOrder ?? Number.MAX_SAFE_INTEGER) - (b.plannedOrder ?? Number.MAX_SAFE_INTEGER))
      .filter((place) => !scheduledIds.has(place.placeId))
      .map(toTripStop),
    startDate: value.startDate ?? undefined,
    endDate: value.endDate ?? undefined,
    status,
    days,
    coverImage: value.coverImageUrl ?? undefined,
  };
}

export function toSaveItineraryRequest(trip: Trip): SaveItineraryRequest {
  return {
    days: trip.days.filter((day) => day.stops.length > 0).map((day) => ({
      date: day.date,
      stops: day.stops.map((stop, sequence) => ({
        placeId: stop.id,
        sequence,
        arrivalTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(stop.time)
          ? `${day.date}T${stop.time}:00`
          : null,
        durationMinutes: stop.durationMinutes ?? 45,
        note: stop.note?.trim() || null,
      })),
    })),
  };
}
