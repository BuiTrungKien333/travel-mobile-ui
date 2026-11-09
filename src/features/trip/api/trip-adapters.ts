import type { Trip, TripStop } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { tripViewModel, type TripDetailDto } from "./trip-contract";
import {
  saveItineraryRequestSchema,
  type ItineraryResponse,
  type SaveItineraryRequest,
  type SaveItineraryDayRequest,
} from "./itinerary-types";
import type { TripPlaceResponse } from "./trip-types";

export function toDayStops(
  base: ItineraryResponse,
  date: string,
): SaveItineraryDayRequest["stops"] {
  return (base.days.find((day) => day.date === date)?.stops ?? []).map(
    (stop) => ({
      placeId: stop.placeId,
      sequence: stop.sequence,
      arrivalTime: stop.arrivalTime,
      durationMinutes: stop.durationMinutes,
      note: stop.note,
    }),
  );
}

export function toTripStop(value: TripPlaceResponse): TripStop {
  const place = value.place;
  return {
    id: value.id,
    tripPlaceId: value.id,
    placeId: value.placeId,
    providerPlaceId: place.providerPlaceId ?? undefined,
    time: "",
    name: { vi: place.name, en: place.name },
    kind: { vi: place.category ?? "", en: place.category ?? "" },
    address: place.address
      ? { vi: place.address, en: place.address }
      : undefined,
    location:
      place.latitude !== null && place.longitude !== null
        ? { latitude: place.latitude, longitude: place.longitude }
        : undefined,
    durationMinutes: value.estimatedDuration ?? undefined,
    note: value.notes ?? undefined,
    visited: value.visited,
    plannedOrder: value.plannedOrder,
  };
}
export function toTrip(
  value: TripDetailDto,
  places: TripPlaceResponse[] = [],
  itinerary?: ItineraryResponse,
): Trip {
  const base = tripViewModel(value, value);
  const byPlaceId = new Map(
    places.map((place) => [place.placeId, toTripStop(place)]),
  );
  const scheduled = new Set<string>();
  return {
    ...base,
    days: base.days.map((day) => ({
      ...day,
      ...daySettings(
        itinerary?.days.find((entry) => entry.date === day.date)?.settings,
      ),
      stops: (
        itinerary?.days.find((entry) => entry.date === day.date)?.stops ?? []
      ).map((entry) => {
        const stop = byPlaceId.get(entry.placeId) ?? {
          id: entry.id,
          placeId: entry.placeId,
          name: { vi: entry.name, en: entry.name },
          kind: { vi: entry.category ?? "", en: entry.category ?? "" },
          address: entry.address
            ? { vi: entry.address, en: entry.address }
            : undefined,
        };
        scheduled.add(entry.placeId);
        return {
          ...stop,
          itineraryItemId: entry.id,
          time: entry.arrivalTime?.slice(11, 16) ?? "",
          durationMinutes: entry.durationMinutes,
          note: entry.note ?? undefined,
          plannedOrder: entry.sequence,
        };
      }),
    })),
    unscheduledStops: places
      .filter((place) => !scheduled.has(place.placeId))
      .map(toTripStop),
  };
}

function daySettings(settings: ItineraryResponse["days"][number]["settings"]) {
  if (!settings) return {};
  return {
    startLocation: settings.origin?.name,
    startAddress: settings.origin?.address ?? undefined,
    startCoordinate:
      settings.origin?.latitude != null && settings.origin.longitude != null
        ? {
            latitude: settings.origin.latitude,
            longitude: settings.origin.longitude,
          }
        : undefined,
    startTime: settings.departureTime.slice(0, 5),
    returnToStart: settings.returnToStart,
    transport:
      settings.travelMode === "WALK"
        ? ("walk" as const)
        : settings.travelMode === "BICYCLE"
          ? undefined
          : ("car" as const),
  };
}
export function toSaveItineraryRequest(trip: Trip): SaveItineraryRequest {
  const days = trip.days
    .filter((day) => day.stops.length > 0)
    .map((day) => ({
      date: day.date,
      stops: day.stops.map((stop, sequence) => {
        if (!stop.placeId) throw new ApiError("INVALID_ITINERARY");
        return {
          placeId: stop.placeId,
          sequence,
          arrivalTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(stop.time)
            ? `${day.date}T${stop.time}:00`
            : null,
          durationMinutes: stop.durationMinutes ?? 45,
          note: stop.note?.trim() || null,
        };
      }),
    }));
  const parsed = saveItineraryRequestSchema.safeParse({ days });
  if (!parsed.success) throw new ApiError("INVALID_ITINERARY");
  return parsed.data;
}
