import { useRef, useState } from "react";
import { Redirect, router } from "expo-router";
import { Keyboard, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  canConfigureServer,
  getServerOrigin,
} from "@/services/api/server-connection";
import { AuthScaffold } from "../components/auth-scaffold";
import {
  connectServer,
  ServerConnectionError,
  type ConnectionStage,
} from "../services/connect-server";
import { useConnectionCopy } from "../i18n/connection-copy";

export function ServerConnectionScreen() {
  const theme = useAppTheme();
  const copy = useConnectionCopy();
  const submitting = useRef(false);
  const [value, setValue] = useState(getServerOrigin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<ConnectionStage>("probe");
  if (!canConfigureServer) return <Redirect href="/" />;

  const handleSave = async () => {
    if (submitting.current) return;
    submitting.current = true;
    Keyboard.dismiss();
    setBusy(true);
    setError("");
    try {
      await connectServer(value, setStage);
      try {
        router.replace("/");
      } catch {
        throw new ServerConnectionError("NAVIGATION");
      }
    } catch (failure) {
      const problem =
        failure instanceof ServerConnectionError
          ? failure
          : new ServerConnectionError("NETWORK");
      setError(
        `${copy[problem.code]} (CONNECT_${problem.code}${problem.httpStatus ? ` · HTTP ${problem.httpStatus}` : ""})`,
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <AuthScaffold
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <AppButton
          variant="outline"
          disabled={busy}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        >
          {copy.back}
        </AppButton>
      }
    >
      <View style={{ gap: theme.spacing.md }}>
        <AppInput
          label={copy.address}
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!busy}
          placeholder="http://192.168.1.8:18081"
          onSubmitEditing={() => void handleSave()}
        />
        {busy ? (
          <AppText variant="caption" accessibilityLiveRegion="polite">
            {copy[stage]}
          </AppText>
        ) : null}
        {error ? (
          <AppText variant="caption" tone="error" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <AppButton loading={busy} onPress={() => void handleSave()}>
          {copy.submit}
        </AppButton>
      </View>
    </AuthScaffold>
  );
}
