import { ApiError } from "@/services/api/api-error";

type GoogleIdentity = {
  initialize: (options: {
    client_id: string;
    nonce: string;
    callback: (response: unknown) => void;
    ux_mode: "popup";
    use_fedcm_for_button: boolean;
    button_auto_select: boolean;
  }) => void;
  renderButton: (
    container: HTMLElement,
    options: {
      type: "standard";
      theme: "outline";
      size: "large";
      text: "continue_with";
      shape: "rectangular";
      locale: string;
      width: string;
      state: string;
      click_listener: () => void;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

let loading: Promise<GoogleIdentity> | undefined;

/** Only the web platform loads Google's official button SDK. */
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts?.id)
    return Promise.resolve(window.google.accounts.id);
  if (loading) return loading;
  loading = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(fail, 15000);
    function fail() {
      window.clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new ApiError("GOOGLE_FAILED"));
    }
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const identity = window.google?.accounts?.id;
      if (!identity) {
        fail();
        return;
      }
      window.clearTimeout(timer);
      resolve(identity);
    };
    script.onerror = fail;
    document.head.append(script);
  });
  return loading;
}
