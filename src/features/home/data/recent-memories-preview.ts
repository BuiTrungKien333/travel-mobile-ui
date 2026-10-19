import { completedDalat } from "./home-mocks";
import { ongoingMemories } from "./ongoing-preview";
import type { Memory } from "../types/home-types";

// Reuse the bundled, attributed photos with dates belonging to the completed trip.
const captures = [
  { date: "2026-09-20", time: "17:30" },
  { date: "2026-09-20", time: "16:10" },
  { date: "2026-09-19", time: "14:20" },
  { date: "2026-09-19", time: "10:45" },
  { date: "2026-09-18", time: "15:30" },
  { date: "2026-09-18", time: "09:15" },
];

export const recentMemoriesPreview: Memory[] = captures.map(
  (capture, index) => ({
    ...ongoingMemories[index],
    ...capture,
    id: `recent-${ongoingMemories[index].id}`,
    tripId: completedDalat.id,
    destination: completedDalat.destination,
  }),
);
