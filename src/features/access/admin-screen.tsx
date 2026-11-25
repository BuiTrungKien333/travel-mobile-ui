import { useState } from "react";
import { FlatList, View } from "react-native";
import { router, Redirect } from "expo-router";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { normalizeApiError } from "@/services/api/api-error";
import { accessCopy } from "./access-copy";
import {
  useAdministration,
  type AdminAction,
  type AdminTab,
} from "./access-hooks";

export function AdminScreen() {
  const theme = useAppTheme();
  const { locale } = useI18n();
  const copy = accessCopy(locale);
  const [tab, setTab] = useState<AdminTab>("users");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<AdminAction>();
  const { user, enabled, accounts, catalog, events, mutation } =
    useAdministration(tab, q, page);
  if (!enabled) return <Redirect href="/" />;
  const current =
    tab === "users" ? accounts : tab === "catalog" ? catalog : events;
  const failure = normalizeApiError(mutation.error ?? current.error);
  const errorText =
    failure.code === "AUTH_002"
      ? copy.denied
      : failure.code === "ADMIN_001"
        ? copy.conflict
        : failure.code === "ADMIN_004"
          ? copy.verifiedRequired
          : ["ADMIN_002", "ADMIN_003"].includes(failure.code)
            ? copy.protected
            : copy.failed;
  const spacing = { padding: theme.spacing.lg, gap: theme.spacing.md };
  const roleName = (role: string) =>
    role === "ADMIN"
      ? copy.administrator
      : role === "USER"
        ? copy.user
        : copy.visitor;

  function select(action: AdminAction) {
    mutation.reset();
    setPending(action);
  }

  const header = (
    <View style={spacing}>
      <AppButton variant="outline" onPress={() => router.back()}>
        {copy.back}
      </AppButton>
      <AppText variant="subheading">{copy.admin}</AppText>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        {(["users", "catalog", "history"] as const).map((value) => (
          <AppButton
            key={value}
            size="small"
            disabled={mutation.isPending}
            variant={tab === value ? "primary" : "outline"}
            onPress={() => {
              setTab(value);
              setPage(0);
              setPending(undefined);
              mutation.reset();
            }}
          >
            {copy[value]}
          </AppButton>
        ))}
      </View>
      {tab === "users" ? (
        <>
          <AppInput
            label={copy.search}
            value={search}
            maxLength={120}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          <AppButton
            variant="outline"
            onPress={() => {
              setQ(search.trim());
              setPage(0);
            }}
          >
            {copy.find}
          </AppButton>
        </>
      ) : null}
      {tab === "catalog" ? (
        <AppButton
          disabled={mutation.isPending}
          variant="outline"
          onPress={() => select({ kind: "index" })}
        >
          {copy.index}
        </AppButton>
      ) : null}
      {pending ? (
        <View
          style={{
            padding: theme.spacing.md,
            gap: theme.spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <AppText>
            {pending.kind === "account"
              ? copy.review
              : pending.kind === "index"
                ? copy.index
                : pending.approved
                  ? copy.approve
                  : copy.withdraw}
          </AppText>
          {pending.kind === "catalog" ? (
            <AppText>{pending.name}</AppText>
          ) : null}
          {pending.kind === "account" ? (
            <>
              <AppText>{pending.account.email}</AppText>
              <AppText>
                {roleName(pending.account.role)} → {roleName(pending.role)}
              </AppText>
              <AppText>{pending.locked ? copy.locked : copy.active}</AppText>
            </>
          ) : null}
          <AppButton
            loading={mutation.isPending}
            onPress={() => {
              void mutation
                .mutateAsync(pending)
                .then(() => setPending(undefined))
                .catch(() => undefined);
            }}
          >
            {copy.confirm}
          </AppButton>
          <AppButton
            variant="outline"
            disabled={mutation.isPending}
            onPress={() => setPending(undefined)}
          >
            {copy.cancel}
          </AppButton>
        </View>
      ) : null}
      {current.isLoading ? (
        <AppText accessibilityRole="progressbar">{copy.loading}</AppText>
      ) : null}
      {current.isError || mutation.isError ? (
        <>
          <AppText tone="error" accessibilityRole="alert">
            {errorText}
          </AppText>
          <AppButton
            variant="outline"
            onPress={() => {
              void current.refetch();
              mutation.reset();
              setPending(undefined);
            }}
          >
            {copy.retry}
          </AppButton>
        </>
      ) : null}
      {mutation.isSuccess && mutation.data ? (
        <AppText accessibilityLiveRegion="polite">
          {mutation.data.failed ? copy.indexFailure : copy.indexed}:{" "}
          {copy.updated}: {mutation.data.updated} · {copy.skipped}:{" "}
          {mutation.data.skipped} · {copy.failedCount}: {mutation.data.failed}
        </AppText>
      ) : null}
    </View>
  );

  const footer = (
    <View style={spacing}>
      {!current.isLoading &&
      !current.isError &&
      current.data?.content.length === 0 ? (
        <AppText>{copy.empty}</AppText>
      ) : null}
      <AppButton
        variant="outline"
        disabled={page === 0 || current.isFetching || mutation.isPending}
        onPress={() => setPage(page - 1)}
      >
        {copy.previous}
      </AppButton>
      <AppButton
        variant="outline"
        disabled={
          !current.data ||
          (page + 1) * 20 >= current.data.totalElements ||
          current.isFetching ||
          mutation.isPending
        }
        onPress={() => setPage(page + 1)}
      >
        {copy.next}
      </AppButton>
    </View>
  );

  return (
    <ScreenSafeArea
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
        }}
      >
        {tab === "users" ? (
          <FlatList
            data={accounts.data?.content ?? []}
            keyExtractor={(a) => a.id}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={spacing}>
                <AppText variant="label">{item.fullName}</AppText>
                <AppText>{item.email}</AppText>
                <AppText>
                  {roleName(item.role)} ·{" "}
                  {item.locked ? copy.locked : copy.active}
                </AppText>
                {!item.verified ? (
                  <AppText tone="muted">{copy.unverified}</AppText>
                ) : null}
                {item.id === user?.id ? (
                  <AppText tone="muted">{copy.self}</AppText>
                ) : (
                  <>
                    <AppButton
                      variant="outline"
                      disabled={mutation.isPending}
                      onPress={() =>
                        select({
                          kind: "account",
                          account: item,
                          role: item.role,
                          locked: !item.locked,
                        })
                      }
                    >
                      {item.locked ? copy.unlock : copy.lock}
                    </AppButton>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: theme.spacing.sm,
                      }}
                    >
                      {(["GUEST", "USER", "ADMIN"] as const)
                        .filter((role) => role !== item.role)
                        .map((role) => (
                          <AppButton
                            key={role}
                            size="small"
                            variant="outline"
                            disabled={
                              mutation.isPending ||
                              (role === "ADMIN" && !item.verified)
                            }
                            onPress={() =>
                              select({
                                kind: "account",
                                account: item,
                                role,
                                locked: item.locked,
                              })
                            }
                          >
                            {copy.role}: {roleName(role)}
                          </AppButton>
                        ))}
                    </View>
                  </>
                )}
              </View>
            )}
          />
        ) : tab === "catalog" ? (
          <FlatList
            data={catalog.data?.content ?? []}
            keyExtractor={(a) => a.id}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            renderItem={({ item }) => (
              <View style={spacing}>
                <AppText variant="label">{item.name}</AppText>
                <AppText>
                  {item.approved ? copy.approved : copy.unpublished}
                </AppText>
                <AppText tone="muted">{item.sourceUrl}</AppText>
                <AppText tone="muted">
                  {copy.scope}: {item.verificationScope}
                </AppText>
                <AppButton
                  variant="outline"
                  disabled={
                    mutation.isPending ||
                    (!item.approved &&
                      item.verificationScope ===
                        "DEV_DEMO_ONLY_NOT_FACT_VERIFIED")
                  }
                  onPress={() =>
                    select({
                      kind: "catalog",
                      id: item.id,
                      name: item.name,
                      approved: !item.approved,
                      version: item.version,
                    })
                  }
                >
                  {item.approved ? copy.withdraw : copy.approve}
                </AppButton>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={events.data?.content ?? []}
            keyExtractor={(a) => a.id}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            renderItem={({ item }) => (
              <View style={spacing}>
                <AppText>
                  {new Date(item.createdAt).toLocaleString(locale)}
                </AppText>
                <AppText>
                  {roleName(item.oldRole)} → {roleName(item.newRole)} ·{" "}
                  {item.isLocked ? copy.locked : copy.active}
                </AppText>
                <AppText tone="muted">
                  {item.actorEmail} → {item.targetEmail}
                </AppText>
              </View>
            )}
          />
        )}
      </View>
    </ScreenSafeArea>
  );
}
