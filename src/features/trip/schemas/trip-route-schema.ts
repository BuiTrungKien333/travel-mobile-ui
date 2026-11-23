import { z } from "zod";
import { isCalendarDate } from "@/utils/calendar-date";
export const tripRouteSchema = z.object({
  tripId: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[\w-]+$/),
  day: z.string().refine(isCalendarDate).optional(),
  map: z.literal("expanded").optional(),
});

export const tripStopRouteSchema = tripRouteSchema
  .pick({ tripId: true, day: true })
  .extend({ stopId: tripRouteSchema.shape.tripId });

export const planningPlaceDetailsRouteSchema = z.object({
  planningPlaceId: z.guid(),
  tripId: z.guid(),
  day: z.iso.date(),
  visitStart: z.iso.datetime({ local: true }),
  departure: z.iso.datetime({ local: true }),
  durationMinutes: z.coerce.number().int().positive(),
});

export const tripCameraRouteSchema = tripRouteSchema
  .pick({ tripId: true, day: true })
  .extend({ stopId: tripRouteSchema.shape.tripId.optional() });
