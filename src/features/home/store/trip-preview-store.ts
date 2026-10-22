import { createStore } from "zustand/vanilla";
import { MOCK_TODAY, mockTrips } from "../data/home-mocks";
import { recentMemoriesPreview } from "../data/recent-memories-preview";
import {
  captureSamples,
  initialVisited,
  ongoingMemories,
} from "../data/ongoing-preview";
import type { HomeScenario, Memory, Trip } from "../types/home-types";
import type { PreviewState } from "../types/preview-state";
import { dayDistance } from "../utils/select-home";
import { isCalendarDate } from "@/utils/calendar-date";
import { tripFormLimits } from "../../trip/constants/trip-form";
import { applyTripMutation } from "@/features/trip/utils/trip-mutations";

const PREVIEW_ENTRY_LIMIT = 20;

function scenarioSnapshot(scenario: HomeScenario) {
  return {
    scenario,
    trips: mockTrips[scenario],
    memories:
      scenario === "ongoing"
        ? ongoingMemories
        : scenario === "returning" || scenario === "upcoming"
          ? recentMemoriesPreview
          : [],
    visited: initialVisited(scenario),
  };
}

export function createPreviewStore() {
  let nextId = 0;
  return createStore<PreviewState>((set, get) => ({
    ...scenarioSnapshot("returning"),
    today: MOCK_TODAY,
    panel: null,
    openPanel: (panel) => set({ panel }),
    closePanel: () => set({ panel: null }),
    changeScenario: (scenario) =>
      set({
        ...scenarioSnapshot(scenario),
        panel: null,
      }),
    createDraft: (values) => {
      if (get().trips.length >= PREVIEW_ENTRY_LIMIT) return false;
      if (
        values.budget !== undefined &&
        (!Number.isSafeInteger(values.budget) ||
          values.budget < 0 ||
          values.budget > tripFormLimits.budget)
      )
        return false;
      const duration = dayDistance(values.startDate, values.endDate) + 1;
      if (
        !isCalendarDate(values.startDate) ||
        !isCalendarDate(values.endDate) ||
        duration < 1 ||
        duration > tripFormLimits.days
      )
        return false;
      const days = Array.from(
        { length: dayDistance(values.startDate, values.endDate) + 1 },
        (_, index) => {
          const date = new Date(`${values.startDate}T12:00:00Z`);
          date.setUTCDate(date.getUTCDate() + index);
          return {
            date: date.toISOString().slice(0, 10),
            stops: [],
          };
        },
      );
      const trip: Trip = {
        destination: values.destination,
        title: values.title,
        budget:
          values.budget === undefined
            ? undefined
            : { amount: values.budget, currency: "VND" },
        preferences: values.preferences ? [...values.preferences] : undefined,
        unscheduledStops: (values.initialStops ?? []).map((stop) => ({
          ...stop,
          time: "",
        })),
        startDate: values.startDate,
        endDate: values.endDate,
        id: `draft-${++nextId}`,
        status: "draft",
        days,
      };
      set((current) => ({
        trips: [trip, ...current.trips],
        panel: { kind: "plan", tripId: trip.id },
      }));
      return true;
    },
    mutateTrip: (tripId, mutation) => {
      const state = get();
      const trip = state.trips.find((item) => item.id === tripId);
      if (!trip) return false;
      const updated = applyTripMutation(trip, mutation);
      if (!updated) return false;
      set({
        trips: state.trips.map((item) => (item.id === tripId ? updated : item)),
      });
      return true;
    },
    deleteTrip: (tripId) =>
      set((state) => ({
        trips: state.trips.filter((trip) => trip.id !== tripId),
        memories: state.memories.filter((memory) => memory.tripId !== tripId),
        visited: Object.fromEntries(
          Object.entries(state.visited).filter(
            ([key]) => !key.startsWith(`${tripId}:`),
          ),
        ),
        panel: null,
      })),
    setVisited: (tripId, date, stopId, visited) => {
      const state = get();
      if (
        !state.trips
          .find((trip) => trip.id === tripId)
          ?.days.find((day) => day.date === date)
          ?.stops.some((stop) => stop.id === stopId)
      )
        return;
      const key = `${tripId}:${date}`;
      const ids = state.visited[key] ?? [];
      if (ids.includes(stopId) === visited) return;
      set({
        visited: {
          ...state.visited,
          [key]: visited ? [...ids, stopId] : ids.filter((id) => id !== stopId),
        },
      });
    },
    savePhotoMoment: ({ tripId, date, photoId }) => {
      const state = get();
      const trip = state.trips.find((item) => item.id === tripId);
      const day = trip?.days.find((item) => item.date === date);
      const sample = captureSamples.find((item) => item.id === photoId);
      if (
        !trip ||
        !day ||
        !sample ||
        state.memories.length >= PREVIEW_ENTRY_LIMIT
      )
        return null;
      const memory: Memory = {
        id: `photo-${++nextId}`,
        tripId,
        destination: trip.destination,
        date,
        time: new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
        place: day.stops.find((stop) => stop.id === photoId)?.name,
        photo: sample.photo,
        text: "",
      };
      set({ memories: [memory, ...state.memories] });
      return memory;
    },
    updateMemoryNote: (id, text) =>
      set((state) => ({
        memories: state.memories.map((memory) =>
          memory.id === id ? { ...memory, text } : memory,
        ),
      })),
    removeMemory: (id) =>
      set((state) => ({
        memories: state.memories.filter((memory) => memory.id !== id),
      })),
  }));
}
