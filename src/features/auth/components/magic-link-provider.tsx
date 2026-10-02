import { addEventListener, getInitialURL } from "expo-linking";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";

type LinkState = { url: string | null; isLoading: boolean };
const MagicLinkContext = createContext<LinkState>({ url: null, isLoading: true });

/** Mounted above routes so a warm link cannot be lost while its screen is being mounted. */
export function MagicLinkProvider({ children }: { children: ReactNode }) {
  // Same server/client initial render; read browser fragments only after hydration.
  const [state, setState] = useState<LinkState>({ url: null, isLoading: true });
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const receive = (url: string | null) => {
      if (!active) return;
      setState({ url, isLoading: false });
      if (Platform.OS === "web" && typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      }
    };
    const subscription = addEventListener("url", (event) => { receivedEvent = true; receive(event.url); });
    const browser = Platform.OS === "web" && typeof window !== "undefined" ? window : null;
    const receiveBrowserLink = () => {
      if (!browser?.location.hash) return;
      receivedEvent = true;
      receive(browser.location.href);
    };
    browser?.addEventListener("hashchange", receiveBrowserLink);
    browser?.addEventListener("popstate", receiveBrowserLink);
    void getInitialURL().then((url) => { if (!receivedEvent) receive(url); })
      .catch(() => { if (!receivedEvent) receive(null); });
    return () => {
      active = false;
      subscription.remove();
      browser?.removeEventListener("hashchange", receiveBrowserLink);
      browser?.removeEventListener("popstate", receiveBrowserLink);
    };
  }, []);
  return <MagicLinkContext.Provider value={state}>{children}</MagicLinkContext.Provider>;
}

export function useMagicLinkURL() { return useContext(MagicLinkContext); }
