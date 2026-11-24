import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Keyboard, Pressable, Switch, View } from "react-native";
import { z } from "zod";
import { AppText } from "@/components/ui/app-text";
import { AppInput } from "@/components/ui/app-input";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { planningOrigin, planningTag, planningTags, type PlanningInput } from "../api/planning-contract";
import type { TripDetailDto } from "../api/trip-contract";
import { usePlaceDiscovery } from "../api/place-discovery-queries";
import { discoveryStop } from "../api/place-discovery-api";
import { currentTripPosition } from "../services/current-trip-position";
import { TripOriginOption } from "./trip-origin-option";
import { TripStartTimeField } from "./trip-start-time-field";
import { tagLabels, usePlanningCopy } from "../i18n/planning-copy";
import { planningTextContext } from "../utils/planning-text-context";
import { TripPlanningLoadingCard } from "./trip-planning-feedback";

const formSchema = z.object({
  originName: z.string().max(160), origin: planningOrigin.nullable(),
  start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  pace: z.enum(["RELAXED", "BALANCED", "ACTIVE"]), interests: z.array(planningTag).max(10), excluded: z.array(planningTag).max(10),
  additionalText: z.string().max(600), roundTrip: z.boolean(),
}).refine(v => !!v.origin, { path: ["origin"] })
  .refine(v => v.end > v.start, { path: ["end"] })
  .refine(v => v.interests.length > 0 || v.additionalText.trim().length > 0, { path: ["interests"] });
type Values = z.infer<typeof formSchema>;

