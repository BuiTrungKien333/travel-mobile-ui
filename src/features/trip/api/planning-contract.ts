import { z } from "zod";

export const planningTags = [
  "MUSEUM",
  "HISTORY",
  "CULTURE",
  "ART",
  "LOCAL",
  "MARKET",
  "SHOPPING",
  "BEACH",
  "SCENERY",
  "RELAX",
  "OUTDOOR",
  "PARK",
  "ARCHITECTURE",
  "TEMPLE",
] as const;

export const planningTag = z.enum(planningTags);
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

export const planningOrigin = z.object({
  name: z.string().trim().min(1).max(160),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const planningPreferences = z
  .object({
    destination: z.string().min(1).max(160),
    numberOfDays: z.number().int().min(1).max(3),
    interests: z.array(planningTag).max(10),
    excludedTags: z.array(planningTag).max(10),
    dailyStartTime: time,
    dailyEndTime: time,
    travelPace: z.enum(["RELAXED", "BALANCED", "ACTIVE"]).nullish(),
    mustVisitNames: z.array(z.string().trim().min(1).max(160)).max(10),
    excludedPlaceNames: z.array(z.string().trim().min(1).max(160)).max(10),
  })
  .refine((p) => p.dailyEndTime > p.dailyStartTime);

export const planningInput = z
  .object({
    text: z.string().trim().min(1).max(1000).nullable().optional(),
    additionalText: z.string().trim().max(600).nullable().optional(),
    startDate: z.iso.date(),
    origin: planningOrigin,
    roundTrip: z.boolean(),
    restMinutes: z.number().int().min(0).max(90),
    preferences: planningPreferences.nullable().optional(),
  })
  .refine((input) =>
    input.preferences
      ? !input.text?.trim()
      : Boolean(input.text?.trim()) && !input.additionalText?.trim(),
  );

export const createPlanningDraftSchema = z.object({
  clientRequestId: z.guid(),
  expectedTripVersion: z.number().int().nonnegative(),
  input: planningInput,
});

const problem = z.object({
  code: z.string(),
  blocking: z.boolean(),
  placeId: z.guid().nullable(),
  message: z.string(),
});

const candidate = z.object({
  placeId: z.guid(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  estimatedDurationMinutes: z.number().int().positive(),
  tags: z.array(z.string()),
});

const localTime = z.iso.datetime({ local: true });

export const planningDraftSchema = z.object({
  id: z.guid(),
  tripId: z.guid(),
  expiresAt: z.iso.datetime({ offset: true }),
  applied: z.boolean(),
  canApply: z.boolean(),
  input: planningInput,
  proposal: z.object({
    status: z.string(),
    metadata: z.record(z.string(), z.string()).optional(),
    days: z
      .array(
        z.object({
          dayIndex: z.number().int(),
          date: z.iso.date(),
          title: z.string(),
          summary: z.string(),
          summarySource: z.string(),
          start: localTime,
          finish: localTime,
          totalDistanceKm: z.number().nonnegative(),
          totalTransitMinutes: z.number().nonnegative(),
          stops: z.array(
            z.object({
              place: candidate,
              visitStart: localTime,
              departure: localTime,
              transitMinutes: z.number().int().nonnegative(),
              distanceKm: z.number().nonnegative(),
              openingStatus: z.string(),
            }),
          ),
          pauses: z.array(
            z.object({ type: z.string(), start: localTime, end: localTime }),
          ),
          returnToOrigin: z
            .object({ arrival: localTime, minutes: z.number() })
            .nullable(),
          issues: z.array(problem),
        }),
      )
      .max(3),
    unassignedPlaces: z.array(
      z.object({ place: candidate, reason: z.string() }),
    ),
    issues: z.array(problem),
    weather: z.object({
      status: z.string(),
      days: z.array(
        z.object({
          date: z.iso.date(),
          minTemperature: z.number().nullable(),
          maxTemperature: z.number().nullable(),
          rainProbability: z.number().nullable(),
          condition: z.string(),
        }),
      ),
    }),
    executionReport: z.object({ overallMode: z.string() }),
  }),
});

export type PlanningInput = z.infer<typeof planningInput>;

// ApiResponse omits null data when no latest draft exists.
export const planningLatestEnvelopeSchema = z.object({
  success: z.literal(true),
  data: planningDraftSchema.nullish().transform((value) => value ?? null),
});

export type PlanningDraft = z.infer<typeof planningDraftSchema>;
export type CreatePlanningDraft = z.infer<typeof createPlanningDraftSchema>;
