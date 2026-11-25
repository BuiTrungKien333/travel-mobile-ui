import { svgDataUri } from "@/utils/svg-data-uri";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

/** A schematic, deliberately without geographic coordinates or fake map tiles. */
export function TripMapPreview({
  stops,
  height,
  selectedId,
  startLabel,
  onSelect,
  onStart,
  fitContainer = false,
  showStart = true,
}: {
  stops: TripStop[];
  height?: number;
  selectedId?: string;
  startLabel: string;
  onSelect: (stop: TripStop) => void;
  onStart?: () => void;
  fitContainer?: boolean;
  showStart?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const [width, setWidth] = useState(0);
  const graphWidth = Math.max(
    width,
    Math.max(1, stops.length + (showStart ? 1 : 0)) *
      theme.layout.tripMapNodeSpacing,
  );

  const nodes = [
    ...(showStart
      ? [{ id: "start", label: "S", name: startLabel, stop: null }]
      : []),
    ...stops.map((stop, index) => ({
      id: stop.id,
      label: `${index + 1}`,
      name: stop.name[locale],
      stop,
    })),
  ];

  const graphHeight = fitContainer
    ? 100
    : Math.max(
        theme.layout.touchTarget * 2,
        (height ?? theme.layout.tripMapMinimumHeight) - theme.spacing.xxl,
      );

  const points = nodes.map((node, index) => ({
    ...node,
    x: (graphWidth * (index + 0.5)) / nodes.length,
    y: graphHeight * (index % 2 ? 0.65 : 0.35),
  }));

  const path = points
    .map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`)
    .join(" ");

  const source = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${graphWidth} ${graphHeight}" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="${theme.colors.primary}" stroke-width="2" stroke-dasharray="4 5" vector-effect="non-scaling-stroke" /></svg>`,
  );

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        ...(fitContainer ? { flex: 1, minHeight: 0 } : { height }),
        overflow: "hidden",
        borderRadius: fitContainer ? theme.radius.none : theme.radius.lg,
        backgroundColor: theme.colors.surfaceTint,
      }}
    >
      {!fitContainer ? <GlassBackdrop borderRadius={theme.radius.lg} /> : null}
      <ScrollView
        horizontal
        style={fitContainer ? { flex: 1 } : undefined}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          width: graphWidth,
          height: fitContainer ? "100%" : graphHeight,
        }}
      >
        <Image
          source={{ uri: source }}
          contentFit="fill"
          accessible={false}
          style={StyleSheet.absoluteFill}
        />
        {points.map((node) => (
          <Pressable
            key={node.id}
            accessibilityRole="button"
            accessibilityLabel={`${node.label}. ${node.name}`}
            accessibilityHint={copy.jumpStop}
            accessibilityState={{ selected: node.id === selectedId }}
            onPress={() => (node.stop ? onSelect(node.stop) : onStart?.())}
            style={({ pressed }) => ({
              position: "absolute",
              left: node.x - theme.layout.touchTarget / 2,
              top: fitContainer ? `${node.y}%` : node.y,
              marginTop: -theme.layout.touchTarget / 2,
              width: theme.layout.touchTarget,
              height: theme.layout.touchTarget,
              borderRadius: theme.radius.full,
              borderWidth: node.id === selectedId ? 2 : 1,
              borderColor: theme.colors.primary,
              backgroundColor:
                node.id === selectedId
                  ? theme.colors.surfaceTint
                  : theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppText variant="label" tone="primary">
              {node.label}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
      {!stops.length ? (
        <View
          style={{
            position: "absolute",
            right: theme.spacing.md,
            bottom: theme.spacing.md,
            left: theme.layout.tripMapNodeSpacing,
          }}
        >
          <AppText variant="caption" tone="muted">
            {copy.mapEmpty}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
