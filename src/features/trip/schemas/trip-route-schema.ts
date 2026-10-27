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
