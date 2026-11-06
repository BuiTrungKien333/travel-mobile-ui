type ApiEnvironment = {
  development: boolean;
  platform: string;
  isDevice: boolean;
  metroHost?: string;
};

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function resolveApiUrl(
  value: string | undefined,
  environment: ApiEnvironment,
): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" &&
      (url.protocol !== "http:" || !environment.development)
    )
      return undefined;
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return undefined;

    if (
      environment.development &&
      loopbackHosts.has(url.hostname) &&
      environment.platform !== "web"
    ) {
      if (environment.platform === "android" && !environment.isDevice) {
        url.hostname = "10.0.2.2";
      } else if (environment.isDevice) {
        // In LAN development, Metro and the backend run on the same computer.
        if (!environment.metroHost) return undefined;
        const metro = new URL(`http://${environment.metroHost}`);
        if (loopbackHosts.has(metro.hostname)) return undefined;
        url.hostname = metro.hostname;
      }
    }
    return url.origin;
  } catch {
    return undefined;
  }
}
