import { publicAuthEndpoints } from "@/features/auth/api/auth-endpoints";

export function isPublicApiRequest(url: string, method = "get") {
  const verb = method.toLowerCase();
  if (verb === "post" && publicAuthEndpoints.has(url)) return true;

  return (
    verb === "get" &&
    (url === "/api/v1/destinations" ||
      url === "/api/v1/public/places" ||
      /^\/api\/v1\/public\/places\/[a-f0-9-]{36}$/i.test(url) ||
      url === "/api/v1/public/weather/current" ||
      url === "/api/v1/public/weather/forecast")
  );
}
