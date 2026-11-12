import * as SecureStore from "expo-secure-store";
import { ApiError } from "@/services/api/api-error";

const key = "tripzy.auth.refresh-token";
// Isolate authentication keys from the default keychain used by older builds.
const options: SecureStore.SecureStoreOptions = {
  keychainService: "wego.auth.session",
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export class CredentialStorageError extends ApiError {
  readonly diagnostic: string;
  constructor(operation: "READ" | "WRITE" | "DELETE", cause: unknown) {
    super("STORAGE");
    // Never expose native messages: they can contain the token or account details.
    const code =
      cause && typeof cause === "object" && "code" in cause ? cause.code : null;
    const safeCode =
      typeof code === "string" && /^(?:E|ERR)_[A-Z_]{1,48}$/.test(code)
        ? code
        : "NATIVE";
    this.diagnostic = `SECURE_${operation}_${safeCode}`;
  }
}

export const nativeCredentials = {
  async read() {
    try {
      const token = await SecureStore.getItemAsync(key, options);
      if (token !== null) return token;
      // Existing installations can still restore their previous encrypted session.
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      throw new CredentialStorageError("READ", error);
    }
  },
  async write(token: string) {
    try {
      await SecureStore.setItemAsync(key, token, options);
      // Remove the legacy copy so logout cannot resurrect an older session.
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      throw new CredentialStorageError("WRITE", error);
    }
  },
  async remove() {
    try {
      await SecureStore.deleteItemAsync(key, options);
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      throw new CredentialStorageError("DELETE", error);
    }
  },
};
