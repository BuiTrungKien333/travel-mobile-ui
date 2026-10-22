import DateTimePicker from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Keyboard, Platform, Pressable, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { timePickerDate, timePickerValue } from "../utils/time-picker-value";

export type TripStartTimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
};

export function TripStartTimeField({
  value,
  onChange,
  onBlur,
  error,
}: TripStartTimeFieldProps) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const timeLabel = value
    ? `${value.split(":")[0]} ${copy.timeHour.toLocaleLowerCase(locale)} ${value.split(":")[1]} ${copy.timeMinute.toLocaleLowerCase(locale)}`
    : copy.chooseTime;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => timePickerDate(value));
  function close() {
    setOpen(false);
    onBlur();
  }
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label">{copy.startTime}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.chooseTime}${value ? `, ${timeLabel}` : ""}`}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Keyboard.dismiss();
          setDraft(timePickerDate(value));
          setOpen(true);
        }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          minHeight: theme.layout.touchTarget,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: error
            ? theme.colors.error
            : open
              ? theme.colors.focus
              : theme.colors.borderStrong,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        })}
      >
        <AppIcon
          name="clock"
          size={theme.layout.iconSmall}
          color={theme.colors.primaryText}
        />
        <AppText variant="label" style={{ flex: 1 }}>
          {timeLabel}
        </AppText>
        <AppIcon
          name="down"
          size={theme.layout.iconSmall}
          color={theme.colors.textSecondary}
        />
      </Pressable>
      {open ? (
        <>
          <DateTimePicker
            mode="time"
            value={draft}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            is24Hour
            locale={locale === "vi" ? "vi_VN" : "en_GB"}
            themeVariant="light"
            accentColor={theme.colors.primaryText}
            positiveButton={{ label: copy.done }}
            negativeButton={{ label: copy.timeCancel }}
            onValueChange={(_event, date) => {
              if (Platform.OS === "android") {
                onChange(timePickerValue(date));
                close();
              } else setDraft(date);
            }}
            onDismiss={close}
          />
          {Platform.OS === "ios" ? (
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <AppButton variant="outline" style={{ flex: 1 }} onPress={close}>
                {copy.timeCancel}
              </AppButton>
              <AppButton
                style={{ flex: 1 }}
                onPress={() => {
                  onChange(timePickerValue(draft));
                  close();
                }}
              >
                {copy.done}
              </AppButton>
            </View>
          ) : null}
        </>
      ) : null}
      <AppText
        variant="caption"
        tone={error ? "error" : "muted"}
        accessibilityLiveRegion={error ? "polite" : "none"}
      >
        {error || copy.originTimeHint}
      </AppText>
    </View>
  );
}
