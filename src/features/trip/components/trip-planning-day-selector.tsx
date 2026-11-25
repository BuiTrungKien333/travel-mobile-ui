import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

type DateItem =
  | { key: string; kind: "day"; date: string; index: number }
  | { key: "backlog"; kind: "backlog" }
  | { key: "add"; kind: "add" };

export function TripPlanningDaySelector({
  trip,
  selectedDate,
  onSelect,
  onAddDay,
  addDayDisabled,
  backlogCount = trip.unscheduledStops?.length ?? 0,
  showBacklog = true,
}: {
  trip: Trip;
  selectedDate?: string;
  onSelect: (date: string | null) => void;
  onAddDay?: () => void;
  addDayDisabled: boolean;
  backlogCount?: number;
  showBacklog?: boolean;
}) {
  const theme = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const { copy, locale } = useTripDetailsCopy();
  const width = theme.layout.tripPlanningDateTabWidth * fontScale;
  const data: DateItem[] = [
    ...trip.days.map((day, index): DateItem => ({
      key: day.date,
      kind: "day",
      date: day.date,
      index,
    })),
    ...(showBacklog ? [{ key: "backlog", kind: "backlog" } as const] : []),
    ...(onAddDay ? [{ key: "add", kind: "add" } as const] : []),
  ];

  const current = Math.max(
    0,
    selectedDate
      ? trip.days.findIndex((day) => day.date === selectedDate)
      : trip.days.length,
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

        if (item.kind === "backlog") {
          const selected = selectedDate === undefined;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={`${copy.pool} (${backlogCount})`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(null)}
              style={({ pressed }) => ({
                width,
                minHeight: theme.layout.touchTarget,
                paddingVertical: theme.spacing.sm,
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.xs,
                borderBottomWidth: theme.layout.tripPlanningDateIndicatorHeight,
                borderBottomColor: selected
                  ? theme.colors.primary
                  : "transparent",
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <AppText
                variant="label"
                numberOfLines={2}
                style={{ textAlign: "center" }}
              >
                {copy.pool}
              </AppText>
              <AppText variant="caption" tone="muted">
                {backlogCount}
              </AppText>
            </Pressable>
          );
        }
        const selected = item.date === selectedDate;
        const date = new Date(`${item.date}T12:00:00Z`);

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${copy.day} ${item.index + 1}, ${new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(date)}`}
            onPress={() => onSelect(item.date)}
            style={({ pressed }) => ({
              width,
              minHeight: theme.layout.touchTarget,
              paddingVertical: theme.spacing.sm,
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
              <AppText variant="label">
                {`${copy.day} ${item.index + 1}`}
              </AppText>
              <AppText variant="caption" tone="muted">
                {`${copy.shortWeekdays[date.getUTCDay()]}, ${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`}
              </AppText>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
