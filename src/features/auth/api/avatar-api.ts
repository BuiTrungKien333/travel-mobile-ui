import { Platform } from "react-native";
import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";

const uploadEnvelope = z.object({
  success: z.literal(true),
  data: z.object({ url: z.url().max(1000).refine((url) => /^https?:\/\//i.test(url)) }),
});

export async function uploadAvatar(uri: string): Promise<string> {
  const body = new FormData();
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) throw new ApiError("LOCAL_PHOTO");
    body.append("file", await response.blob(), "avatar.jpg");
  } else {
    const nativeBody = body as FormData & {
      append(name: string, value: { uri: string; name: string; type: string }): void;
    };
    nativeBody.append("file", { uri, name: "avatar.jpg", type: "image/jpeg" });
  }
  const response = await apiClient.post<unknown>("/api/v1/media/upload", body, { timeout: 60000 });
  const parsed = uploadEnvelope.safeParse(response.data);
  if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
  return parsed.data.data.url;
}