export function TripPlanningForm({ trip, initial, pending, onSubmit }: {
  trip: TripDetailDto; initial?: PlanningInput; pending: boolean; onSubmit: (input: PlanningInput) => Promise<void>;
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlanningCopy();
  const originalText = planningTextContext(initial?.text);
  const [originSearch, setOriginSearch] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [advanced, setAdvanced] = useState(Boolean(initial?.preferences?.excludedTags.length));
  const initialInterests = trip.preferences.flatMap(p => ({
    culture: ["CULTURE"], relaxation: ["RELAX"], shopping: ["SHOPPING"], beach: ["BEACH"],
  }[p as "culture" | "relaxation" | "shopping" | "beach"] ?? []));
  const { control, setValue, getValues, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originName: initial?.origin.name ?? trip.accommodation ?? "", origin: initial?.origin ?? null,
      start: initial?.preferences?.dailyStartTime ?? originalText.start ?? "08:00", end: initial?.preferences?.dailyEndTime ?? originalText.end ?? "17:00",
      pace: initial?.preferences?.travelPace ?? originalText.pace ?? "BALANCED",
      interests: initial?.preferences?.interests ?? initialInterests.filter((v): v is z.infer<typeof planningTag> => planningTag.safeParse(v).success),
      excluded: initial?.preferences?.excludedTags ?? [],
      additionalText: initial?.additionalText ?? originalText.text, roundTrip: initial?.roundTrip ?? true,
    },
  });
  const values = useWatch({ control });
  const interests = values.interests ?? [];
  const excluded = values.excluded ?? [];
  const additionalText = values.additionalText ?? "";
  const selectedOrigin = useWatch({ control, name: "origin" });
  const searchTerm = originSearch.trim().length > 1 ? originSearch : suggestionsOpen ? (locale === "vi" ? "Đà Nẵng" : "Da Nang") : "";
  const { query: search, isDebouncing } = usePlaceDiscovery({ tripId: trip.id }, searchTerm, locale, searchTerm.length > 1);
  const matches = !isDebouncing ? search.data?.pages.flatMap(page => page.content.map(discoveryStop)).slice(0, 4) ?? [] : [];
  const field = (name: "additionalText", label: string, helper?: string) => (
    <Controller key={name} control={control} name={name} render={({ field: input }) => (
      <AppInput label={label} value={input.value} onChangeText={input.onChange} onBlur={input.onBlur}
        editable={!pending} helperText={helper} multiline={name === "additionalText"} maxLength={name === "additionalText" ? 600 : 1600}
        error={errors[name] ? copy.invalid : undefined} />
    )} />
  );
  const locate = () => {
    if (locating || pending) return;
    setLocating(true); setLocationError(false);
    void currentTripPosition(copy.current).then(place => {
      const origin = planningOrigin.safeParse({ name: copy.current, ...place.location });
      if (!origin.success) { setLocationError(true); return; }
      setValue("origin", origin.data, { shouldValidate: true }); setValue("originName", origin.data.name); setOriginSearch("");
    }).catch(() => setLocationError(true)).finally(() => setLocating(false));
  };
  return <View pointerEvents={pending ? "none" : "auto"} style={{ gap: theme.spacing.md }}>
    <Controller control={control} name="originName" render={({ field: input }) => (
      <AppInput label={copy.origin} placeholder={copy.originPlaceholder} leadingIcon={<AppIcon name="pin" size={theme.layout.iconSmall} color={theme.colors.textSecondary} />} trailingAction={
        <Pressable accessibilityRole="button" accessibilityLabel={copy.locate} accessibilityState={{ busy: locating }} disabled={pending || locating} onPress={locate} style={{ width: 48, minHeight: 48, alignItems: "center", justifyContent: "center", opacity: locating ? 0.55 : 1 }}>
          <AppIcon name="locate" size={theme.layout.iconMedium} color={theme.colors.primary} />
        </Pressable>
      } value={input.value} editable={!pending}
        error={errors.origin ? copy.originError : undefined}
        onChangeText={text => { input.onChange(text); setValue("origin", null); setOriginSearch(text); }} />
    )} />
    {!originSearch.trim() && !selectedOrigin ? <Pressable accessibilityRole="button" accessibilityLabel={copy.quickSearch}
      accessibilityState={{ expanded: suggestionsOpen }} disabled={pending}
      onPress={() => setSuggestionsOpen(open => !open)}
      style={({ pressed }) => ({ minHeight: theme.layout.touchTarget, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs, borderRadius: theme.radius.md,
        backgroundColor: pressed ? theme.colors.surfaceTint : "transparent", opacity: pressed ? theme.motion.pressOpacity : 1 })}>
      <AppIcon name="sparkles" size={theme.layout.iconSmall} color={theme.colors.primary} />
      <AppText variant="label" style={{ flex: 1 }}>{copy.quickSearch}</AppText>
      <AppIcon name={suggestionsOpen ? "up" : "down"} size={theme.layout.iconSmall} color={theme.colors.textSecondary} />
    </Pressable> : null}
    {(originSearch.length > 1 || suggestionsOpen) ? <View style={{ borderRadius: theme.radius.md, overflow: "hidden", backgroundColor: theme.colors.surfaceTint }}>
      {isDebouncing || search.isFetching ? <AppText tone="muted">{copy.searching}</AppText> : search.isError
        ? <AppText tone="error" style={{ padding: theme.spacing.md }}>{copy.searchError}</AppText> : matches.length === 0 ? <AppText tone="muted" style={{ padding: theme.spacing.md }}>{suggestionsOpen && !originSearch.trim() ? copy.quickSearchEmpty : copy.searchEmpty}</AppText> : null}
      {matches.map((place, i) => <TripOriginOption key={place.id} place={place} selected={false} last={i === matches.length - 1}
        onChoose={p => {
          const parsed = planningOrigin.safeParse({ name: p.name[locale], ...p.location });
          if (parsed.success) { setValue("origin", parsed.data, { shouldValidate: true }); setValue("originName", parsed.data.name); setOriginSearch(""); setSuggestionsOpen(false); Keyboard.dismiss(); }
          else setLocationError(true);
        }} />)}
    </View> : null}
    {locationError ? <AppText tone="error" accessibilityRole="alert">{copy.locationError} {copy.originError}</AppText> : null}
    {selectedOrigin ? <AppText variant="caption" tone="muted">{selectedOrigin.name}</AppText> : null}
    <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
      <View style={{ flex: 1, minWidth: 0 }}><Controller control={control} name="start" render={({ field: input }) =>
        <TripStartTimeField compact label={copy.start} value={input.value} onChange={input.onChange} onBlur={input.onBlur} error={errors.start ? copy.timeError : undefined} />
      } /></View>
      <View style={{ flex: 1, minWidth: 0 }}><Controller control={control} name="end" render={({ field: input }) =>
        <TripStartTimeField compact label={copy.end} value={input.value} onChange={input.onChange} onBlur={input.onBlur} error={errors.end ? copy.timeError : undefined} />
      } /></View>
    </View>
    <>
      {(["interests", "excluded"] as const).filter(name => name === "interests" || advanced).map(name => <View key={name} style={{ gap: theme.spacing.sm }}>
        <AppText variant="label">{name === "interests" ? copy.interests : copy.excluded}</AppText>
        <Controller control={control} name={name} render={({ field: input }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs }}>
          {planningTags.filter(tag => advanced || input.value.includes(tag) || ["MUSEUM", "CULTURE", "LOCAL", "BEACH", "SCENERY", "RELAX"].includes(tag)).map(tag => <Pressable key={tag}
            accessibilityRole="checkbox" accessibilityState={{ checked: input.value.includes(tag) }} disabled={pending || (!input.value.includes(tag) && input.value.length >= 10)}
            style={({ pressed }) => ({ minHeight: theme.layout.touchTarget, flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full,
              backgroundColor: input.value.includes(tag) ? name === "excluded" ? theme.colors.warningSurface : theme.colors.softActionSurface : theme.colors.surfaceVariant,
              opacity: pressed ? theme.motion.pressOpacity : pending ? 0.55 : 1 })}
            onPress={() => {
              input.onChange(input.value.includes(tag) ? input.value.filter(t => t !== tag) : [...input.value, tag]);
              if (!input.value.includes(tag)) {
                const other = name === "interests" ? "excluded" : "interests";
                setValue(other, getValues(other).filter(t => t !== tag));
              }
            }}><AppText variant="body" style={input.value.includes(tag) && name === "excluded" ? { color: theme.colors.onWarningSurface } : undefined}>{tagLabels[tag][locale === "en" ? 1 : 0]}</AppText>{input.value.includes(tag) ? <AppIcon name={name === "excluded" ? "close" : "tick"} size={theme.layout.iconSmall} color={name === "excluded" ? theme.colors.onWarningSurface : theme.colors.primary} /> : null}</Pressable>)}
        </View>} />
      </View>)}
      {errors.interests ? <AppText accessibilityRole="alert" tone="error">{copy.chooseInterest}</AppText> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: advanced }} disabled={pending} onPress={() => setAdvanced(!advanced)}
        style={({ pressed }) => ({ minHeight: theme.layout.touchTarget, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: theme.spacing.xs, opacity: pressed ? theme.motion.pressOpacity : 1 })}>
        <AppIcon name="tune" size={theme.layout.iconSmall} color={theme.colors.primary} /><AppText variant="label" tone="primary">{advanced ? copy.less : copy.advanced}</AppText>
      </Pressable>
    </>
    {field("additionalText", copy.additionalText, copy.additionalTextHint)}
    <AppText variant="label">{copy.pace}</AppText>
    <Controller control={control} name="pace" render={({ field: input }) => <View accessibilityRole="radiogroup" style={{ flexDirection: "row", padding: theme.spacing.xxs, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant }}>
      {(["RELAXED", "BALANCED", "ACTIVE"] as const).map(pace => <Pressable key={pace} disabled={pending} accessibilityRole="radio" accessibilityState={{ checked: input.value === pace }}
        style={({ pressed }) => ({ flex: 1, minHeight: theme.layout.touchTarget, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.xs,
          borderRadius: theme.radius.sm, backgroundColor: input.value === pace ? theme.colors.surface : "transparent", opacity: pressed ? theme.motion.pressOpacity : pending ? 0.55 : 1 })}
        onPress={() => input.onChange(pace)}><AppText variant="label" style={{ color: input.value === pace ? theme.colors.text : theme.colors.textSecondary, fontFamily: input.value === pace ? theme.typography.fontFamily.semibold : theme.typography.fontFamily.regular }}>
          {pace === "RELAXED" ? copy.relaxed : pace === "BALANCED" ? copy.balanced : copy.active}
        </AppText></Pressable>)}
    </View>} />
    <Controller control={control} name="roundTrip" render={({ field: input }) => <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
      <AppText style={{ flex: 1 }}>{copy.return}</AppText><Switch accessibilityLabel={copy.return} disabled={pending} value={input.value} onValueChange={input.onChange} />
    </View>} />
    <View accessibilityLabel={copy.review} style={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
      <AppText variant="label">{copy.review}</AppText>
      <AppText variant="body" tone="muted">{trip.destination.name} · {trip.dayCount} ngày · {trip.startDate} · {values.originName ?? ""} · {values.start ?? "08:00"}–{values.end ?? "17:00"} · {values.pace === "RELAXED" ? copy.relaxed : values.pace === "ACTIVE" ? copy.active : copy.balanced}</AppText>
      {values.roundTrip === false ? <AppText variant="body" tone="muted">{copy.reviewOneWay}</AppText> : null}
      {interests.length ? <AppText variant="body" tone="muted">{copy.reviewInterests}: {interests.map(tag => tagLabels[tag][locale === "en" ? 1 : 0]).join(", ")}</AppText> : null}
      {excluded.length ? <AppText variant="body" tone="muted">{copy.reviewExcluded}: {excluded.map(tag => tagLabels[tag][locale === "en" ? 1 : 0]).join(", ")}</AppText> : null}
      {additionalText.trim() ? <AppText variant="body" tone="muted" numberOfLines={2}>{copy.reviewExtra}: {additionalText.trim()}</AppText> : null}
    </View>
    {pending ? <TripPlanningLoadingCard title={copy.generatingTitle} message={copy.generatingMessage} /> : null}
    <AppButton loading={pending} disabled={locating} onPress={() => { void handleSubmit(async values => {
      if (!values.origin || !trip.startDate) return;
      Keyboard.dismiss();
      const common = { origin: values.origin, startDate: trip.startDate, roundTrip: values.roundTrip, restMinutes: 45 };
      await onSubmit({ ...common, ...(values.additionalText.trim() ? { additionalText: values.additionalText.trim() } : {}), preferences: { destination: trip.destination.name, numberOfDays: trip.dayCount,
          dailyStartTime: values.start, dailyEndTime: values.end, interests: values.interests, excludedTags: values.excluded,
          travelPace: values.pace, mustVisitNames: [], excludedPlaceNames: [] } });
    })(); }}>{pending ? copy.generateLoading : copy.generate}</AppButton>
  </View>;
}
