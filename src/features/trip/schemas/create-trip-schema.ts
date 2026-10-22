import { isCalendarDate } from "@/utils/calendar-date";
import { z } from "zod";
import { dayDistance } from "../../home/utils/select-home";
import type { TripStop } from "../../home/types/home-types";
import { tripFormLimits, tripPreferenceIds } from "../constants/trip-form";

export type TripValidationCopy = {
  destinationRequired: string;
  destinationTooLong: string;
  dateRequired: string;
  invalidDate: string;
  pastDate: string;
  dateOrder: string;
  dateRange: string;
  titleTooLong: string;
  invalidBudget: string;
};
export function createTripSchema(copy: TripValidationCopy, today: string) {
  const date = z
    .string()
    .min(1, copy.dateRequired)
    .refine((value) => !value || isCalendarDate(value), copy.invalidDate);
  return z
    .object({
      destination: z
        .string()
        .trim()
        .min(1, copy.destinationRequired)
        .max(tripFormLimits.destination, copy.destinationTooLong),
      startDate: date,
      endDate: date,
      title: z.string().trim().max(tripFormLimits.title, copy.titleTooLong),
      budget: z
        .string()
        .refine(
          (value) =>
            value === "" ||
            (/^\d+$/.test(value) &&
              Number.isSafeInteger(Number(value)) &&
              Number(value) <= tripFormLimits.budget),
          copy.invalidBudget,
        )
        .transform((value) => (value === "" ? undefined : Number(value))),
      preferences: z.array(z.enum(tripPreferenceIds)),
      initialStops: z.array(z.custom<TripStop>()),
    })
    .superRefine((value, context) => {
      if (!isCalendarDate(value.startDate) || !isCalendarDate(value.endDate))
        return;
      if (value.startDate < today)
        context.addIssue({
          code: "custom",
          path: ["startDate"],
          message: copy.pastDate,
        });
      if (value.endDate < value.startDate)
        context.addIssue({
          code: "custom",
          path: ["endDate"],
          message: copy.dateOrder,
        });
      else if (
        dayDistance(value.startDate, value.endDate) + 1 >
        tripFormLimits.days
      )
        context.addIssue({
          code: "custom",
          path: ["endDate"],
          message: copy.dateRange,
        });
    });
}
export type CreateTripInput = z.input<ReturnType<typeof createTripSchema>>;
export type CreateTripOutput = z.output<ReturnType<typeof createTripSchema>>;
