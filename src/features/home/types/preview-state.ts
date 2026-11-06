import type { CapturePhotoId } from "../data/ongoing-preview";
import type { LocalMemory } from "@/features/memories/schemas/local-memory-schema";
import type { TripMutation } from "@/features/trip/types/trip-details-types";
import type {
  HomeScenario,
  Memory,
  Trip,
  TripStop,
  TripPreference,
} from "./home-types";

export type PreviewPanel =
  | {
      kind:
        | "scenarios"
        | "create"
        | "sample"
        | "capture-start"
        | "notifications";
    }
  | { kind: "plan"; tripId: string; dayIndex?: number };
export type JourneyPanel =
  | { kind: "camera"; tripId: string; date: string; stopId?: string }
  | { kind: "journal"; tripId: string; date?: string }
  | { kind: "current-weather"; tripId: string }
  | { kind: "trip-details"; tripId: string };
export type PreviewState = {
  scenario: HomeScenario;
  trips: Trip[];
  memories: Memory[];
  localPhotoStatus: "idle" | "loading" | "ready" | "error";
  localPhotoIssues: number;
  unownedLocalPhotos: number;
  getLocalPhotos: () => Memory[];
  loadLocalPhotos: () => Promise<void>;
  saveLocalPhoto: (values: {
    uri: string;
    tripId?: string;
    date?: string;
    stopId?: string;
    remoteTrip?: Trip;
    local?: Partial<LocalMemory["local"]>;
  }) => Promise<LocalMemory>;
  persistLocalPhoto: (memory: LocalMemory) => Promise<void>;
  markLocalPhotoSaved: (id: string) => Promise<void>;
  exportLocalPhoto: (id: string) => Promise<void>;
  assignLocalPhoto: (
    id: string,
    values: { tripId: string; day: string; stopId: string },
    remoteTrip?: Trip,
  ) => Promise<void>;
  today: string;
  panel: PreviewPanel | JourneyPanel | null;
  openPanel: (panel: PreviewPanel | JourneyPanel) => void;
  closePanel: () => void;
  changeScenario: (scenario: HomeScenario) => void;
  createDraft: (values: {
    id?: string;
    destination: string;
    startDate: string;
    endDate: string;
    title?: string;
    initialStops?: TripStop[];
    budget?: number;
    preferences?: TripPreference[];
  }) => boolean;
  linkTrip: (tripId: string, serverId: string) => Promise<void>;
  mutateTrip: (tripId: string, mutation: TripMutation) => boolean;
  deleteTrip: (tripId: string) => void;
  visited: Record<string, string[]>;
  setVisited: (
    tripId: string,
    date: string,
    stopId: string,
    visited: boolean,
  ) => void;
  savePhotoMoment: (values: {
    tripId: string;
    date: string;
    photoId: CapturePhotoId;
  }) => Memory | null;
  updateMemoryNote: (id: string, text: string) => void | Promise<void>;
  saveCapturedMoment: (values: {
    tripId: string;
    date: string;
    uri: string;
    time: string;
    stopId?: string;
  }) => Memory | null;
  removeMemory: (id: string) => void | Promise<void>;
};
