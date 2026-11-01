export function getCameraEnvironmentIssue(): "insecure" | "unsupported" | null {
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  return null;
}
