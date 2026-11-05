import { z } from "zod";

const instant = z.iso.datetime({ offset: true });
const localDate = z.iso.date();

const destinationSchema = z.object({ name: z.string().trim().min(1).max(120), provinceId: z.guid().nullable().optional() });
const budgetSchema = z.object({ amount: z.number().int().min(0).max(1000000000000), currency: z.literal("VND") });
const preferencesSchema = z.array(z.enum(["nature", "food", "culture", "relaxation", "photography", "adventure", "shopping", "beach"])).max(8);
const versionSchema = z.number().int().nonnegative();
export const tripSummarySchema = z.object({
  id: z.guid(),
  title: z.string(),
  destination: destinationSchema,
  startDate: localDate.nullable(),
  endDate: localDate.nullable(),
  timeZone: z.string(),
  status: z.enum(["PLANNING", "READY", "ACTIVE", "COMPLETED", "CANCELLED"]),
  mode: z.enum(["PLANNING", "LIVE", "RECAP", "CANCELLED"]),
  readiness: z.object({ hasDates: z.boolean(), hasPlaces: z.boolean(), unscheduledCount: z.number().int().nonnegative() }),
  dayCount: z.number().int().nonnegative(),
  stopCount: z.number().int().nonnegative(),
  memoryCount: z.number().int().nonnegative(),
  coverImageUrl: z.string().nullable(),
  version: versionSchema,
  createdAt: instant,
  updatedAt: instant,
});
export type TripSummary = z.infer<typeof tripSummarySchema>;
const tripDaySchema = z.object({
  id: z.guid(), date: localDate, dayNumber: z.number().int().positive(),
  startLocation: z.string().nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  returnToStart: z.boolean(), transport: z.enum(["CAR", "MOTORCYCLE", "WALK"]),
});
export const tripResponseSchema = tripSummarySchema.extend({
  preferences: preferencesSchema,
  budget: budgetSchema.nullable(),
  accommodation: z.string().nullable(),
  notes: z.string().nullable(),
  days: z.array(tripDaySchema),
});
export type TripResponse = z.infer<typeof tripResponseSchema>;

export const tripPlaceResponseSchema = z.object({
  id: z.guid(),
  tripId: z.guid(),
  placeId: z.guid(),
  place: z.object({
    id: z.guid(),
    providerPlaceId: z.string().nullable(),
    name: z.string(),
    address: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    provinceId: z.guid().nullable(),
    provinceName: z.string().nullable(),
    category: z.string().nullable(),
    createdAt: instant,
  }),
  priority: z.number().int().nullable(),
  estimatedDuration: z.number().int().nullable(),
  notes: z.string().nullable(),
  plannedOrder: z.number().int().nullable(),
  visited: z.boolean(),
  createdAt: instant,
  updatedAt: instant,
});
export type TripPlaceResponse = z.infer<typeof tripPlaceResponseSchema>;

export const createTripRequestSchema = z.object({
  clientRequestId: z.guid(),
  title: z.string().trim().max(120),
  destination: destinationSchema,
  startDate: localDate,
  endDate: localDate,
  timeZone: z.literal("Asia/Ho_Chi_Minh").optional(),
  preferences: preferencesSchema.optional(),
  budget: budgetSchema.optional(),
  accommodation: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  initialPlaceIds: z.array(z.guid()).max(100).optional(),
});
export type CreateTripRequest = z.infer<typeof createTripRequestSchema>;

export const updateTripRequestSchema = createTripRequestSchema.omit({ clientRequestId: true, timeZone: true, initialPlaceIds: true }).partial().extend({
  version: versionSchema,
  title: z.string().trim().min(1).max(120).optional(),
  budget: budgetSchema.nullable().optional(),
  accommodation: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  acknowledgeDateImpact: z.boolean().optional(),
});
export type UpdateTripRequest = z.infer<typeof updateTripRequestSchema>;
export const updateTripDayRequestSchema = z.object({
  version: versionSchema,
  startLocation: z.string().trim().min(1).max(200).nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  returnToStart: z.boolean(),
  transport: z.enum(["CAR", "MOTORCYCLE", "WALK"]),
  expectedItineraryUpdatedAt: instant.optional(),
  durations: z.array(z.object({ stopId: z.guid(), durationMinutes: z.number().int().min(5).max(480) })).max(100),
}).superRefine((value, ctx) => {
  if (value.returnToStart && !value.startLocation)
    ctx.addIssue({ code: "custom", path: ["startLocation"], message: "A return point is required" });
  if (value.durations.length && !value.expectedItineraryUpdatedAt)
    ctx.addIssue({ code: "custom", path: ["expectedItineraryUpdatedAt"], message: "An itinerary version is required" });
});
export type UpdateTripDayRequest = z.infer<typeof updateTripDayRequestSchema>;
export const tripDateChangeSchema = z.object({ version: versionSchema, startDate: localDate, endDate: localDate });
export type TripDateChange = z.infer<typeof tripDateChangeSchema>;
export const tripDateImpactSchema = z.object({
  baseVersion: versionSchema, startDate: localDate, endDate: localDate, dayCount: z.number().int().positive(),
  removedDates: z.array(localDate), addedDates: z.array(localDate), movedToPoolCount: z.number().int().nonnegative(),
  requiresAcknowledgement: z.boolean(),
});

export const addTripPlaceRequestSchema = z.object({
  placeId: z.guid().optional(),
  providerPlaceId: z.string().max(255).optional(),
  name: z.string().trim().min(1).max(255).optional(),
  address: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  category: z.string().max(100).optional(),
  priority: z.number().int().nonnegative().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
  plannedOrder: z.number().int().min(0).max(1000000).optional(),
}).refine((value) => value.placeId || (value.name && value.latitude !== undefined && value.longitude !== undefined));
export type AddTripPlaceRequest = z.infer<typeof addTripPlaceRequestSchema>;

export const updateTripPlaceRequestSchema = z.object({
  priority: z.number().int().nonnegative().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
  plannedOrder: z.number().int().min(0).max(1000000).optional(),
  visited: z.boolean().optional(),
});
export type UpdateTripPlaceRequest = z.infer<typeof updateTripPlaceRequestSchema>;

const contextSchema = z.object({ serverTime: instant, evaluatedDate: localDate });
export const tripEnvelopeSchema = z.object({ success: z.literal(true), data: z.object({ trip: tripResponseSchema, context: contextSchema }) });
export const tripsEnvelopeSchema = z.object({ success: z.literal(true), data: z.object({
  content: z.array(tripSummarySchema), page: z.number().int().nonnegative(), size: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(), totalElements: z.number().int().nonnegative(), context: contextSchema,
}) });
export const tripDateImpactEnvelopeSchema = z.object({ success: z.literal(true), data: tripDateImpactSchema });
export const tripPlacesEnvelopeSchema = z.object({ success: z.literal(true), data: z.array(tripPlaceResponseSchema) });
export const tripPlaceEnvelopeSchema = z.object({ success: z.literal(true), data: tripPlaceResponseSchema });
