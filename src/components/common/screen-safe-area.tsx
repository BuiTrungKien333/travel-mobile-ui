import { View, type ViewProps } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { useScreenInsets } from "@/hooks/use-screen-insets";

type ScreenSafeAreaProps = ViewProps & { edges?: readonly Edge[] };
const allEdges: readonly Edge[] = ["top", "left", "right", "bottom"];

/** Use once at the screen boundary. Keep visual content spacing inside this frame. */
export function ScreenSafeArea({
  edges = allEdges,
  style,
  ...props
}: ScreenSafeAreaProps) {
  const insets = useScreenInsets();

  return (
    <View
      {...props}
      style={[
        style,
        {
          paddingTop: edges.includes("top") ? insets.top : 0,
          paddingLeft: edges.includes("left") ? insets.left : 0,
          paddingRight: edges.includes("right") ? insets.right : 0,
          paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
        },
      ]}
    />
  );
}
