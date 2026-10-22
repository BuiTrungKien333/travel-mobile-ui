import type { CapturePhotoId } from "../data/ongoing-preview";
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
  today: string;
  panel: PreviewPanel | JourneyPanel | null;
  openPanel: (panel: PreviewPanel | JourneyPanel) => void;
  closePanel: () => void;
  changeScenario: (scenario: HomeScenario) => void;
  createDraft: (values: {
    destination: string;
    startDate: string;
    endDate: string;
    title?: string;
    initialStops?: TripStop[];
    budget?: number;
    preferences?: TripPreference[];
  }) => boolean;
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
  updateMemoryNote: (id: string, text: string) => void;
  removeMemory: (id: string) => void;
};
