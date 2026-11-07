import { z } from "zod";

const localDate = z.iso.date();
const localDateTime = z.iso.datetime({ local: true });
const instant = z.iso.datetime({ offset: true });
export const daySettingsSchema = z
  .object({
    origin: z
      .object({
        name: z.string().trim().min(1).max(200),
        address: z.string().max(500).nullable(),
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
      })
      .refine(
        (origin) => (origin.latitude === null) === (origin.longitude === null),
      )
      .nullable(),
    departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/),
    returnToStart: z.boolean(),
    travelMode: z.enum(["DRIVE", "WALK", "BICYCLE"]),
  })
  .refine((value) => !value.returnToStart || value.origin !== null);
export type DaySettings = z.infer<typeof daySettingsSchema>;

export const itineraryStopSchema = z.object({
  id: z.guid(),
  placeId: z.guid(),
  name: z.string(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  category: z.string().nullable(),
  arrivalTime: localDateTime.nullable(),
  durationMinutes: z.number().int().positive(),
  sequence: z.number().int().nonnegative(),
  note: z.string().nullable(),
  distanceFromPreviousKm: z.number().nullable(),
  travelMinutesFromPrevious: z.number().int().nullable(),
});

export const itineraryDaySchema = z.object({
  date: localDate,
  stops: z.array(itineraryStopSchema),
  settings: daySettingsSchema.nullable().optional(),
});

export const itineraryResponseSchema = z.object({
  id: z.guid().nullable(),
  tripId: z.guid(),
  name: z.string(),
  status: z.string(),
  days: z.array(itineraryDaySchema),
  updatedAt: instant.nullable(),
});
export type ItineraryResponse = z.infer<typeof itineraryResponseSchema>;
export type ItineraryStopResponse = z.infer<typeof itineraryStopSchema>;

const editableStopSchema = z.object({
  placeId: z.guid(),
  sequence: z.number().int().nonnegative(),
  arrivalTime: localDateTime.nullable(),
  durationMinutes: z.number().int().min(1).max(1440),
  note: z.string().max(2000).nullable(),
});

export const saveItineraryDaySchema = z.object({
  expectedTripVersion: z.number().int().nonnegative().safe(),
  expectedUpdatedAt: instant.nullable(),
  stops: z.array(editableStopSchema).max(100),
  settings: daySettingsSchema.optional(),
});
export type SaveItineraryDayRequest = z.infer<typeof saveItineraryDaySchema>;
export const updateDayScheduleSchema = z.object({
  expectedTripVersion: z.number().int().nonnegative().safe(),
  expectedUpdatedAt: instant.nullable(),
  settings: daySettingsSchema,
  durations: z
    .array(
      z.object({
        placeId: z.guid(),
        minutes: z.number().int().min(5).max(480),
      }),
    )
    .max(100),
});
export type UpdateDayScheduleRequest = z.infer<typeof updateDayScheduleSchema>;

export const saveItineraryRequestSchema = z.object({
  days: z
    .array(
      z.object({
        date: localDate,
        stops: z.array(editableStopSchema).max(100),
      }),
    )
    .max(90),
});
export type SaveItineraryRequest = z.infer<typeof saveItineraryRequestSchema>;

const optimizationItemSchema = z
  .object({
    placeId: z.guid(),
    placeName: z.string(),
    plannedDate: localDate,
    displayDate: localDate,
    arrivalTime: localDateTime,
    durationMinutes: z.number().int().positive(),
    transitDistanceKmFromPrev: z.number().nonnegative(),
    transitMinutesFromPrev: z.number().int().nonnegative(),
  })
  .passthrough();

const optimizationDaySchema = z
  .object({
    dayDate: localDate,
    status: z.string(),
    totalDistanceKm: z.number().nonnegative(),
    totalTransitMinutes: z.number().nonnegative(),
    scheduleItems: z.array(optimizationItemSchema),
    evaluationResult: z.unknown().optional(),
  })
  .passthrough();

export const itineraryOptimizationProposalSchema = z
  .object({
    status: z.string(),
    totalTripDistanceKm: z.number().nonnegative(),
    totalTripTransitMinutes: z.number().nonnegative(),
    dailySchedules: z.array(optimizationDaySchema),
    globalIssues: z.array(z.unknown()).optional(),
    copilotRecommendations: z.unknown().optional(),
  })
  .passthrough();
export type ItineraryOptimizationProposal = z.infer<
  typeof itineraryOptimizationProposalSchema
>;

export const itineraryEnvelopeSchema = z.object({
  success: z.literal(true),
  data: itineraryResponseSchema,
});
export const optimizationEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    tripId: z.guid(),
    sourceUpdatedAt: instant,
    proposal: itineraryOptimizationProposalSchema,
  }),
});
