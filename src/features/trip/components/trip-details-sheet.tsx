import type { ComponentProps } from "react";
import { AppBottomSheet } from "@/components/common/app-bottom-sheet";
import { WeatherAtmosphere } from "@/features/home/components/weather-atmosphere";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

type TripDetailsSheetProps = Omit<
  ComponentProps<typeof AppBottomSheet>,
  "closeLabel" | "decoration"
>;

export function TripDetailsSheet(props: TripDetailsSheetProps) {
  const { copy } = useTripDetailsCopy();

  return (
    <AppBottomSheet
      {...props}
      closeLabel={copy.close}
      decoration={<WeatherAtmosphere />}
    />
  );
}
