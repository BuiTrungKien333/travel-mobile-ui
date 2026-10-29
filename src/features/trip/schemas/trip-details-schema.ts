import { z } from "zod";
import { isCalendarDate } from "@/utils/calendar-date";
import { dayDistance } from "@/features/home/utils/select-home";
import {
  tripFormLimits,
  tripPreferenceIds,
  tripTransportModes,
} from "../constants/trip-form";
import type { TripDetailsCopy } from "../i18n/trip-details-copy";

export const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export function tripInfoSchema(copy: TripDetailsCopy) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, copy.invalidName)
      .max(tripFormLimits.title, copy.invalidName),
    accommodation: z.string().trim().max(200, copy.invalidText),
    notes: z.string().trim().max(1000, copy.invalidText),
    budget: z
      .string()
      .refine(
        (value) =>
          !value ||
          (/^\d+$/.test(value) && Number(value) <= tripFormLimits.budget),
        copy.invalidBudget,
      )
      .transform((value) =>
        value ? { amount: Number(value), currency: "VND" as const } : undefined,
      ),
    preferences: z.array(z.enum(tripPreferenceIds)),
  });
}
export function tripEditSchema(copy: TripDetailsCopy) {
  return tripInfoSchema(copy)
    .extend({
      destination: z
        .string()
        .trim()
        .min(1, copy.editDestinationRequired)
        .max(tripFormLimits.destination, copy.invalidText),
      startDate: z.string(),
      endDate: z.string(),
    })
    .superRefine(({ startDate, endDate }, context) => {
      if (!startDate && !endDate) return;
      if (
        !isCalendarDate(startDate) ||
        !isCalendarDate(endDate) ||
        endDate < startDate ||
        dayDistance(startDate, endDate) >= tripFormLimits.days
      ) {
        context.addIssue({
          code: "custom",
          path: ["startDate"],
          message: copy.editInvalidDates,
        });
      }
    });
}

export function stopDetailsSchema(copy: TripDetailsCopy) {
  return z.object({
    time: z
      .string()
      .refine((value) => !value || clockPattern.test(value), copy.invalidTime),
    durationMinutes: z
      .string()
      .regex(/^\d+$/, copy.invalidDuration)
      .transform(Number)
      .refine((value) => value >= 5 && value <= 480, copy.invalidDuration),
    pinned: z.boolean(),
    note: z.string().trim().max(500, copy.invalidText),
    targetDate: z.string().nullable(),
  });
}
export function daySettingsSchema(copy: TripDetailsCopy) {
  return z.object({
    startLocation: z.string().trim().max(200, copy.invalidText),
    startTime: z
      .string()
      .refine((value) => !value || clockPattern.test(value), copy.invalidTime),
    returnToStart: z.boolean(),
    transport: z.enum(tripTransportModes),
  });
}

export function tripStartPointSchema(copy: TripDetailsCopy) {
  return daySettingsSchema(copy)
    .omit({ transport: true })
    .superRefine((value, context) => {
      if (value.returnToStart && !value.startLocation) {
        context.addIssue({
          code: "custom",
          path: ["startLocation"],
          message: copy.startRequiredForReturn,
        });
      }
    });
}

export function tripDayScheduleSchema(copy: TripDetailsCopy) {
  return tripStartPointSchema(copy).and(
    z.object({
      durations: z.array(
        z.object({
          stopId: z.string().min(1),
          minutes: z
            .string()
            .regex(/^\d+$/, copy.invalidDuration)
            .transform(Number)
            .refine(
              (value) => value >= 5 && value <= 480,
              copy.invalidDuration,
            ),
        }),
      ),
    }),
  );
}
