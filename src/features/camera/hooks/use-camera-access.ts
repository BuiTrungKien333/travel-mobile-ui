import { Camera, type PermissionResponse } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { getCameraEnvironmentIssue } from "../utils/camera-environment";

export function useCameraAccess() {
  const [permission, setPermission] = useState<PermissionResponse | null>(null);
  const [issue, setIssue] = useState<
    ReturnType<typeof getCameraEnvironmentIssue> | "permissionError" | "denied"
  >(null);
  const [requesting, setRequesting] = useState(false);
  const mounted = useRef(false);
  const permissionVersion = useRef(0);
  const requestInFlight = useRef(false);
  const refresh = useCallback(() => {
    if (requestInFlight.current) return Promise.resolve();
    const version = ++permissionVersion.current;
    return Camera.getCameraPermissionsAsync().then(
      (result) => {
        if (mounted.current && version === permissionVersion.current) {
          setPermission(result);
          setIssue(
            getCameraEnvironmentIssue() ??
              (result.status === "denied" ? "denied" : null),
          );
        }
      },
      () => {
        if (mounted.current && version === permissionVersion.current)
          setIssue(getCameraEnvironmentIssue() ?? "permissionError");
      },
    );
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);

  async function request() {
    if (requestInFlight.current) return;
    const environmentIssue = getCameraEnvironmentIssue();
    if (environmentIssue) {
      setIssue(environmentIssue);
      return;
    }
    requestInFlight.current = true;
    ++permissionVersion.current;
    setRequesting(true);
    try {
      // Invoke directly from the press event; browsers require a user gesture for access.
      const result = await Camera.requestCameraPermissionsAsync();
      if (mounted.current) {
        setPermission(result);
        setIssue(result.granted ? null : "denied");
      }
    } catch {
      if (mounted.current) setIssue("permissionError");
    } finally {
      requestInFlight.current = false;
      if (mounted.current) setRequesting(false);
    }
  }
  return { permission, issue, requesting, request };
}
