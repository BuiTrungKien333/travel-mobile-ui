import { View } from "react-native";
import type { ReactNode } from "react";
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
export function NewUserHomeScreen({
  preview = false,
  onRefresh,
  refreshing,
  notice,
}: {
  preview?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  notice?: ReactNode;
}) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();

  return (
    <HomePage showHeader onRefresh={onRefresh} refreshing={refreshing}>
      {notice}
      <View style={{ gap: theme.spacing.xs }}>
        <AppText
          accessibilityRole="header"
          variant="title"
          style={{
            fontSize: theme.typography.fontSize.xl,
            lineHeight: theme.typography.lineHeight.xl,
          }}
        >
          {copy.greeting}
        </AppText>
        <AppText variant="body" tone="muted">
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
