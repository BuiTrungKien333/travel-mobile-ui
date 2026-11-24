import { useRef, useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { AppIcon } from "@/components/ui/app-icon";
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
import { TripPlanningErrorCard, TripPlanningLoadingCard } from "../components/trip-planning-feedback";

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
  const problem = planningProblem(error, copy);
  const empty = itinerary.data?.days.every(day => day.stops.length === 0) === true;
  const eligible = trip.data && supportsAiPlanning(trip.data.trip) && empty;
  const conflict = error instanceof ApiError && ["TRIP_008", "TRIP_002", "DRAFT_002"].includes(error.code);
  const errorCode = error instanceof ApiError ? error.code : undefined;
  const canRetryRequest = !!request && !conflict && !["DRAFT_003", "DRAFT_004", "DRAFT_005", "AI_003"].includes(errorCode ?? "");
  const loadError = !failure && (!!trip.error || !!itinerary.error || !!latest.error) && (!trip.data || !itinerary.data);
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
  async function applyDraft() {
    if (lock.current || !draft) return;
    lock.current = true; setFailure(undefined);
    try { await apply.mutateAsync(draft.id); back(); }
    catch (e) { setFailure(e); }
    finally { lock.current = false; }
  }
  function reload() {
    setFailure(undefined); setRequest(undefined);
    void Promise.all([trip.refetch(), itinerary.refetch(), latest.refetch()]);
  }
  return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
        <View style={{ minHeight: theme.layout.buttonHeight, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.close} disabled={apply.isPending} onPress={back}
            style={({ pressed }) => ({ width: 44, height: 44, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.65 : 1 })}>
            <AppIcon name="back" size={theme.layout.iconMedium} />
          </Pressable>
          <AppText variant="title">{copy.title}</AppText>
        </View>
        <AppText variant="body" tone="muted">{copy.scope(trip.data?.trip.dayCount)}</AppText>
        {problem ? <TripPlanningErrorCard title={copy.errorTitle} message={problem}>
          {canRetryRequest ? <AppButton variant="outline" disabled={pending} onPress={() => void generate()}>{copy.retry}</AppButton> : null}
          {failure && !request && draft?.canApply ? <AppButton variant="outline" disabled={pending} onPress={() => void applyDraft()}>{copy.retryApply}</AppButton> : null}
          {failure && request && errorCode === "DRAFT_005" ? <AppButton variant="outline" disabled={pending} onPress={() => {
            setFailure(undefined); setRequest(undefined); setEditing(true);
          }}>{copy.newRequest}</AppButton> : null}
          {!failure && errorCode !== "DRAFT_003" ? <AppButton variant="outline" disabled={pending} onPress={reload}>{copy.reload}</AppButton> : null}
        </TripPlanningErrorCard> : null}
        {busy ? <TripPlanningLoadingCard title={serverPending ? copy.pendingTitle : copy.loadingTitle}
          message={serverPending ? copy.pendingMessage : copy.loadingMessage} /> : loadError ? null : !eligible ? <AppText variant="body">
          {trip.data && trip.data.trip.dayCount > 3 ? copy.tooManyDays(trip.data.trip.dayCount) : copy.unsupported}
        </AppText> : <>
          {draft && !editing ? <>
            <TripPlanningPreview key={draft.id} draft={draft} />
            <AppButton loading={apply.isPending} disabled={!draft.canApply || conflict || !!failure} onPress={() => void applyDraft()}>{copy.apply}</AppButton>
            {apply.isPending ? <TripPlanningLoadingCard title={copy.applyingTitle} message={copy.applyingMessage} /> : null}
            <AppButton variant="outline" disabled={pending} onPress={() => { setEditing(true); setFailure(undefined); }}>{copy.edit}</AppButton>
          </> : trip.data ? <TripPlanningForm key={draft?.id ?? "new"} trip={trip.data.trip} initial={draft?.input} pending={create.isPending} onSubmit={generate} /> : null}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </ScreenSafeArea>;
}

function planningProblem(error: unknown, copy: ReturnType<typeof usePlanningCopy>["copy"]) {
  if (!(error instanceof ApiError)) return error ? copy.generic : undefined;
  switch (error.code) {
    case "CANCELLED": return undefined;
    case "TRIP_008":
    case "TRIP_002": return copy.conflict;
    case "DRAFT_001": return copy.notFound;
    case "DRAFT_002": return copy.expired;
    case "DRAFT_003": return undefined;
    case "DRAFT_004": return copy.unsupported;
    case "DRAFT_005": return copy.failed;
    case "AI_003": return copy.limited;
    case "AI_001":
    case "AI_004":
    case "AI_005": return copy.aiUnavailable;
    case "NETWORK": return copy.network;
    case "TIMEOUT": return copy.timeout;
    case "SERVER": return copy.server;
    default:
      if (error.status === 404) return copy.notFound;
      if (error.status !== undefined && error.status >= 500) return copy.server;
      return copy.generic;
  }
}
