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

export const memoriesPageSchema = z
  .object({
    content: z.array(memoryResponseSchema),
    number: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    first: z.boolean(),
    last: z.boolean(),
  })
  .passthrough();

export const memoriesEnvelopeSchema = z.object({
  success: z.literal(true),
  data: memoriesPageSchema,
});
