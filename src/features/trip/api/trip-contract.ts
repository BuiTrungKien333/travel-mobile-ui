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
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]),
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
