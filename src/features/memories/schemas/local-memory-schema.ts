import { z } from "zod";
import { isCalendarDate } from "@/utils/calendar-date";
import { MEMORY_NOTE_MAX_LENGTH } from "../constants/memory-limits";

export const localMemorySchema = z.object({
  id: z.string().regex(/^local-[\w-]+$/),
  photo: z.string().regex(/^(file:|content:|data:image\/)/i),
  destination: z.string().max(300),
  text: z.string().max(MEMORY_NOTE_MAX_LENGTH),
  tripId: z.string().max(120).optional(),
  date: z.string().refine(isCalendarDate),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  place: z
    .object({ vi: z.string().max(300), en: z.string().max(300) })
    .optional(),
  local: z.object({
    capturedAt: z.iso.datetime(), deviceSaved: z.boolean(),
    userId: z.guid().optional(), clientRequestId: z.guid().optional(),
    serverId: z.guid().optional(), uploaded: z.boolean().optional(), placeId: z.guid().optional(),
    width: z.number().int().positive().optional(), height: z.number().int().positive().optional(),
    mimeType: z.string().max(100).optional(),
  }),
});
export type LocalMemory = z.infer<typeof localMemorySchema>;
