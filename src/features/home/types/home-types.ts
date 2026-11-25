import type { ImageSource } from "expo-image";

export type HomeScenario = "new" | "upcoming" | "ongoing" | "returning";
export type LocalizedText = { vi: string; en: string };

export type TripStop = {
  id: string;
  placeId?: string;
  tripPlaceId?: string;
  itineraryItemId?: string;
  providerPlaceId?: string;
  time: string;
  name: LocalizedText;
  kind: LocalizedText;
  address?: LocalizedText;
  locationType?: "address";
  location?: { latitude: number; longitude: number };
  durationMinutes?: number;
  pinned?: boolean;
  note?: string;
  visited?: boolean;
  plannedOrder?: number | null;
  quickInfo?: {
    admission?: LocalizedText;
    closesAt?: string;
    sample?: boolean;
  };
};

export type TravelMode = "car" | "motorcycle" | "walk";

export type TripDay = {
  date: string;
  stops: TripStop[];
  startLocation?: string;
  startAddress?: string;
  startCoordinate?: { latitude: number; longitude: number };
  startTime?: string;
  returnToStart?: boolean;
  transport?: TravelMode;
};

export type TripPreference =
  | "nature"
  | "food"
  | "culture"
  | "relaxation"
  | "photography"
  | "adventure"
  | "shopping"
  | "beach";

export type Trip = {
  destinationProvinceId?: string | null;
  serverMode?: "PLANNING" | "LIVE" | "RECAP" | "CANCELLED";
  serverStopCount?: number;
  serverDayCount?: number;
  id: string;
  serverVersion?: number;
  serverItineraryUpdatedAt?: string | null;
  destination: string;
  title?: string;
  budget?: { amount: number; currency: "VND" };
  preferences?: TripPreference[];
  accommodation?: string;
  notes?: string;
  unscheduledStops?: TripStop[];
  startDate?: string;
  endDate?: string;
  status: "draft" | "planned" | "completed" | "cancelled";
  days: TripDay[];
  coverImage?: ImageSource | string | number;
};

export type HomeSelection =
  | { kind: "ongoing"; trip: Trip; dayIndex: number }
  | { kind: "upcoming"; trip: Trip }
  | { kind: "returning" }
  | { kind: "new" };

export type Memory = {
  local?: {
    capturedAt: string;
    deviceSaved: boolean;
    userId?: string;
    clientRequestId?: string;
    serverId?: string;
    uploaded?: boolean;
    placeId?: string;
    width?: number;
    height?: number;
    mimeType?: string;
  };
  remote?: { memoryId: string; mediaId: string; version: number };
  id: string;
  destination: string;
  text: string;
  tripId?: string;
  date?: string;
  time?: string;
  place?: LocalizedText;
  photo?: ImageSource | string | number;
};
