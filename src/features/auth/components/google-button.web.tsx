import { useEffect, useEffectEvent, useRef, useState } from "react";
import { View } from "react-native";
import { z } from "zod";

import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { authApi } from "../api/auth-api";
import { authSession } from "../services/auth-session";
import { loadGoogleIdentity } from "../services/google-identity.web";
import { authErrorMessage } from "../utils/auth-error-message";
import type { GoogleButtonProps } from "./google-button";

const credentialResponse = z.object({ credential: z.string().min(1).max(8192), state: z.string() });
// Google's large button is 40 CSS px; uniform zoom gives a >=44px target without changing branding.
const googleButtonZoom = 1.1;
const googleMaxWidth = 400;

export function GoogleButton({ disabled, loading, onCredential }: GoogleButtonProps) {
  const { locale, t } = useI18n();
  const theme = useAppTheme();
  const container = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const exchange = useEffectEvent(async (challengeId: string, response: unknown) => {
    if (disabled || loading || !onCredential) return;
    const parsed = credentialResponse.safeParse(response);
    if (!parsed.success || parsed.data.state !== challengeId) return;
    await onCredential({ challengeId, idToken: parsed.data.credential });
  });

  useEffect(() => {
    const abort = new AbortController();
    let active = true;
    let renewal: ReturnType<typeof setTimeout> | undefined;
    let clickedVersion: number | undefined;
    function prepareAgain() {
      if (!active) return;
      setReady(false);
      setAttempt((value) => value + 1);
    }
    async function prepare() {
      const requestedAt = Date.now();
      try {
        const challenge = await authApi.googleChallenge(abort.signal);
        const identity = await loadGoogleIdentity();
        const element = container.current;
        if (!active || !element) return;
        identity.initialize({ client_id: challenge.webClientId, nonce: challenge.nonce, ux_mode: "popup",
          use_fedcm_for_button: true, button_auto_select: true,
          callback: (response) => {
            if (!active || clickedVersion === undefined || clickedVersion !== authSession.getVersion()) return;
            // Mutation feedback owns request errors; renew the consumed nonce for a manual retry.
            void exchange(challenge.challengeId, response).catch(() => {}).finally(prepareAgain);
          },
        });
        element.replaceChildren();
        identity.renderButton(element, { type: "standard", theme: "outline", size: "large",
          text: "continue_with", shape: "rectangular", locale,
          width: String(Math.min(googleMaxWidth, (element.parentElement?.clientWidth ?? googleMaxWidth) / googleButtonZoom)),
          state: challenge.challengeId, click_listener: () => { clickedVersion = authSession.getVersion(); },
        });
        setReady(true);
        // Renew idle challenges before expiry. Old popup responses carry a different button state.
        renewal = setTimeout(prepareAgain, Math.max(1000, challenge.expiresIn * 0.8 - (Date.now() - requestedAt)));
      } catch (failure) {
        if (active) { setReady(false); setError(failure); }
      }
    }
    void prepare();
    return () => { active = false; abort.abort(); clearTimeout(renewal); };
  }, [locale, attempt]);

  function handleRetry() { setError(null); setReady(false); setAttempt((value) => value + 1); }

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <div ref={container} aria-busy={Boolean(loading) || !ready} inert={Boolean(disabled || loading || !ready)}
        style={{ display: ready && !loading ? "flex" : "none", justifyContent: "center", alignItems: "center",
          minHeight: theme.spacing.section, zoom: googleButtonZoom }} />
      {(!ready || loading) && (
        <AppButton variant="outline" disabled={!error || disabled} loading={!error || loading} onPress={handleRetry}>
          {t(error ? "auth.google.retry" : "auth.google.preparing")}
        </AppButton>
      )}
      {error ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="error">{authErrorMessage(error, t)}</AppText> : null}
    </View>
  );
}
