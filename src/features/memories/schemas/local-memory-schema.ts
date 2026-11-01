import { z } from "zod";
import { isCalendarDate } from "@/utils/calendar-date";

export const localMemorySchema = z.object({
  id: z.string().regex(/^local-[\w-]+$/),
  photo: z.string().regex(/^(file:|content:|data:image\/)/i),
  destination: z.string().max(300),
  text: z.string().max(500),
  tripId: z.string().max(120).optional(),
  date: z.string().refine(isCalendarDate),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  place: z
    .object({ vi: z.string().max(300), en: z.string().max(300) })
    .optional(),
  local: z.object({ capturedAt: z.iso.datetime(), deviceSaved: z.boolean() }),
});
export type LocalMemory = z.infer<typeof localMemorySchema>;
