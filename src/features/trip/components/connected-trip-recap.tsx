import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { memoryApi } from "@/features/home/api/memory-api";
import { memoryApi as mediaApi } from "@/features/memories/api/memory-api";
import { memoryQueryKeys } from "@/features/home/api/memory-query-keys";
import type { Memory } from "@/features/home/types/home-types";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import { useTripIntegrationCopy } from "../i18n/trip-integration-copy";
import { tripQueryKeys } from "../api/trip-query-keys";
import { TripRecapContent } from "./trip-recap-content";

export function ConnectedTripRecap({
  tripId,
  date,
  onJournal,
  destination = "",
  refreshVersion,
}: {
  tripId: string;
  date: string;
  onJournal?: () => void;
  destination?: string;
  refreshVersion?: number;
}) {
  const theme = useAppTheme();
  const owner = useProfile().data?.id;
  const { copy } = useItineraryCopy();
  const { copy: tripCopy } = useTripIntegrationCopy();
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const key = [...memoryQueryKeys.list(owner, tripId), date, page] as const;
  const query = useQuery({
    queryKey: key,
    enabled: !!owner,
    staleTime: 60_000,
    retry: false,
    queryFn: ({ signal }) => memoryApi.list(page, 10, tripId, signal, date),
  });
  const previousRefresh = useRef(refreshVersion);
  const refetch = query.refetch;
  useEffect(() => {
    if (previousRefresh.current === refreshVersion) return;
    previousRefresh.current = refreshVersion;
    void refetch();
  }, [refreshVersion, refetch]);
  const totalPages = query.data?.totalPages;
  if (totalPages !== undefined && page >= totalPages && page > 0)
    setPage(Math.max(0, totalPages - 1));
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const memories: Memory[] = (query.data?.content ?? []).flatMap((m) => {
    const photos = m.media.filter((item) =>
      item.mimeType?.startsWith("image/"),
    );
    const meta = {
      date,
      tripId,
      destination,
      time: time.format(new Date(m.experiencedAt)),
    };
    return photos.length
      ? photos.map((item, index) => ({
          ...meta,
          id: item.id,
          photo: item.url,
          text: index === 0 ? (m.note ?? "") : "",
        }))
      : [{ ...meta, id: m.id, text: m.note ?? "" }];
  });

  if (query.isPending)
    return (
      <AppText variant="body" accessibilityLiveRegion="polite">
        {copy.memoriesLoading}
      </AppText>
    );
  if (query.isError)
    return (
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="body" accessibilityRole="alert">
          {copy.memoriesError}
        </AppText>
        <AppButton
          size="small"
          variant="outline"
          onPress={() => void query.refetch()}
        >
          {tripCopy.retry}
        </AppButton>
      </View>
    );
  return (
    <>
      <TripRecapContent
        memories={memories}
        onJournal={onJournal}
        showAllPhotos={!onJournal}
        onDeletePhoto={async (memory) => {
          const session = authSession.getVersion();
          await mediaApi.removePhoto(memory.id);
          if (session !== authSession.getVersion()) return;
          await Promise.all([
            client.invalidateQueries({
              queryKey: memoryQueryKeys.list(owner, tripId),
            }),
            client.invalidateQueries({ queryKey: memoryQueryKeys.list(owner) }),
            client.invalidateQueries({
              queryKey: tripQueryKeys.dashboard(owner),
            }),
            client.invalidateQueries({
              queryKey: tripQueryKeys.detail(owner, tripId),
            }),
            client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) }),
          ]);
        }}
      />
      {page || !query.data.last ? (
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          {page > 0 ? (
            <AppButton
              size="small"
              variant="outline"
              onPress={() => setPage(page - 1)}
            >
              {copy.previousMemories}
            </AppButton>
          ) : null}
          {!query.data.last ? (
            <AppButton
              size="small"
              variant="outline"
              onPress={() => setPage(page + 1)}
            >
              {tripCopy.more}
            </AppButton>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
