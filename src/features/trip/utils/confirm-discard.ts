import { Alert } from "react-native";
import type { TripCopy } from "../i18n/trip-copy";

export function confirmDiscard(copy: TripCopy, onDiscard: () => void) {
  Alert.alert(copy.discardTitle, copy.discardHint, [
    { text: copy.keepEditing, style: "cancel" },
    { text: copy.discard, style: "destructive", onPress: onDiscard },
  ]);
}
