import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

const presets = ["30", "60", "90"];

export function TripVisitDurationRow({
  stop,
  value,
  onChange,
  onBlur,
  expanded,
  onToggle,
  error,
}: {
  stop: TripStop;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  expanded: boolean;
  onToggle: () => void;
  error?: string;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const [custom, setCustom] = useState(!presets.includes(value));
  return (
    <View
      style={{
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: error
          ? theme.colors.error
          : expanded
            ? theme.colors.primaryText
            : theme.colors.softActionBorder,
        backgroundColor: theme.colors.surface,
        overflow: "hidden",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${stop.name[locale]}, ${value || "—"} ${copy.minutes}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          minHeight: theme.layout.compactTouchTarget,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        })}
      >
        <AppText
          variant="body"
          style={{ flex: 1, minWidth: 0, padding: theme.spacing.sm }}
        >
          {stop.name[locale]}
        </AppText>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "stretch",
            gap: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            backgroundColor: theme.colors.surfaceTint,
          }}
        >
          <AppText variant="caption" tone="primary">
            {value || "—"} {copy.minutes}
          </AppText>
          <AppIcon
            name={expanded ? "up" : "chevron"}
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
        </View>
      </Pressable>
      {expanded ? (
        <View
          style={{
            padding: theme.spacing.sm,
            paddingTop: theme.spacing.sm,
            gap: theme.spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            {[...presets, "other"].map((option) => {
              const selected =
                option === "other" ? custom : !custom && value === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={
                    option === "other"
                      ? copy.dayVisitOther
                      : `${option} ${copy.minutes}`
                  }
                  onPress={() => {
                    setCustom(option === "other");
                    if (option !== "other") {
                      onChange(option);
                      onBlur();
                    }
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    minWidth: 0,
                    minHeight: theme.layout.compactTouchTarget,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: theme.spacing.xs,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: selected
                      ? theme.colors.primaryText
                      : theme.colors.softActionBorder,
                    backgroundColor: selected
                      ? theme.colors.primaryText
                      : theme.colors.surface,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  })}
                >
                  <AppText
                    variant="caption"
                    style={{
                      color: selected
                        ? theme.colors.surface
                        : theme.colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {option === "other"
                      ? copy.dayVisitOther
                      : `${option} ${copy.minutes}`}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {custom ? (
            <AppInput
              compact
              label={copy.dayVisitCustom}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              maxLength={3}
              error={error}
              trailingAction={
                <AppText
                  variant="caption"
                  tone="muted"
                  style={{ paddingRight: theme.spacing.md }}
                >
                  {copy.minutes}
                </AppText>
              }
            />
          ) : error ? (
            <AppText accessibilityRole="alert" variant="caption" tone="error">
              {error}
            </AppText>
          ) : null}
          <AppText variant="caption" tone="muted">
            {copy.dayVisitHint}
          </AppText>
        </View>
      ) : error ? (
        <AppText
          accessibilityRole="alert"
          variant="caption"
          tone="error"
          style={{ padding: theme.spacing.sm }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
