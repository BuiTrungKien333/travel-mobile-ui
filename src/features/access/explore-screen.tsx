import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthStore } from "@/store/use-auth-store";
import { canUseWorkspace } from "@/features/auth/utils/authorization";
import { useLogout } from "@/features/auth/hooks/use-auth";
import type { DestinationOption } from "@/features/trip/api/destinations-api";
import type { PlaceDetail, PlaceSummary } from "@/features/trip/api/place-discovery-api";
import { accessCopy } from "./access-copy";
import { useExplore } from "./access-hooks";

const exploreThumbnails = [
  require("@/assets/images/examples/thumbnails/IMG20260110152554.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260110163722.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222171145.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222171156.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222172702.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222172729.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222173257.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409062951.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409064219.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409141212.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409143445.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409143459.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409143711.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260509091222.webp"),
];

function thumbnailForPlace(placeId: string) {
  let hash = 0;
  for (let index = 0; index < placeId.length; index++)
    hash = (hash * 31 + placeId.charCodeAt(index)) >>> 0;
  return exploreThumbnails[hash % exploreThumbnails.length];
}

export function ExploreScreen() {
  const theme = useAppTheme();
  const { locale } = useI18n();
  const copy = accessCopy(locale);
  const [province, setProvince] = useState<DestinationOption>();
  const [placeId, setPlaceId] = useState<string>();
  const [page, setPage] = useState(0);
  const { destinations, places, detail } = useExplore(province?.id, page, placeId, locale);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const isWorkspaceUser = canUseWorkspace(user);
  const current = placeId ? detail : province ? places : destinations;
  const data = province ? places.data : destinations.data;
  const title = placeId ? detail.data?.name ?? province?.name ?? copy.explore : province?.name ?? copy.explore;
  const onBack = () => {
    if (placeId) setPlaceId(undefined);
    else {
      setProvince(undefined);
      setPage(0);
    }
  };

  const header = (
    <View style={{ gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        {province || placeId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.back}
            onPress={onBack}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppIcon name="back" size={theme.layout.iconSmall} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <AppText variant="title" numberOfLines={2}>{title}</AppText>
        </View>
        {user ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.logout}
            disabled={logout.isPending}
            onPress={() => { void logout.mutateAsync().catch(() => undefined); }}
            style={({ pressed }) => ({
              minWidth: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surfaceVariant,
              opacity: pressed || logout.isPending ? 0.6 : 1,
            })}
          >
            <AppIcon name="logout" size={theme.layout.iconSmall} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceVariant,
      }}>
        <View style={{
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
        }}>
          <AppIcon name="sparkles" size={theme.layout.iconSmall} color={theme.colors.primaryText} />
        </View>
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <AppText variant="label">{isWorkspaceUser ? copy.publicExplore : copy.guestTitle}</AppText>
          <AppText variant="caption" tone="muted">{isWorkspaceUser ? copy.publicExploreHint : copy.guest}</AppText>
        </View>
        {isWorkspaceUser ? (
          <AppButton size="small" variant="soft" onPress={() => router.replace("/tabs")}>{copy.openApp}</AppButton>
        ) : (
          <AppButton size="small" variant="soft" onPress={() => router.push("/(auth)/login")}>{copy.login}</AppButton>
        )}
      </View>

      {logout.isError ? <AppText variant="caption" tone="error">{copy.failed}</AppText> : null}
      {current.isLoading ? <StatusMessage loading message={copy.loading} /> : null}
      {current.isError ? (
        <View style={{ gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.errorSurface }}>
          <AppText variant="body" tone="error" accessibilityRole="alert">{copy.failed}</AppText>
          <AppButton size="small" variant="outline" onPress={() => { void current.refetch(); }}>{copy.retry}</AppButton>
        </View>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}>
      {!current.isLoading && !current.isError && data?.content.length === 0 ? (
        <View style={{ alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.xl, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
          <AppIcon name="compass" variant="outline" size={theme.layout.iconLarge} color={theme.colors.textSecondary} />
          <AppText variant="sectionTitle" style={{ textAlign: "center" }}>{copy.empty}</AppText>
          <AppText variant="caption" tone="muted" style={{ textAlign: "center" }}>{copy.emptyHint}</AppText>
        </View>
      ) : null}
      {!placeId && data && data.totalPages > 1 ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <AppButton size="small" variant="outline" disabled={page === 0 || current.isFetching} onPress={() => setPage((value) => value - 1)}>{copy.previous}</AppButton>
          <AppText variant="caption" tone="muted">{copy.page(page + 1, data.totalPages)}</AppText>
          <AppButton size="small" variant="outline" disabled={page + 1 >= data.totalPages || current.isFetching} onPress={() => setPage((value) => value + 1)}>{copy.next}</AppButton>
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {placeId ? (
        <FlatList
          data={detail.data ? [detail.data] : []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          renderItem={({ item }) => <PlaceDetailCard place={item} locale={locale} copy={copy} />}
          contentContainerStyle={{ width: "100%", maxWidth: theme.layout.contentMaxWidth, alignSelf: "center" }}
        />
      ) : province ? (
        <FlatList
          data={places.data?.content ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          renderItem={({ item, index }) => (
            <PlaceCard
              place={item}
              index={page * (places.data?.size ?? 20) + index + 1}
              onPress={() => setPlaceId(item.id)}
              copy={copy}
            />
          )}
          contentContainerStyle={{ width: "100%", maxWidth: theme.layout.contentMaxWidth, alignSelf: "center", paddingTop: theme.spacing.lg }}
        />
      ) : (
        <FlatList
          data={destinations.data?.content ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          renderItem={({ item, index }) => (
            <DestinationCard
              destination={item}
              index={page * (destinations.data?.size ?? 20) + index + 1}
              onPress={() => { setProvince(item); setPage(0); }}
              copy={copy}
            />
          )}
          contentContainerStyle={{ width: "100%", maxWidth: theme.layout.contentMaxWidth, alignSelf: "center", paddingTop: theme.spacing.lg }}
        />
      )}
    </ScreenSafeArea>
  );
}

function DestinationCard({ destination, index, onPress, copy }: {
  destination: DestinationOption;
  index: number;
  onPress: () => void;
  copy: ReturnType<typeof accessCopy>;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${destination.name}. ${copy.openDestination}`}
      accessibilityHint={copy.openDestinationHint}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 100,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.78 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ width: 68, height: 68, alignItems: "center", justifyContent: "center" }}>
        <AppIcon name="compass" variant="outline" size={theme.layout.iconLarge} color={theme.colors.primaryText} />
        <AppText variant="caption" tone="primary">{String(index).padStart(2, "0")}</AppText>
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <AppText variant="subheading" numberOfLines={2}>{destination.name}</AppText>
        <AppText variant="caption" tone="muted">{copy.destinationHint}</AppText>
      </View>
      <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceVariant }}>
        <AppIcon name="chevron" size={theme.layout.iconSmall} color={theme.colors.textSecondary} />
      </View>
    </Pressable>
  );
}

function PlaceCard({ place, index, onPress, copy }: {
  place: PlaceSummary;
  index: number;
  onPress: () => void;
  copy: ReturnType<typeof accessCopy>;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}. ${copy.openPlace}`}
      accessibilityHint={copy.openPlaceHint}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <Image
        source={thumbnailForPlace(place.id)}
        contentFit="cover"
        cachePolicy="memory-disk"
        accessibilityLabel={place.name}
        style={{ width: 68, height: 68, borderRadius: theme.radius.md }}
      />
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm }}>
          <AppText variant="sectionTitle" numberOfLines={2} style={{ flex: 1 }}>{place.name}</AppText>
          <AppText variant="caption" tone="muted">{String(index).padStart(2, "0")}</AppText>
        </View>
        {place.category?.label ? <AppText variant="caption" tone="primary" numberOfLines={1}>{place.category.label}</AppText> : null}
        {place.formattedAddress ? <AppText variant="caption" tone="muted" numberOfLines={2}>{place.formattedAddress}</AppText> : null}
      </View>
      <AppIcon name="chevron" size={theme.layout.iconSmall} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

function PlaceDetailCard({ place, locale, copy }: {
  place: PlaceDetail;
  locale: string;
  copy: ReturnType<typeof accessCopy>;
}) {
  const theme = useAppTheme();
  const statusColor = place.openingStatus === "OPEN"
    ? { backgroundColor: theme.colors.successSurface, color: theme.colors.onSuccessSurface }
    : place.openingStatus === "CLOSED"
      ? { backgroundColor: theme.colors.errorSurface, color: theme.colors.error }
      : { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.textSecondary };
  const environment = place.environmentType === "INDOOR"
    ? copy.indoor
    : place.environmentType === "OUTDOOR"
      ? copy.outdoor
      : place.environmentType === "HYBRID"
        ? copy.hybrid
        : copy.environmentUnknown;
  const hours = place.openingHours?.displayLines ?? [];

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 20 }}>
      <View style={{ alignItems: "center", gap: 12, padding: 24, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
        <Image
          source={thumbnailForPlace(place.id)}
          contentFit="cover"
          cachePolicy="memory-disk"
          accessibilityLabel={place.name}
          style={{ width: "100%", height: 190, borderRadius: theme.radius.sm }}
        />
        {place.category?.label ? <AppText variant="caption" tone="primary">{place.category.label}</AppText> : null}
        <AppText variant="subheading" style={{ textAlign: "center" }}>{place.name}</AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: theme.radius.full, backgroundColor: statusColor.backgroundColor }}>
          <View style={{ width: 7, height: 7, borderRadius: theme.radius.full, backgroundColor: statusColor.color }} />
          <AppText variant="caption" style={{ color: statusColor.color }}>{copy[place.openingStatus === "OPEN" ? "openNow" : place.openingStatus === "CLOSED" ? "closedNow" : "hoursUnknown"]}</AppText>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <AppText variant="sectionTitle">{copy.placeInformation}</AppText>
        <DetailRow icon="pin" label={copy.address} value={place.formattedAddress ?? copy.addressUnknown} />
        <DetailRow icon="compass" label={copy.environment} value={environment} />
        <DetailRow icon="clock" label={copy.openingHours} value={hours.length ? hours.join(" · ") : copy.unknownHours} />
        {place.admission?.text ? <DetailRow icon="ticket" label={copy.admission} value={place.admission.text} /> : null}
      </View>

      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 14, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
        <AppIcon name="info" size={theme.layout.iconSmall} color={theme.colors.textSecondary} />
        <AppText variant="caption" tone="muted" style={{ flex: 1 }}>{copy.dataNotice}</AppText>
      </View>
      <AppText variant="caption" tone="muted">{copy.checkedAt}: {new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", { dateStyle: "medium" }).format(new Date(place.evaluatedAt))}</AppText>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: "pin" | "compass" | "clock" | "ticket"; label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.divider }}>
      <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
        <AppIcon name={icon} size={theme.layout.iconSmall} color={theme.colors.primaryText} />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="caption" tone="muted">{label}</AppText>
        <AppText variant="body">{value}</AppText>
      </View>
    </View>
  );
}

function StatusMessage({ loading, message }: { loading: boolean; message: string }) {
  const theme = useAppTheme();
  return (
    <View accessibilityRole={loading ? "progressbar" : undefined} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
      {loading ? <ActivityIndicator color={theme.colors.primaryText} /> : <AppIcon name="info" color={theme.colors.textSecondary} />}
      <AppText variant="body" tone="muted">{message}</AppText>
    </View>
  );
}
