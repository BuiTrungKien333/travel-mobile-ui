import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { Alert, Platform } from "react-native";
import { useI18n } from "./use-i18n";

/** Guards both Router removal and local sheet closing; saving cannot be interrupted. */
export function useUnsavedExit(dirty: boolean, busy = false) {
  const navigation = useNavigation();
  const { t } = useI18n();
  function requestExit(leave: () => void) {
    if (busy) return;
    if (!dirty) { leave(); return; }
    if (Platform.OS === "web") {
      if (window.confirm(`${t("common.unsavedTitle")}\n\n${t("common.unsavedHint")}`)) leave();
    } else Alert.alert(t("common.unsavedTitle"), t("common.unsavedHint"), [
      { text: t("common.keepEditing"), style: "cancel" },
      { text: t("common.discardChanges"), style: "destructive", onPress: leave },
    ]);
  }
  usePreventRemove(dirty || busy, ({ data }) => requestExit(() => navigation.dispatch(data.action)));
  return requestExit;
}
