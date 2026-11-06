import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

type DateItem =
  | { key: string; kind: "day"; date: string; index: number }
  | { key: "backlog" | "add"; kind: "backlog" | "add" };

export function TripPlanningDaySelector({
  trip,
  selectedDate,
  backlog,
  backlogCount,
  onSelect,
  onAddDay,
  addDayDisabled,
}: {
  trip: Trip;
  selectedDate?: string;
  backlog: boolean;
  backlogCount: number;
  onSelect: (date: string | null) => void;
  onAddDay?: () => void;
  addDayDisabled: boolean;
}) {
  const theme = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const { copy, locale } = useTripDetailsCopy();
  const width = theme.layout.tripPlanningDateTabWidth * fontScale;
  const data: DateItem[] = [
    ...trip.days.map(
      (day, index): DateItem => ({
        key: day.date,
        kind: "day",
        date: day.date,
        index,
      }),
    ),
    { key: "backlog", kind: "backlog" },
    ...(onAddDay ? [{ key: "add", kind: "add" } as const] : []),
  ];
  const current = backlog
    ? trip.days.length
    : Math.max(
        0,
        trip.days.findIndex((day) => day.date === selectedDate),
      );
  return (
    <FlatList
      horizontal
      data={data}
      style={{ flexGrow: 0 }}
      initialScrollIndex={current}
      getItemLayout={(_, index) => ({
        length: data[index]?.kind === "add" ? theme.layout.touchTarget : width,
        offset: (width + theme.spacing.sm) * index,
        index,
      })}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm }}
      renderItem={({ item }) => {
        if (item.kind === "add")
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.addDay}
              accessibilityHint={addDayDisabled ? copy.dayLimit : undefined}
              accessibilityState={{ disabled: addDayDisabled }}
              disabled={addDayDisabled}
              onPress={onAddDay}
              style={({ pressed }) => ({
                width: theme.layout.touchTarget,
                minHeight: theme.layout.touchTarget,
                alignItems: "center",
                justifyContent: "center",
                opacity:
                  addDayDisabled || pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <AppIcon
                name="plus"
                size={theme.layout.iconSmall}
                color={theme.colors.primaryText}
              />
            </Pressable>
          );
        const selected =
          item.kind === "day"
            ? !backlog && item.date === selectedDate
            : backlog;
        const date =
          item.kind === "day" ? new Date(`${item.date}T12:00:00Z`) : null;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              item.kind === "day"
                ? `${copy.day} ${item.index + 1}, ${new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${item.date}T12:00:00Z`))}`
                : `${copy.pool} (${backlogCount})`
            }
            onPress={() => onSelect(item.kind === "day" ? item.date : null)}
            style={({ pressed }) => ({
              width,
              minHeight: theme.layout.touchTarget,
              paddingVertical: theme.spacing.sm,
              borderTopLeftRadius: theme.radius.md,
              borderTopRightRadius: theme.radius.md,
              backgroundColor: selected ? theme.colors.surfaceTint : undefined,
              justifyContent: "center",
              borderBottomWidth: theme.layout.tripPlanningDateIndicatorHeight,
              borderBottomColor: selected
                ? theme.colors.primary
                : "transparent",
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.xs,
                paddingHorizontal: theme.spacing.sm,
              }}
            >
              <AppText
                variant="caption"
                tone={selected ? "primary" : "muted"}
                style={{ fontFamily: selected ? theme.typography.fontFamily.bold : theme.typography.fontFamily.medium }}
              >
                {item.kind === "day"
                  ? `${copy.day} ${item.index + 1}`
                  : copy.pool}
              </AppText>
              <AppText variant="caption" tone="muted">
                {date
                  ? `${copy.shortWeekdays[date.getUTCDay()]}, ${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`
                  : `(${backlogCount})`}
              </AppText>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
