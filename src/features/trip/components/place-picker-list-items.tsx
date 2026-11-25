import { useState } from "react";
import { FlatList, Keyboard, Pressable, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripDay, TripStop } from "@/features/home/types/home-types";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";

export function PlaceTargetSelector({
  days,
  destination,
  date,
  onChange,
}: {
  days: TripDay[];
  destination: string;
  date: string | null;
  onChange: (date: string | null) => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const [open, setOpen] = useState(false);
  const options = [
    ...days.map((day, index) => ({
      date: day.date,
      label: `${copy.day} ${index + 1}, ${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${day.date}T12:00:00Z`))}`,
    })),
    { date: null, label: copy.pool },
  ];
  const selected = options.find((item) => item.date === date);

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xs,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${destination} · ${selected?.label ?? copy.pool}. ${copy.chooseDay}`}
        accessibilityState={{ expanded: open, disabled: !days.length }}
        disabled={!days.length}
        onPress={() => {
          Keyboard.dismiss();
          setOpen((value) => !value);
        }}
        style={({ pressed }) => ({
          minHeight: theme.layout.compactTouchTarget,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        })}
      >
        <AppText variant="label" tone="primary" style={styles.fill}>
          {destination} · {selected?.label ?? copy.pool}
        </AppText>
        {days.length ? (
          <View style={{ transform: [{ rotate: open ? "270deg" : "90deg" }] }}>
            <AppIcon
              name="chevron"
              variant="light"
              size={theme.layout.iconSmall}
              color={theme.colors.primaryText}
            />
          </View>
        ) : null}
      </Pressable>
      {open ? (
        <FlatList
          data={options}
          keyExtractor={(item) => item.date ?? "pool"}
          keyboardShouldPersistTaps="handled"
          style={{
            maxHeight: theme.layout.pickerListMaxHeight,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.softActionBorder,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
          }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: date === item.date }}
              onPress={() => {
                onChange(item.date);
                setOpen(false);
              }}
              style={({ pressed }) => ({
                minHeight: theme.layout.compactTouchTarget,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                backgroundColor:
                  date === item.date
                    ? theme.colors.surfaceTint
                    : theme.colors.surface,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <AppText
                variant="label"
                tone={date === item.date ? "primary" : "muted"}
              >
                {item.label}
              </AppText>
              {date === item.date ? (
                <AppIcon
                  name="tick"
                  size={theme.layout.iconSmall}
                  color={theme.colors.primaryText}
                />
              ) : null}
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}

export function PlaceSearchResultRow({
  place,
  checked,
  onPreview,
  onToggle,
}: {
  place: TripStop;
  checked: boolean;
  onPreview: () => void;
  onToggle: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();

  return (
    <View
      style={[
        styles.row,
        {
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: checked ? theme.spacing.xxs : StyleSheet.hairlineWidth,
          borderColor: checked
            ? theme.colors.primaryText
            : theme.colors.softActionBorder,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${place.name[locale]}, ${place.address?.[locale] ?? copy.customAddress}`}
        onPress={onPreview}
        style={({ pressed }) => [
          styles.row,
          styles.fill,
          {
            gap: theme.spacing.md,
            minHeight: theme.layout.touchTarget,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <View style={[styles.fill, { gap: theme.spacing.xs }]}>
          <AppText
            variant="label"
            tone={checked ? "primary" : "default"}
            style={{ fontFamily: theme.typography.fontFamily.semibold }}
          >
            {place.name[locale]}
          </AppText>
          <AppText variant="caption" tone="muted">
            {place.address?.[locale] ?? copy.customAddress}
          </AppText>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${checked ? copy.remove : copy.select}: ${place.name[locale]}`}
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={({ pressed }) => ({
          width: theme.layout.compactTouchTarget,
          height: theme.layout.compactTouchTarget,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? theme.motion.pressOpacity : 1,
        })}
      >
        <View
          style={{
            width: theme.layout.iconMedium,
            height: theme.layout.iconMedium,
            borderRadius: theme.radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: checked
              ? theme.colors.primaryText
              : theme.colors.borderStrong,
            backgroundColor: checked
              ? theme.colors.primary
              : theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {checked ? (
            <AppIcon
              name="tick"
              size={theme.layout.iconSmall}
              color={theme.colors.onPrimary}
            />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center" },
});
