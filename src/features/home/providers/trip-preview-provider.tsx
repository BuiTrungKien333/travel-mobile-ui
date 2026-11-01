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

const PreviewContext = createContext<ReturnType<
  typeof createPreviewStore
> | null>(null);

/** Session-scoped fixture store; Context supplies its identity, Zustand owns UI state. */
export function TripPreviewProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createPreviewStore);
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
