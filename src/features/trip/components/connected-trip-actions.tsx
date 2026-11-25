import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { AppIcon } from "@/components/ui/app-icon";
import { ApiError } from "@/services/api/api-error";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  useUpdateTripMutation,
  useTripDatePreviewMutation,
  useDeleteTripMutation,
} from "../api/trip-queries";
import {
  tripViewModel,
  type TripReadDto,
  type UpdateTripPayload,
  type TripDateImpact,
} from "../api/trip-contract";
import { tripEditPayload } from "../api/trip-edit-payload";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";
import type { TripMutation } from "../types/trip-details-types";
import { TripDetailsSheet } from "./trip-details-sheet";
import { TripEditForm } from "./trip-edit-form";
import { TripDeleteAlert } from "./trip-delete-alert";
import { TripCompletionAction } from "./trip-completion-action";
import { useTripCompletionCopy } from "../i18n/trip-completion-copy";

export function ConnectedTripActions({
  read,
  onClose,
  onReload,
  onDeleted,
}: {
  read: TripReadDto;
  onClose: () => void;
  onReload: () => Promise<TripReadDto | undefined>;
  onDeleted: () => void;
}) {
  const theme = useAppTheme();
  const { copy: detailCopy } = useTripDetailsCopy();
  const { copy } = useTripIntegrationCopy();
  const completionCopy = useTripCompletionCopy();
  const [sheet, setSheet] = useState<"menu" | "edit" | "delete" | "complete">(
    "menu",
  );
  const [version, setVersion] = useState(read.trip.version);
  const [formSession, setFormSession] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [reloading, setReloading] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    payload: UpdateTripPayload;
    impact: TripDateImpact;
  } | null>(null);
  const update = useUpdateTripMutation(read.trip.id);
  const preview = useTripDatePreviewMutation(read.trip.id);
  const remove = useDeleteTripMutation(read.trip.id);
  const busy =
    update.isPending || preview.isPending || remove.isPending || reloading;
  const conflict = error instanceof ApiError && error.code === "TRIP_002";

  function failed(failure: unknown) {
    setError(failure);
  }

  async function save(payload: UpdateTripPayload) {
    try {
      await update.mutateAsync(payload);
      onClose();
      return true;
    } catch (failure) {
      setConfirmation(null);
      failed(failure);
      return false;
    }
  }

  async function commit(mutation: TripMutation) {
    if (busy) return false;
    setError(null);
    const payload = tripEditPayload(mutation, read.trip, version);
    try {
      if (payload.startDate && payload.endDate) {
        const impact = await preview.mutateAsync({
          version,
          startDate: payload.startDate,
          endDate: payload.endDate,
        });

        if (impact.requiresAcknowledgement) {
          setConfirmation({ payload, impact });
          return false;
        }
      }

      return await save(payload);
    } catch (failure) {
      failed(failure);
      return false;
    }
  }

  async function reload() {
    if (busy) return;
    setReloading(true);
    try {
      const latest = await onReload();
      if (!latest) return;
      setVersion(latest.trip.version);
      setFormSession((value) => value + 1);
      setError(null);
    } catch (failure) {
      setError(failure);
    } finally {
      setReloading(false);
    }
  }

  async function deleteTrip() {
    if (busy) return;
    setError(null);
    try {
      await remove.mutateAsync(version);
      onDeleted();
    } catch (failure) {
      failed(failure);
    }
  }
  const errorMessage = error ? tripApiErrorMessage(error, copy) : undefined;
  if (sheet === "complete")
    return (
      <TripCompletionAction
        read={read}
        confirmationOnly
        onReload={onReload}
        onCompleted={onClose}
        onCancel={() => setSheet("menu")}
      />
    );

  if (sheet === "delete")
    return (
      <TripDeleteAlert
        busy={busy}
        title={detailCopy.deleteTitle}
        hint={copy.deletePermanent.replace("{title}", read.trip.title)}
        error={errorMessage}
        destructive={!conflict}
        onConfirm={() => {
          if (conflict) void reload();
          else void deleteTrip();
        }}
        onCancel={onClose}
        confirmLabel={conflict ? copy.reviewLatest : detailCopy.deleteYes}
        cancelLabel={detailCopy.deleteNo}
      />
    );

  return (
    <>
      <TripDetailsSheet
        title={sheet === "edit" ? detailCopy.edit : detailCopy.menu}
        contentKey={sheet}
        dismissDisabled={busy}
        onClose={() => {
          if (!busy) onClose();
        }}
        topSpacing={theme.spacing.xxl}
        contentGap={theme.spacing.sm}
      >
        {sheet === "menu" ? (
          <>
            {read.trip.mode === "LIVE" ? (
              <AppButton
                variant="outline"
                leadingIcon={
                  <AppIcon name="close" size={theme.layout.iconSmall} />
                }
                onPress={() => setSheet("complete")}
              >
                {completionCopy.action}
              </AppButton>
            ) : null}
            <AppButton
              variant="outline"
              leadingIcon={
                <AppIcon name="edit" size={theme.layout.iconSmall} />
              }
              disabled={read.trip.mode === "CANCELLED"}
              onPress={() => {
                setVersion(read.trip.version);
                setSheet("edit");
              }}
            >
              {detailCopy.edit}
            </AppButton>
            <AppButton
              variant="outline"
              leadingIcon={
                <AppIcon name="memories" size={theme.layout.iconSmall} />
              }
              onPress={() => {
                onClose();
                router.push("/tabs/memories");
              }}
            >
              {detailCopy.journal}
            </AppButton>
            <AppButton
              variant="outline"
              leadingIcon={
                <AppIcon
                  name="trash"
                  size={theme.layout.iconSmall}
                  color={theme.colors.error}
                />
              }
              onPress={() => {
                setVersion(read.trip.version);
                setSheet("delete");
              }}
              style={{ borderColor: theme.colors.error }}
            >
              <AppText tone="error" variant="label">
                {detailCopy.delete}
              </AppText>
            </AppButton>
            {read.trip.mode === "CANCELLED" ? (
              <AppText variant="caption" tone="muted">
                {copy.readOnly}
              </AppText>
            ) : null}
          </>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            <TripEditForm
              key={formSession}
              trip={tripViewModel(read.trip, read.trip)}
              today={read.context.evaluatedDate}
              onCommit={commit}
              pending={busy}
              allowPastDates
            />
            {errorMessage ? (
              <AppText accessibilityRole="alert" tone="error">
                {errorMessage}
              </AppText>
            ) : null}
            {conflict ? (
              <AppButton
                variant="outline"
                loading={reloading}
                onPress={() => {
                  void reload();
                }}
              >
                {copy.discardReload}
              </AppButton>
            ) : null}
          </View>
        )}
      </TripDetailsSheet>
      {confirmation ? (
        <TripDeleteAlert
          destructive={false}
          busy={busy}
          title={copy.dateImpactTitle}
          hint={copy.dateImpactHint.replace(
            "{count}",
            String(confirmation.impact.movedToPoolCount),
          )}
          confirmLabel={copy.confirmDates}
          cancelLabel={detailCopy.deleteNo}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            void save({ ...confirmation.payload, acknowledgeDateImpact: true });
          }}
        />
      ) : null}
    </>
  );
}
