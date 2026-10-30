import { z } from "zod";

const instant = z.iso.datetime({ offset: true });
const localDate = z.iso.date();

export const tripResponseSchema = z.object({
  id: z.guid(),
  userId: z.guid(),
  name: z.string(),
  destination: z.string(),
  startDate: localDate.nullable(),
  endDate: localDate.nullable(),
  transportation: z.string().nullable(),
  preferences: z.array(z.string()),
  budget: z.number().nullable(),
  constraints: z.string().nullable(),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  status: z.enum(["PLANNING", "READY", "ACTIVE", "COMPLETED", "CANCELLED"]),
  createdAt: instant,
  updatedAt: instant,
  placeCount: z.number().int().nonnegative(),
  visitedCount: z.number().int().nonnegative(),
  memoryCount: z.number().int().nonnegative(),
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
  name: z.string().trim().min(1).max(100),
  destination: z.string().trim().min(1).max(255),
  startDate: localDate,
  endDate: localDate,
  transportation: z.string().max(50).optional(),
  preferences: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  budget: z.number().nonnegative().optional(),
  description: z.string().max(10000).optional(),
  coverImage: z.string().max(2048).optional(),
});
export type CreateTripRequest = z.infer<typeof createTripRequestSchema>;

export const updateTripRequestSchema = createTripRequestSchema.partial().extend({
  status: z.enum(["PLANNING", "READY", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});
export type UpdateTripRequest = z.infer<typeof updateTripRequestSchema>;

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

export const tripEnvelopeSchema = z.object({ success: z.literal(true), data: tripResponseSchema });
export const tripsEnvelopeSchema = z.object({ success: z.literal(true), data: z.array(tripResponseSchema) });
export const tripPlacesEnvelopeSchema = z.object({ success: z.literal(true), data: z.array(tripPlaceResponseSchema) });
export const tripPlaceEnvelopeSchema = z.object({ success: z.literal(true), data: tripPlaceResponseSchema });
