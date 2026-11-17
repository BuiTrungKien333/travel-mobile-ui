import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { destinationsApi } from "@/features/trip/api/destinations-api";
import { authSession } from "@/features/auth/services/auth-session";
import { canAdminister } from "@/features/auth/utils/authorization";
import { useAuthStore } from "@/store/use-auth-store";
import { ApiError } from "@/services/api/api-error";
import { accessApi } from "./access-api";
import type { Account } from "./access-contract";
export function useExplore(provinceId: string | undefined, page: number, placeId: string | undefined, locale: string) {
  const destinations = useQuery({ queryKey: ["public-destinations", page], queryFn: ({ signal }) => destinationsApi.list("", page, signal), enabled: !provinceId });
  const places = useQuery({ queryKey: ["public-places", provinceId, page, locale], queryFn: ({ signal }) => accessApi.places(provinceId ?? "", page, locale, signal), enabled: !!provinceId });
  const detail = useQuery({ queryKey: ["public-place", placeId, locale], queryFn: ({ signal }) => accessApi.place(placeId ?? "", locale, signal), enabled: !!placeId });
  return { destinations, places, detail };
}
export type AdminTab = "users" | "catalog" | "history";
export type AdminAction = { kind: "account"; account: Account; role: Account["role"]; locked: boolean; } |
{ kind: "catalog"; id: string; name: string; approved: boolean; version: number; } | { kind: "index"; };
export function useAdministration(tab: AdminTab, q: string, page: number) {
  const user = useAuthStore((s) => s.user);
  const enabled = useAuthStore((s) => s.status === "authenticated") && canAdminister(user);
  const cache = useQueryClient();
  const accounts = useQuery({ queryKey: ["administration", user?.id, "users", q, page], queryFn: ({ signal }) => accessApi.accounts(q, page, signal), enabled: enabled && tab === "users" });
  const catalog = useQuery({ queryKey: ["administration", user?.id, "catalog", page], queryFn: ({ signal }) => accessApi.catalog(page, signal), enabled: enabled && tab === "catalog" });
  const events = useQuery({ queryKey: ["administration", user?.id, "events", page], queryFn: ({ signal }) => accessApi.events(page, signal), enabled: enabled && tab === "history" });
  const mutation = useMutation({
    retry: false,
    mutationFn: async (action: AdminAction) => {
      const version = authSession.getVersion();
      if (!enabled) throw new ApiError("AUTH_002", 403);
      let indexResult: Awaited<ReturnType<typeof accessApi.index>> | undefined;
      if (action.kind === "account") await accessApi.change(action.account.id, { role: action.role, locked: action.locked, version: action.account.version });
      else if (action.kind === "catalog") await accessApi.review(action.id, { approved: action.approved, version: action.version });
      else indexResult = await accessApi.index();
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
      return indexResult;
    },
    onSuccess: async () => {
      await Promise.all([cache.invalidateQueries({ queryKey: ["administration"] }), cache.invalidateQueries({ queryKey: ["public-places"] }), cache.invalidateQueries({ queryKey: ["public-place"] }), cache.invalidateQueries({ queryKey: ["place-discovery"] })]);
    },
  });
  return { user, enabled, accounts, catalog, events, mutation };
}
