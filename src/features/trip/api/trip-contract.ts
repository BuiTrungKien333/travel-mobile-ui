import { z } from "zod";
import type { Trip } from "@/features/home/types/home-types";

const id = z.guid();
const calendarDate = z.iso.date();
const count = z.number().int().nonnegative().safe();

export const tripPreferenceSchema = z.enum([
  "nature",
  "food",
  "culture",
  "relaxation",
  "photography",
  "adventure",
  "shopping",
  "beach",
]);

export const tripSummarySchema = z.object({
  id,
  title: z.string(),
  destination: z.object({ name: z.string(), provinceId: id.nullable() }),
  startDate: calendarDate.nullable(),
  endDate: calendarDate.nullable(),
  timeZone: z.literal("Asia/Ho_Chi_Minh"),
  status: z.enum(["PLANNING", "READY", "ACTIVE", "COMPLETED", "CANCELLED"]),
  mode: z.enum(["PLANNING", "LIVE", "RECAP", "CANCELLED"]),
  readiness: z.object({
    hasDates: z.boolean(),
    hasPlaces: z.boolean(),
    unscheduledCount: count,
  }),
  dayCount: count.max(365),
  stopCount: count,
  memoryCount: count,
  coverImageUrl: z.url().nullable(),
  version: count,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const tripDetailSchema = tripSummarySchema.extend({
  budget: z
    .object({
      amount: count.max(1_000_000_000_000),
      currency: z.literal("VND"),
    })
    .nullable(),
  preferences: z.array(tripPreferenceSchema).max(8),
  accommodation: z.string().nullable(),
  notes: z.string().nullable(),
  days: z
    .array(
      z.object({ id, date: calendarDate, dayNumber: count.min(1).max(365) }),
    )
    .max(365),
});

const context = z.object({
  serverTime: z.iso.datetime(),
  evaluatedDate: calendarDate,
});

export const tripReadSchema = z.object({ trip: tripDetailSchema, context });

export const tripPageSchema = z.object({
  content: z.array(tripSummarySchema).max(100),
  page: count,
  size: count.min(1).max(100),
  totalElements: count,
  totalPages: count,
  context,
});

export type TripSummaryDto = z.infer<typeof tripSummarySchema>;
export type TripDetailDto = z.infer<typeof tripDetailSchema>;
export type TripReadDto = z.infer<typeof tripReadSchema>;

const mutationFields = {
  title: z.string().trim().min(1).max(120).optional(),
  destination: z
    .object({
      name: z.string().trim().min(1).max(120),
      provinceId: id.nullable().optional(),
    })
    .strict()
    .optional(),
  startDate: calendarDate.optional(),
  endDate: calendarDate.optional(),
  budget: z
    .object({
      amount: count.max(1_000_000_000_000),
      currency: z.literal("VND"),
    })
    .strict()
    .nullable()
    .optional(),
  preferences: z
    .array(tripPreferenceSchema)
    .max(8)
    .refine((values) => new Set(values).size === values.length)
    .optional(),
  accommodation: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
};

export const updateTripSchema = z
  .object({
    version: count,
    ...mutationFields,
    acknowledgeDateImpact: z.boolean().optional(),
  })
  .strict()
  .refine((value) =>
    Object.keys(mutationFields).some((key) => Object.hasOwn(value, key)),
  )
  .refine(
    (value) =>
      (value.startDate === undefined && value.endDate === undefined) ||
      (value.startDate !== undefined &&
        value.endDate !== undefined &&
        value.endDate >= value.startDate &&
        (Date.parse(value.endDate) - Date.parse(value.startDate)) / 86400000 <
          365),
  );

export const datePreviewRequestSchema = z
  .object({ version: count, startDate: calendarDate, endDate: calendarDate })
  .strict()
  .refine(
    (value) =>
      value.endDate >= value.startDate &&
      (Date.parse(value.endDate) - Date.parse(value.startDate)) / 86400000 <
        365,
  );

export const dateImpactSchema = z.object({
  baseVersion: count,
  startDate: calendarDate,
  endDate: calendarDate,
  dayCount: count.min(1).max(365),
  removedDates: z.array(calendarDate).max(365),
  addedDates: z.array(calendarDate).max(365),
  movedToPoolCount: count,
  requiresAcknowledgement: z.boolean(),
});

export type UpdateTripPayload = z.infer<typeof updateTripSchema>;
export type DatePreviewRequest = z.infer<typeof datePreviewRequestSchema>;
export type TripDateImpact = z.infer<typeof dateImpactSchema>;

export type CreateTripPayload = {
  clientRequestId: string;
  title?: string;
  destination: { name: string; provinceId?: string | null };
  startDate: string;
  endDate: string;
  timeZone: "Asia/Ho_Chi_Minh";
  budget: { amount: number; currency: "VND" } | null;
  preferences: z.infer<typeof tripPreferenceSchema>[];
  initialPlaceIds: string[];
};

/** Presentation adapter only. Server counts/mode remain available; no copied query store. */
export function tripViewModel(
  dto: TripSummaryDto,
  detail?: TripDetailDto,
): Trip {
  return {
    id: dto.id,
    title: dto.title,
    destination: dto.destination.name,
    destinationProvinceId: dto.destination.provinceId,
    startDate: dto.startDate ?? undefined,
    endDate: dto.endDate ?? undefined,
    status:
      dto.mode === "CANCELLED"
        ? "cancelled"
        : dto.mode === "RECAP"
          ? "completed"
          : "planned",
    serverMode: dto.mode,
    serverDayCount: dto.dayCount,
    serverStopCount: dto.stopCount,
    coverImage: dto.coverImageUrl ?? undefined,
    days: detail?.days.map((day) => ({ date: day.date, stops: [] })) ?? [],
    budget: detail?.budget ?? undefined,
    preferences: detail?.preferences,
    accommodation: detail?.accommodation ?? undefined,
    notes: detail?.notes ?? undefined,
  };
}

export function tripLocalToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

/** Correlation/deduplication key only, never an authentication credential. */
export function createTripRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (letter) => {
    const n = Math.floor(Math.random() * 16);
    return (letter === "x" ? n : (n & 3) | 8).toString(16);
  });
}
