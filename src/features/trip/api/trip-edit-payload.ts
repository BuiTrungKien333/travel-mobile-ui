import type { TripDetailDto, UpdateTripPayload } from "./trip-contract";
import type { TripMutation } from "../types/trip-details-types";
import { ApiError } from "@/services/api/api-error";

/** Only dirty form fields enter PATCH; absent/empty nullable values must remain distinct. */
export function tripEditPayload(
  mutation: TripMutation,
  base: TripDetailDto,
  version: number,
): UpdateTripPayload {
  if (mutation.kind !== "info") throw new ApiError("INVALID_TRIP");
  const fields = mutation.changedFields ?? [
    "title",
    "destination",
    "budget",
    "preferences",
    "accommodation",
    "notes",
  ];
  const values = mutation.values;

  return {
    version,
    ...(fields.includes("title") ? { title: values.title ?? "" } : {}),
    ...(fields.includes("destination") ||
    fields.includes("destinationProvinceId")
      ? {
          destination: {
            name: values.destination ?? base.destination.name,
            provinceId:
              values.destinationProvinceId !== undefined
                ? values.destinationProvinceId
                : values.destination === base.destination.name
                  ? base.destination.provinceId
                  : null,
          },
        }
      : {}),
    ...(fields.includes("budget") ? { budget: values.budget ?? null } : {}),
    ...(fields.includes("preferences")
      ? { preferences: values.preferences ?? [] }
      : {}),
    ...(fields.includes("accommodation")
      ? { accommodation: values.accommodation?.trim() || null }
      : {}),
    ...(fields.includes("notes")
      ? { notes: values.notes?.trim() || null }
      : {}),
    ...(mutation.dateRange ?? {}),
  };
}
