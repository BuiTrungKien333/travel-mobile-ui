export function getCameraEnvironmentIssue():
  "insecure" | "unsupported" | "embedded" | null {
  if (!window.isSecureContext) return "insecure";
  const policy =
    "permissionsPolicy" in document
      ? document.permissionsPolicy
      : "featurePolicy" in document
        ? document.featurePolicy
        : undefined;

  if (
    window.self !== window.top &&
    policy &&
    typeof policy === "object" &&
    "allowsFeature" in policy &&
    typeof policy.allowsFeature === "function" &&
    !policy.allowsFeature("camera")
  )
    return "embedded";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";

  return null;
}
