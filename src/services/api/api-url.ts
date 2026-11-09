type ApiEnvironment = {
  development: boolean;
  platform: string;
  isDevice: boolean;
  metroHost?: string;
  allowLanHttp?: boolean;
};

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".");
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^\d+$/.test(part) || Number(part) > 255)
  )
    return false;
  const [first, second] = parts.map(Number);
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function resolveApiUrl(
  value: string | undefined,
  environment: ApiEnvironment,
): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    const lanDemo =
      environment.allowLanHttp === true &&
      (environment.platform === "android" || environment.platform === "web") &&
      (isPrivateIpv4(url.hostname) ||
        (environment.platform === "web" && loopbackHosts.has(url.hostname)));
    if (
      url.protocol !== "https:" &&
      (url.protocol !== "http:" || (!environment.development && !lanDemo))
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
