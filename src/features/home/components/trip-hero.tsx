import type { HomeSelection } from "../types/home-types";
import { JourneyInvitationCard } from "./journey-invitation-card";
import { UpcomingTripCard } from "./upcoming-trip-card";

type HomeHeroSelection = Exclude<HomeSelection, { kind: "ongoing" }>;

/** The active-trip dashboard has its own hero in OngoingHomeScreen. */
export function TripHero({ selection }: { selection: HomeHeroSelection }) {
  if (selection.kind === "upcoming") {
    return <UpcomingTripCard trip={selection.trip} />;
  }
  return <JourneyInvitationCard variant={selection.kind} />;
}
