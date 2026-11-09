import { useState } from "react";
import { Redirect, router } from "expo-router";
import { Keyboard, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { resolveApiUrl } from "@/services/api/client";
import { canConfigureServer, getServerOrigin, saveServerConnection } from "@/services/api/server-connection";
import { AuthScaffold } from "../components/auth-scaffold";
import { authSession } from "../services/auth-session";

export function ServerConnectionScreen() {
  const theme = useAppTheme();
  const { locale } = useI18n();
  const vi = locale === "vi";
  const [value, setValue] = useState(getServerOrigin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!canConfigureServer) return <Redirect href="/" />;

  const handleSave = async () => {
    if (busy) return;
    Keyboard.dismiss();
    const origin = resolveApiUrl(value);
    if (!origin) {
      setError(vi ? "Nhập địa chỉ HTTPS hoặc IP Wi-Fi nội bộ, ví dụ http://192.168.1.9:18081" : "Enter an HTTPS address or local Wi-Fi IP, e.g. http://192.168.1.9:18081");
      return;
    }
    setBusy(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      // No auth headers: a new server must never receive the old server's token.
      const response = await fetch(`${origin}/actuator/health`, { signal: controller.signal });
      const health: unknown = await response.json();
      if (!response.ok || !health || typeof health !== "object" || !("status" in health) || health.status !== "UP") throw new Error("UNAVAILABLE");
      await authSession.expire();
      await saveServerConnection(origin);
      router.replace("/");
    } catch {
      setError(vi ? "Chưa thể kết nối hoặc lưu cấu hình. Kiểm tra backend, IP và Wi-Fi rồi thử lại." : "Could not connect or save settings. Check the backend, IP and Wi-Fi, then retry.");
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  };
  return <AuthScaffold title={vi ? "Kết nối máy chủ" : "Server connection"} subtitle={vi ? "Đổi Wi-Fi? Nhập IP laptop được script hiển thị. Bạn sẽ đăng nhập lại sau khi đổi máy chủ." : "Changed Wi-Fi? Enter the laptop IP shown by the script. Changing servers signs you out."} footer={<AppButton variant="outline" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>{vi ? "Quay lại" : "Back"}</AppButton>}>
    <View style={{ gap: theme.spacing.md }}>
      <AppInput label={vi ? "Địa chỉ API" : "API address"} value={value} onChangeText={setValue} autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!busy} placeholder="http://192.168.1.9:18081" onSubmitEditing={() => void handleSave()} />
      {error ? <AppText variant="caption" tone="error" accessibilityRole="alert">{error}</AppText> : null}
      <AppButton loading={busy} onPress={() => void handleSave()}>{vi ? "Kiểm tra & kết nối" : "Check & connect"}</AppButton>
    </View>
  </AuthScaffold>;
}
