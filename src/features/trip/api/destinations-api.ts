import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";

const count = z.number().int().nonnegative().safe();

export const destinationOptionSchema = z.object({
  id: z.guid(),
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
});

export const destinationPageSchema = z.object({
  content: z.array(destinationOptionSchema).max(100),
  page: count,
  size: count.min(1).max(100),
  totalElements: count,
  totalPages: count,
  context: z.object({
    serverTime: z.iso.datetime(),
    evaluatedDate: z.iso.date(),
  }),
});

export type DestinationOption = z.infer<typeof destinationOptionSchema>;

export const destinationQueryKeys = {
  list: (owner: string | undefined, query: string) =>
    ["destinations", owner, query] as const,
};

export const destinationsApi = {
  async list(query: string, page: number, signal?: AbortSignal) {
    const q = query.trim();
    if (q.length > 120 || !Number.isSafeInteger(page) || page < 0)
      throw new ApiError("INVALID_TRIP");
    const response = await apiClient.get<unknown>("/api/v1/destinations", {
      params: { q, page, size: 20 },
      signal,
    });

    const parsed = z
      .object({ success: z.literal(true), data: destinationPageSchema })
      .safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");

    return parsed.data.data;
  },
};
