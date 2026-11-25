import { useEffect, useRef } from "react";
import type { FlatList } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

/** Variable height rows need a bounded retry after FlatList measures distant cells. */
export function useTripTimelineScroll<T>(selectionKey: string, viewOffset = 0) {
  const list = useRef<FlatList<T>>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ index: number; retries: number } | null>(null);
  const reduceMotion = useReducedMotion();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      pending.current = null;
    },
    [selectionKey],
  );

  function jump(index: number) {
    if (timer.current) clearTimeout(timer.current);
    pending.current = { index, retries: 0 };
    list.current?.scrollToIndex({
      index,
      animated: !reduceMotion,
      viewPosition: viewOffset ? 0 : 0.15,
      viewOffset,
    });
  }

  function onScrollToIndexFailed(info: {
    index: number;
    averageItemLength: number;
  }) {
    if (
      !pending.current ||
      pending.current.index !== info.index ||
      pending.current.retries >= 2
    )
      return;
    pending.current.retries++;
    list.current?.scrollToOffset({
      offset: info.averageItemLength * info.index,
      animated: false,
    });

    timer.current = setTimeout(() => {
      if (pending.current)
        list.current?.scrollToIndex({
          index: pending.current.index,
          animated: !reduceMotion,
          viewPosition: viewOffset ? 0 : 0.15,
          viewOffset,
        });
    }, 120);
  }

  return { list, jump, onScrollToIndexFailed };
}
