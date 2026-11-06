import { z } from "zod";
import { tripRouteSchema } from "@/features/trip/schemas/trip-route-schema";

export const memoryAlbumRouteSchema = tripRouteSchema.pick({ tripId: true });
export const memoryPhotoRouteSchema = memoryAlbumRouteSchema.extend({
  memoryId: tripRouteSchema.shape.tripId,
});
export const memoryCaptureRouteSchema = tripRouteSchema
  .pick({ day: true })
  .extend({
    tripId: tripRouteSchema.shape.tripId.optional(),
    stopId: z.union([tripRouteSchema.shape.tripId, z.literal("")]).optional(),
  });
