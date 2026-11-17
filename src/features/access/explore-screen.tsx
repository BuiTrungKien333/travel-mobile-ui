import { useState } from "react";
import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthStore } from "@/store/use-auth-store";
import { canUseWorkspace } from "@/features/auth/utils/authorization";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { accessCopy } from "./access-copy";
import { useExplore } from "./access-hooks";

export function ExploreScreen() {
  const theme = useAppTheme(); const { locale } = useI18n(); const copy = accessCopy(locale);
  const [province, setProvince] = useState<{ id: string; name: string; }>();
  const [placeId, setPlaceId] = useState<string>(); const [page, setPage] = useState(0);
  const { destinations, places, detail } = useExplore(province?.id, page, placeId, locale);
  const user = useAuthStore((s) => s.user); const logout = useLogout();
  const current = placeId ? detail : province ? places : destinations;
  const data = province ? places.data : destinations.data;
  const spacing = { padding: theme.spacing.lg, gap: theme.spacing.md };
  const header = <View style={spacing}>
    <AppText variant="subheading">{province?.name ?? copy.explore}</AppText>
    <AppText tone="muted">{copy.guest}</AppText>
    {canUseWorkspace(user) ? <AppButton onPress={() => router.replace("/tabs")}>{copy.back}</AppButton> : user ?
      <AppButton disabled={logout.isPending} onPress={() => { void logout.mutateAsync().catch(() => undefined); }}>{copy.logout}</AppButton> :
      <AppButton onPress={() => router.push("/(auth)/login")}>{copy.login}</AppButton>}
    {logout.isError ? <AppText tone="error">{copy.failed}</AppText> : null}
    {province ? <AppButton variant="outline" onPress={() => { if (placeId) setPlaceId(undefined); else { setProvince(undefined); setPage(0); } }}>{copy.back}</AppButton> : null}
    {current.isLoading ? <AppText accessibilityRole="progressbar">{copy.loading}</AppText> : null}
    {current.isError ? <><AppText tone="error" accessibilityRole="alert">{copy.failed}</AppText><AppButton variant="outline" onPress={() => { void current.refetch(); }}>{copy.retry}</AppButton></> : null}
  </View>;
  const footer = <View style={spacing}>
    {!current.isLoading && !current.isError && data?.content.length === 0 ? <AppText>{copy.empty}</AppText> : null}
    {!placeId ? <><AppButton variant="outline" disabled={page === 0 || current.isFetching} onPress={() => setPage(page - 1)}>{copy.previous}</AppButton>
      <AppButton variant="outline" disabled={!data || page + 1 >= data.totalPages || current.isFetching} onPress={() => setPage(page + 1)}>{copy.next}</AppButton></> : null}
  </View>;
  return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}>
    {placeId ? <FlatList data={detail.data ? [detail.data] : []} keyExtractor={(item) => item.id} ListHeaderComponent={header} ListFooterComponent={footer} renderItem={({ item }) =>
      <View style={spacing}><AppText variant="subheading">{item.name}</AppText><AppText>{item.formattedAddress ?? ""}</AppText><AppText>{item.openingHours?.displayLines.join(" · ") ?? copy.unknownHours}</AppText><AppText tone="muted">{copy.unknownHours}</AppText></View>} /> : province ?
      <FlatList data={places.data?.content ?? []} keyExtractor={(item) => item.id} ListHeaderComponent={header} ListFooterComponent={footer} renderItem={({ item }) =>
        <View style={spacing}><AppButton variant="outline" onPress={() => setPlaceId(item.id)}>{item.name}</AppButton></View>} /> :
      <FlatList data={destinations.data?.content ?? []} keyExtractor={(item) => item.id} ListHeaderComponent={header} ListFooterComponent={footer} renderItem={({ item }) =>
        <View style={spacing}><AppButton variant="outline" onPress={() => { setProvince(item); setPage(0); }}>{item.name}</AppButton></View>} />}
  </ScreenSafeArea>;
}
