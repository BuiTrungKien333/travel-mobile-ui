import { z } from "zod";

const instant = z.iso.datetime({ offset: true });
const nullableText = z.string().nullable();

export const memoryMediaSchema = z.object({
  id: z.guid(),
  url: z.url(),
  mimeType: nullableText,
  fileSize: z.number().int().nonnegative().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  displayOrder: z.number().int().nonnegative(),
  createdAt: instant,
});
export type MemoryMedia = z.infer<typeof memoryMediaSchema>;

export const memoryResponseSchema = z.object({
  id: z.guid(),
  userId: z.guid(),
  tripId: z.guid().nullable(),
  placeId: z.guid().nullable(),
  note: nullableText,
  experiencedAt: instant,
  coverImageUrl: z.url().nullable(),
  mediaCount: z.number().int().nonnegative(),
  media: z.array(memoryMediaSchema),
  createdAt: instant,
  updatedAt: instant,
});
export type MemoryResponse = z.infer<typeof memoryResponseSchema>;

export const memoriesPageSchema = z.object({
  content: z.array(memoryResponseSchema),
  number: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
}).passthrough();

export const memoriesEnvelopeSchema = z.object({
  success: z.literal(true),
  data: memoriesPageSchema,
});
export const memoryEnvelopeSchema = z.object({
  success: z.literal(true),
  data: memoryResponseSchema,
});
export const uploadedMediaSchema = z.object({
  mediaId: z.guid(),
  url: z.url(),
  publicId: z.string(),
  mimeType: z.string().nullable(),
  fileSize: z.number().int().nonnegative().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});
export const uploadedMediaEnvelopeSchema = z.object({
  success: z.literal(true),
  data: uploadedMediaSchema,
});

export const createMemoryRequestSchema = z.object({
  tripId: z.guid(),
  placeId: z.guid().optional(),
  note: z.string().trim().max(2000).optional(),
  experiencedAt: instant.optional(),
});
export type CreateMemoryRequest = z.infer<typeof createMemoryRequestSchema>;
