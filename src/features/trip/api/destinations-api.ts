import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";

const optionSchema = z.object({ id: z.guid(), code: z.string(), name: z.string() });
const envelope = z.object({ success: z.literal(true), data: z.object({
  content: z.array(optionSchema), page: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
}) });
export type DestinationOption = z.infer<typeof optionSchema>;

export async function searchDestinations(query: string, signal?: AbortSignal): Promise<DestinationOption[]> {
  const options: DestinationOption[] = [];
  for (let page = 0; ; page++) {
    const response = await apiClient.get<unknown>("/api/v1/destinations", { params: { q: query.trim(), page, size: 100 }, signal });
    const parsed = envelope.safeParse(response.data);
    if (!parsed.success || parsed.data.data.page !== page) throw new ApiError("INVALID_RESPONSE");
    const data = parsed.data.data;
    options.push(...data.content);
    if (page + 1 >= data.totalPages) return options;
    if (!data.content.length) throw new ApiError("INVALID_RESPONSE");
  }
}
