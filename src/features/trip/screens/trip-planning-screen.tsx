import { useRef, useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ApiError } from "@/services/api/api-error";
import { createRequestId } from "@/utils/create-request-id";
import { useTripQuery } from "../api/trip-queries";
import { useTripItineraryQuery } from "../api/itinerary-hooks";
import { usePlanningDraft } from "../api/planning-hooks";
import type { CreatePlanningDraft, PlanningInput } from "../api/planning-contract";
import { usePlanningCopy } from "../i18n/planning-copy";
import { supportsAiPlanning } from "../utils/planning-eligibility";
import { TripPlanningForm } from "../components/trip-planning-form";
import { TripPlanningPreview } from "../components/trip-planning-preview";

export function TripPlanningScreen({ tripId }: { tripId?: string }) {
  const theme = useAppTheme();
  const { copy } = usePlanningCopy();
  const trip = useTripQuery(tripId);
  const itinerary = useTripItineraryQuery(tripId);
  const { latest, create, apply } = usePlanningDraft(tripId);
  const [editing, setEditing] = useState(false);
  const [failure, setFailure] = useState<unknown>();
  const [request, setRequest] = useState<CreatePlanningDraft>();
  const lock = useRef(false);
  const pending = create.isPending || apply.isPending;
  const draft = latest.data;
  const serverPending = latest.error instanceof ApiError && latest.error.code === "DRAFT_003";
  const busy = !!tripId && (trip.isPending || itinerary.isPending || latest.isPending || serverPending);
  const error = failure ?? trip.error ?? itinerary.error ?? latest.error;
  const problem = error instanceof ApiError ? error.code === "TRIP_008" || error.code === "TRIP_002" ? copy.conflict
    : error.code === "DRAFT_002" ? copy.expired : error.code === "DRAFT_003" ? undefined : error.code === "DRAFT_005" ? copy.failed
    : error.code === "DRAFT_004" ? copy.unsupported : error.code === "AI_003" ? copy.limited
    : error.status === 404 ? copy.unavailable : copy.generic : error ? copy.generic : undefined;
  const empty = itinerary.data?.days.every(day => day.stops.length === 0) === true;
  const eligible = trip.data && supportsAiPlanning(trip.data.trip) && empty;
  const conflict = error instanceof ApiError && ["TRIP_008", "TRIP_002", "DRAFT_002"].includes(error.code);
  const back = () => {
    if (apply.isPending) return;
    if (router.canGoBack()) router.back();
    else if (tripId) router.replace({ pathname: "/trip/[tripId]", params: { tripId } });
    else router.replace("/tabs/trips");
  };
  async function generate(input?: PlanningInput) {
    if (lock.current || !trip.data) return;
    const payload = input ? { clientRequestId: createRequestId(), expectedTripVersion: trip.data.trip.version, input } : request;
    if (!payload) return;
    setRequest(payload);
    lock.current = true; setFailure(undefined);
    try { await create.mutateAsync(payload); setEditing(false); setRequest(undefined); }
    catch (e) { setFailure(e); }
    finally { lock.current = false; }
  }
  return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <AppButton variant="outline" disabled={apply.isPending} onPress={back}>{copy.close}</AppButton>
        <AppText variant="title">{copy.title}</AppText><AppText tone="muted">{copy.scope}</AppText>
        {problem ? <View style={{ gap: theme.spacing.sm }}>
          <AppText accessibilityRole="alert" tone="error">{problem}</AppText>
          {request && !conflict && !(error instanceof ApiError && ["DRAFT_003", "DRAFT_005"].includes(error.code)) ? <AppButton variant="outline" disabled={pending} onPress={() => void generate()}>{copy.retry}</AppButton> : null}
          <AppButton variant="outline" disabled={pending} onPress={() => {
            setFailure(undefined); setRequest(undefined);
            void Promise.all([trip.refetch(), itinerary.refetch(), latest.refetch()]);
          }}>{copy.reload}</AppButton>
        </View> : null}
        {busy ? <AppText accessibilityLiveRegion="polite">{serverPending ? copy.generating : copy.loading}</AppText> : !eligible ? <AppText>{copy.unsupported}</AppText> : <>
          {draft && !editing ? <>
            <TripPlanningPreview key={draft.id} draft={draft} />
            <AppButton loading={apply.isPending} disabled={!draft.canApply || conflict}
              onPress={() => {
                if (lock.current) return;
                lock.current = true; setFailure(undefined);
                void apply.mutateAsync(draft.id).then(back).catch(setFailure).finally(() => { lock.current = false; });
              }}>{copy.apply}</AppButton>
            <AppButton variant="outline" disabled={pending} onPress={() => { setEditing(true); setFailure(undefined); }}>{draft.proposal.status === "NEEDS_STRUCTURED_INPUT" ? copy.formMode : copy.edit}</AppButton>
          </> : trip.data ? <TripPlanningForm key={draft?.id ?? "new"} trip={trip.data.trip} initial={draft?.input} preferStructured={draft?.proposal.status === "NEEDS_STRUCTURED_INPUT"} pending={create.isPending} onSubmit={generate} /> : null}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </ScreenSafeArea>;
}
