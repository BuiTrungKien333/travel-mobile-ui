import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  EnterSection,
  HomePage,
  PreviewNotice,
  SectionHeading,
} from "../components/home-primitives";
import { TripHero } from "../components/trip-hero";
import { ExampleItineraryCard } from "../components/example-itinerary-card";
import { useHomeCopy } from "../i18n/home-copy";

/** Shared onboarding design; the example opens a local sandbox, creation uses the real form. */
export function NewUserHomeScreen({ preview = false }: { preview?: boolean }) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  return (
    <HomePage showHeader>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText accessibilityRole="header" variant="title">
          {copy.greeting}
        </AppText>
        <AppText variant="bodyLarge" tone="muted">
          {copy.newSubtitle}
        </AppText>
      </View>
      <EnterSection animated={false}>
        <TripHero selection={{ kind: "new" }} />
        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeading title={copy.example} variant="eyebrow" />
          <ExampleItineraryCard />
        </View>
        {preview ? (
          <View style={{ paddingTop: theme.spacing.sm }}>
            <PreviewNotice />
          </View>
        ) : null}
      </EnterSection>
    </HomePage>
  );
}
