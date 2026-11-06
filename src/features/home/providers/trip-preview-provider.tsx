// @refresh reset
// Recreate the session fixture store when this module changes during UI development.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createPreviewStore } from "../store/trip-preview-store";
import type { PreviewState } from "../types/preview-state";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { useAuthStore } from "@/store/use-auth-store";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { ActivityIndicator, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useMemoriesCopy } from "@/features/memories/i18n/memories-copy";

const PreviewContext = createContext<ReturnType<
  typeof createPreviewStore
> | null>(null);

/** Session-scoped fixture store; Context supplies its identity, Zustand owns UI state. */
export function TripPreviewProvider({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const generation = useAuthStore((state) => state.sessionVersion);
  const { copy } = useMemoriesCopy();
  const userId = authSession.getUserId();
  if (!UI_PREVIEW_ENABLED && (!userId || profile.data?.id !== userId)) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    {profile.isError ? <><AppText accessibilityRole="alert">{copy.loadError}</AppText><AppButton onPress={() => void profile.refetch()}>{copy.retry}</AppButton></>
      : <ActivityIndicator />}
  </View>;
  return <SessionPreviewProvider key={`${userId ?? "preview"}:${generation}`} userId={userId ?? undefined} generation={generation}>
    {children}
  </SessionPreviewProvider>;
}

function SessionPreviewProvider({ children, userId, generation }: { children: ReactNode; userId?: string; generation: number }) {
  const [store] = useState(() => createPreviewStore(userId, () => !userId ||
    (authSession.getVersion() === generation && authSession.getUserId() === userId)));
  useEffect(() => {
    void store.getState().loadLocalPhotos();
  }, [store]);
  return (
    <PreviewContext.Provider value={store}>{children}</PreviewContext.Provider>
  );
}

export function useTripPreview<T>(selector: (state: PreviewState) => T): T {
  const store = useContext(PreviewContext);
  if (!store) throw new Error("TripPreviewProvider is required");
  return useStore(store, useShallow(selector));
}
