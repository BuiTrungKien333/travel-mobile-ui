import type { CSSProperties } from "react";
import { View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { timePickerDate } from "../utils/time-picker-value";
import type { TripStartTimeFieldProps } from "./trip-start-time-field";

const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

export function TripStartTimeField({
  value,
  onChange,
  onBlur,
  error,
}: TripStartTimeFieldProps) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const date = timePickerDate(value);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const selectStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: theme.layout.touchTarget,
    padding: theme.spacing.sm,
    border: 0,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    outlineColor: theme.colors.focus,
    cursor: "pointer",
  };
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label">{copy.startTime}</AppText>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: error ? theme.colors.error : theme.colors.borderStrong,
          backgroundColor: theme.colors.surface,
        }}
      >
        <AppIcon
          name="clock"
          size={theme.layout.iconSmall}
          color={theme.colors.primaryText}
        />
        <select
          aria-label={`${copy.startTime}: ${copy.timeHour}`}
          aria-invalid={!!error}
          value={value ? hour : ""}
          onBlur={onBlur}
          onChange={(event) => onChange(`${event.target.value}:${minute}`)}
          style={selectStyle}
        >
          <option value="" disabled>
            {copy.timeHour}
          </option>
          {hours.map((item) => (
            <option key={item} value={item}>
              {item} {copy.timeHour.toLocaleLowerCase(locale)}
            </option>
          ))}
        </select>
        <AppText tone="muted">:</AppText>
        <select
          aria-label={`${copy.startTime}: ${copy.timeMinute}`}
          aria-invalid={!!error}
          value={value ? minute : ""}
          onBlur={onBlur}
          onChange={(event) => onChange(`${hour}:${event.target.value}`)}
          style={selectStyle}
        >
          <option value="" disabled>
            {copy.timeMinute}
          </option>
          {minutes.map((item) => (
            <option key={item} value={item}>
              {item} {copy.timeMinute.toLocaleLowerCase(locale)}
            </option>
          ))}
        </select>
      </View>
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
