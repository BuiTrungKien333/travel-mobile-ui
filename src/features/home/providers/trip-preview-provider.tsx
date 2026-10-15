import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createStore } from "zustand/vanilla";

import { MOCK_TODAY, mockTrips, suggestedStops } from "../data/home-mocks";
import type { HomeScenario, Memory, Trip } from "../types/home-types";
import { dayDistance } from "../utils/select-home";

type PreviewPanel =
  | { kind: "scenarios" | "create" | "weather" | "sample" }
  | { kind: "plan"; tripId: string; dayIndex?: number }
  | { kind: "moment"; destination: string };
type PreviewState = {
  scenario: HomeScenario;
  trips: Trip[];
  memories: Memory[];
  today: string;
  panel: PreviewPanel | null;
  openPanel: (panel: PreviewPanel) => void;
  closePanel: () => void;
  changeScenario: (scenario: HomeScenario) => void;
  createDraft: (values: {
    destination: string;
    startDate: string;
    endDate: string;
  }) => boolean;
  addStop: (tripId: string, date: string) => void;
  saveMoment: (destination: string, text: string) => boolean;
};

const PREVIEW_ENTRY_LIMIT = 20;

function createPreviewStore() {
  let nextId = 0;
  return createStore<PreviewState>((set, get) => ({
    scenario: "upcoming",
    trips: mockTrips.upcoming,
    memories: [],
    today: MOCK_TODAY,
    panel: null,
    openPanel: (panel) => set({ panel }),
    closePanel: () => set({ panel: null }),
    changeScenario: (scenario) =>
      set({ scenario, trips: mockTrips[scenario], memories: [], panel: null }),
    createDraft: (values) => {
      if (get().trips.length >= PREVIEW_ENTRY_LIMIT) return false;
      const days = Array.from(
        { length: dayDistance(values.startDate, values.endDate) + 1 },
        (_, index) => {
          const date = new Date(`${values.startDate}T12:00:00Z`);
          date.setUTCDate(date.getUTCDate() + index);
          return { date: date.toISOString().slice(0, 10), stops: [] };
        },
      );
      const trip: Trip = {
        ...values,
        id: `draft-${++nextId}`,
        status: "draft",
        days,
      };
      set((current) => ({
        trips: [...current.trips, trip],
        panel: { kind: "plan", tripId: trip.id },
      }));
      return true;
    },
    addStop: (tripId, date) =>
      set((current) => ({
        trips: current.trips.map((trip) =>
          trip.id !== tripId
            ? trip
            : {
                ...trip,
                days: trip.days.map((day) => {
                  if (day.date !== date) return day;
                  const next = suggestedStops(trip.destination).find(
                    (stop) =>
                      !day.stops.some((existing) => existing.id === stop.id),
                  );
                  return next
                    ? {
                        ...day,
                        stops: [...day.stops, next].sort((a, b) =>
                          a.time.localeCompare(b.time),
                        ),
                      }
                    : day;
                }),
              },
        ),
      })),
    saveMoment: (destination, text) => {
      if (get().memories.length >= PREVIEW_ENTRY_LIMIT) return false;
      const memory = { id: `moment-${++nextId}`, destination, text };
      set((current) => ({ memories: [memory, ...current.memories] }));
      return true;
    },
  }));
}

const PreviewContext = createContext<ReturnType<
  typeof createPreviewStore
> | null>(null);

/** Session-scoped fixture store; Context supplies its identity, Zustand owns UI state. */
export function TripPreviewProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createPreviewStore);
  return (
    <PreviewContext.Provider value={store}>{children}</PreviewContext.Provider>
  );
}

export function useTripPreview<T>(selector: (state: PreviewState) => T): T {
  const store = useContext(PreviewContext);
  if (!store) throw new Error("TripPreviewProvider is required");
  return useStore(store, useShallow(selector));
}
