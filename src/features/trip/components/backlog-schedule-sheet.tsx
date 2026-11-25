import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import { TripDetailsSheet } from "./trip-details-sheet";

export function BacklogScheduleSheet({
  count,
  days,
  pending,
  problem,
  onReload,
  onSave,
  onClose,
}: {
  count: number;
  days: { date: string; dayNumber: number; stopCount: number }[];
  pending: boolean;
  problem?: string;
  onReload?: () => void;
  onSave: (date: string) => Promise<void>;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useItineraryCopy();
  const [date, setDate] = useState(
    days.find((day) => day.stopCount + count <= 100)?.date,
  );
  const submitting = useRef(false);
  const selected = days.find((day) => day.date === date);
  const full = selected !== undefined && selected.stopCount + count > 100;
  async function submit() {
    if (!selected || full || pending || submitting.current || onReload) return;
    submitting.current = true;
    try {
      await onSave(selected.date);
    } finally {
      submitting.current = false;
    }
  }

  return (
    <TripDetailsSheet
      title={copy.assignTitle}
      onClose={onClose}
      dismissDisabled={pending}
      footer={
        <AppButton
          variant="gradient"
          loading={pending}
          disabled={!selected || full || !!onReload || count === 0}
          onPress={() => void submit()}
        >
          {selected
            ? copy.assignConfirm.replace("{day}", String(selected.dayNumber))
            : copy.day}
        </AppButton>
      }
    >
      <AppText variant="label" tone="primary">
        {copy.selectedCount.replace("{count}", String(count))}
      </AppText>
      <AppText variant="body" tone="muted">
        {copy.assignHint}
      </AppText>
      {problem ? (
        <AppText accessibilityRole="alert" tone="error">
          {problem}
        </AppText>
      ) : null}
      {onReload ? (
        <AppButton variant="outline" size="small" onPress={onReload}>
          {copy.reload}
        </AppButton>
      ) : null}
      <View style={{ gap: theme.spacing.sm }}>
        {days.map((day) => {
          const checked = day.date === date;
          const disabled = pending || day.stopCount + count > 100;
          const label = `${copy.dayLabel} ${day.dayNumber} · ${new Intl.DateTimeFormat(locale, { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${day.date}T12:00:00Z`))}`;

          return (
            <Pressable
              key={day.date}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() => setDate(day.date)}
              style={({ pressed }) => ({
                minHeight: theme.layout.touchTarget,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                borderWidth: checked ? 1 : StyleSheet.hairlineWidth,
                borderColor: checked
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: checked
                  ? theme.colors.surfaceTint
                  : theme.colors.surface,
                opacity: disabled || pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <AppText variant="body">{label}</AppText>
              <AppIcon
                name={checked ? "tick" : "calendar"}
                size={theme.layout.iconSmall}
                color={theme.colors.primaryText}
              />
            </Pressable>
          );
        })}
      </View>
      {full || days.every((day) => day.stopCount + count > 100) ? (
        <AppText accessibilityRole="alert" variant="caption" tone="error">
          {copy.dayCapacity}
        </AppText>
      ) : null}
    </TripDetailsSheet>
  );
}
