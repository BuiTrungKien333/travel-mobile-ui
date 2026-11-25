import { useRef, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { JourneyCard } from "@/features/home/components/journey-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ApiError } from "@/services/api/api-error";
import type { TripReadDto } from "../api/trip-contract";
import { useCompleteTripMutation } from "../api/trip-queries";
import { useTripCompletionCopy } from "../i18n/trip-completion-copy";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";
import { TripDeleteAlert } from "./trip-delete-alert";

export function TripCompletionAction({
  read,
  onReload,
  onCompleted,
  allVisited = false,
  confirmationOnly = false,
  onCancel,
}: {
  read: TripReadDto;
  onReload: () => Promise<TripReadDto | undefined>;
  onCompleted?: () => void;
  allVisited?: boolean;
  confirmationOnly?: boolean;
  onCancel?: () => void;
}) {
  const theme = useAppTheme();
  const copy = useTripCompletionCopy();
  const { copy: errors } = useTripIntegrationCopy();
  const mutation = useCompleteTripMutation(read.trip.id);
  const [version, setVersion] = useState<number | undefined>(
    confirmationOnly ? read.trip.version : undefined,
  );
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const conflict = error instanceof ApiError && error.code === "TRIP_002";

  async function confirm() {
    if (submitting.current || version === undefined) return;
    submitting.current = true;
    setBusy(true);
    try {
      if (conflict) {
        const latest = await onReload();
        if (!latest) return;
        setVersion(latest.trip.version);
        setError(undefined);
        if (latest.trip.mode !== "LIVE") {
          setVersion(undefined);
          onCompleted?.();
        }
        // Ask again with the latest data; never auto-confirm after a conflict.
      } else {
        await mutation.mutateAsync(version);
        setVersion(undefined);
        onCompleted?.();
      }
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (read.trip.mode !== "LIVE") return null;
  const button = (
    <AppButton
      variant="outline"
      disabled={busy}
      leadingIcon={<AppIcon name="close" size={theme.layout.iconSmall} />}
      onPress={() => {
        setError(undefined);
        setVersion(read.trip.version);
      }}
    >
      {copy.action}
    </AppButton>
  );

  return (
    <>
      {confirmationOnly ? null : allVisited ? (
        <JourneyCard>
          <AppText variant="label" tone="primary">
            {copy.allVisited}
          </AppText>
          <AppText variant="caption" tone="muted">
            {copy.suggestion}
          </AppText>
          {button}
        </JourneyCard>
      ) : (
        button
      )}
      {version !== undefined ? (
        <TripDeleteAlert
          destructive={false}
          confirmBorderColor={conflict ? undefined : theme.colors.error}
          title={copy.title}
          hint={copy.hint}
          busy={busy}
          error={error ? tripApiErrorMessage(error, errors) : undefined}
          confirmLabel={conflict ? errors.reviewLatest : copy.action}
          cancelLabel={copy.later}
          onConfirm={() => void confirm()}
          onCancel={() => {
            if (!submitting.current) {
              setVersion(undefined);
              onCancel?.();
            }
          }}
        />
      ) : null}
    </>
  );
}
