import { Alert } from "react-native";
import type { TripDetailsCopy } from "../i18n/trip-details-copy";

export function confirmDateImpact(copy: TripDetailsCopy, count: number): Promise<boolean> {
  return new Promise((resolve) => Alert.alert(copy.dateImpactTitle, copy.dateImpactHint.replace("{count}", String(count)), [
    { text: copy.cancel, style: "cancel", onPress: () => resolve(false) },
    { text: copy.save, onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}
