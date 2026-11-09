import { useMagicLinkURL } from "../components/magic-link-provider";
import { readMagicLinkToken, type MagicLinkPurpose } from "../utils/magic-link";

export function useMagicLinkToken(purpose: MagicLinkPurpose) {
  const { url, isLoading } = useMagicLinkURL();
  return { token: readMagicLinkToken(url, purpose), isLoading };
}
