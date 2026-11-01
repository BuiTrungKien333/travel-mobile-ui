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
import { localMemorySchema } from "@/features/memories/schemas/local-memory-schema";

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
  let loadingPhotos: Promise<void> | undefined;
  const exportedPhotos = new Set<string>();
  const exportsInProgress = new Map<string, Promise<void>>();
  return createStore<PreviewState>((set, get) => ({
    ...scenarioSnapshot("returning"),
    today: MOCK_TODAY,
    localPhotoStatus: "idle",
    loadLocalPhotos: () => {
      if (loadingPhotos) return loadingPhotos;
      set({ localPhotoStatus: "loading" });
      loadingPhotos = import(
        "@/features/memories/services/local-memory-storage"
      )
        .then((storage) => storage.readLocalMemories())
        .then((memories) =>
          set((state) => ({
            localPhotoStatus: "ready",
            memories: [
              ...memories.filter(
                (photo) => !state.memories.some((item) => item.id === photo.id),
              ),
              ...state.memories,
            ],
          })),
        )
        .catch(() => {
          loadingPhotos = undefined;
          set({ localPhotoStatus: "error" });
        });
      return loadingPhotos;
    },
    saveLocalPhoto: async ({ uri, tripId, date, stopId }) => {
      if (!/^(file:|content:|blob:|data:image\/)/i.test(uri))
        throw new Error("Invalid local photo");
      await get().loadLocalPhotos();
      if (get().localPhotoStatus !== "ready")
        throw new Error("Local photo storage unavailable");
      const trip = tripId
        ? get().trips.find(
            (item) => item.id === tripId && item.status !== "cancelled",
          )
        : undefined;
      const day = trip?.days.find((item) => item.date === date);
      if (
        tripId &&
        (!trip ||
          !day ||
          (stopId && !day.stops.some((stop) => stop.id === stopId)))
      )
        throw new Error("Invalid photo destination");
      const now = new Date();
      const { createLocalMemory } = await import(
        "@/features/memories/services/local-memory-storage"
      );
      const memory = await createLocalMemory(uri, {
        id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        destination: trip?.destination ?? "",
        text: "",
        date:
          day?.date ??
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
        time: new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now),
        tripId: trip?.id,
        place: day?.stops.find((item) => item.id === stopId)?.name,
        local: { capturedAt: now.toISOString(), deviceSaved: false },
      });
      set((state) => ({ memories: [memory, ...state.memories] }));
      return memory;
    },
    exportLocalPhoto: (id) => {
      const existing = exportsInProgress.get(id);
      if (existing) return existing;
      const operation = (async () => {
        const memory = localMemorySchema.parse(
          get().memories.find((item) => item.id === id),
        );
        if (memory.local.deviceSaved) return;
        if (!exportedPhotos.has(id)) {
          const { saveJournalPhoto } = await import(
            "../services/journal-photo-actions"
          );
          await saveJournalPhoto(memory.photo);
          exportedPhotos.add(id);
        }
        await get().markLocalPhotoSaved(id);
        exportedPhotos.delete(id);
      })().finally(() => {
        exportsInProgress.delete(id);
      });
      exportsInProgress.set(id, operation);
      return operation;
    },
    markLocalPhotoSaved: async (id) => {
      const memory = localMemorySchema.parse(
        get().memories.find((item) => item.id === id),
      );
      const updated = {
        ...memory,
        local: { ...memory.local, deviceSaved: true },
      };
      const { writeLocalMemory } = await import(
        "@/features/memories/services/local-memory-storage"
      );
      await writeLocalMemory(updated);
      set((state) => ({
        memories: state.memories.map((item) =>
          item.id === id ? updated : item,
        ),
      }));
    },
    assignLocalPhoto: async (id, values) => {
      const memory = localMemorySchema.parse(
        get().memories.find((item) => item.id === id),
      );
      const trip = get().trips.find(
        (item) => item.id === values.tripId && item.status !== "cancelled",
      );
      const day = trip?.days.find((item) => item.date === values.day);
      if (
        !trip ||
        !day ||
        (values.stopId && !day.stops.some((item) => item.id === values.stopId))
      )
        throw new Error("Invalid photo destination");
      const updated = {
        ...memory,
        tripId: trip.id,
        date: day.date,
        destination: trip.destination,
        place: day.stops.find((item) => item.id === values.stopId)?.name,
      };
      const { writeLocalMemory } = await import(
        "@/features/memories/services/local-memory-storage"
      );
      await writeLocalMemory(updated);
      set((state) => ({
        memories: state.memories.map((item) =>
          item.id === id ? updated : item,
        ),
      }));
    },
    panel: null,
    openPanel: (panel) => set({ panel }),
    closePanel: () => set({ panel: null }),
    changeScenario: (scenario) =>
      set((state) => ({
        ...scenarioSnapshot(scenario),
        memories: [
          ...state.memories.filter((memory) => memory.local),
          ...scenarioSnapshot(scenario).memories,
        ],
        panel: null,
      })),
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
        memories: state.memories.filter(
          (memory) => memory.tripId !== tripId || memory.local,
        ),
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
    updateMemoryNote: async (id, text) => {
      const memory = get().memories.find((item) => item.id === id);
      if (memory?.local) {
        const { writeLocalMemory } = await import(
          "@/features/memories/services/local-memory-storage"
        );
        await writeLocalMemory(localMemorySchema.parse({ ...memory, text }));
      }
      set((state) => ({
        memories: state.memories.map((memory) =>
          memory.id === id ? { ...memory, text } : memory,
        ),
      }));
    },
    saveCapturedMoment: ({ tripId, date, uri, time, stopId }) => {
      const state = get();
      const trip = state.trips.find((entry) => entry.id === tripId);
      const day = trip?.days.find((entry) => entry.date === date);
      if (
        !trip ||
        !day ||
        trip.status === "cancelled" ||
        !/^(file:|content:|blob:|data:image\/)/i.test(uri) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
        state.memories.length >= PREVIEW_ENTRY_LIMIT
      )
        return null;
      const memory: Memory = {
        id: `photo-${++nextId}`,
        tripId,
        destination: trip.destination,
        date,
        time,
        place: day.stops.find((entry) => entry.id === stopId)?.name,
        photo: uri,
        text: "",
      };
      set({ memories: [memory, ...state.memories] });
      return memory;
    },
    removeMemory: async (id) => {
      const memory = get().memories.find((item) => item.id === id);
      if (memory?.local) {
        const { deleteLocalMemory } = await import(
          "@/features/memories/services/local-memory-storage"
        );
        await deleteLocalMemory(localMemorySchema.parse(memory));
      }
      set((state) => ({
        memories: state.memories.filter((memory) => memory.id !== id),
      }));
    },
  }));
}
