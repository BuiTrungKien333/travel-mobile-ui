import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Keyboard, Switch, View } from "react-native";
import { z } from "zod";
import { AppText } from "@/components/ui/app-text";
import { AppInput } from "@/components/ui/app-input";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import { planningOrigin, planningTag, planningTags, type PlanningInput } from "../api/planning-contract";
import type { TripDetailDto } from "../api/trip-contract";
import { usePlaceDiscovery } from "../api/place-discovery-queries";
import { discoveryStop } from "../api/place-discovery-api";
import { currentTripPosition } from "../services/current-trip-position";
import { TripOriginOption } from "./trip-origin-option";
import { tagLabels, usePlanningCopy } from "../i18n/planning-copy";
import { planningTextContext } from "../utils/planning-text-context";

const namesValid = (text: string) => {
  const names = text.split(";").map(n => n.trim()).filter(Boolean);
  return names.length <= 10 && names.every(n => n.length <= 160);
};
const formSchema = z.object({
  originName: z.string().max(160), origin: planningOrigin.nullable(),
  start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  pace: z.enum(["RELAXED", "BALANCED", "ACTIVE"]), interests: z.array(planningTag).max(10), excluded: z.array(planningTag).max(10),
  must: z.string().max(1600).refine(namesValid), avoid: z.string().max(1600).refine(namesValid),
  textMode: z.boolean(), text: z.string().max(600), roundTrip: z.boolean(),
}).refine(v => !!v.origin, { path: ["origin"] })
  .refine(v => v.end > v.start, { path: ["end"] })
  .refine(v => v.textMode || v.interests.length > 0 || v.must.trim().length > 0, { path: ["interests"] })
  .refine(v => !v.textMode || v.text.trim().length > 0, { path: ["text"] });
type Values = z.infer<typeof formSchema>;

export function TripPlanningForm({ trip, initial, pending, onSubmit, preferStructured = false }: {
  trip: TripDetailDto; initial?: PlanningInput; pending: boolean; onSubmit: (input: PlanningInput) => Promise<void>; preferStructured?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlanningCopy();
  const originalText = planningTextContext(initial?.text);
  const [originSearch, setOriginSearch] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [advanced, setAdvanced] = useState(Boolean(initial?.preferences?.excludedTags.length || initial?.preferences?.mustVisitNames.length || initial?.preferences?.excludedPlaceNames.length));
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
      excluded: initial?.preferences?.excludedTags ?? [], must: initial?.preferences?.mustVisitNames.join("; ") ?? "",
      avoid: initial?.preferences?.excludedPlaceNames.join("; ") ?? "", textMode: Boolean(initial?.text) && !preferStructured,
      text: originalText.text, roundTrip: initial?.roundTrip ?? true,
    },
  });
  const textMode = useWatch({ control, name: "textMode" });
  const selectedOrigin = useWatch({ control, name: "origin" });
  const { query: search, isDebouncing } = usePlaceDiscovery({ tripId: trip.id }, originSearch, locale, originSearch.trim().length > 1);
  const matches = !isDebouncing ? search.data?.pages.flatMap(page => page.content.map(discoveryStop)).slice(0, 4) ?? [] : [];
  const splitNames = (value: string) => [...new Set(value.split(";").map(n => n.trim()).filter(Boolean))];
  const field = (name: "start" | "end" | "must" | "avoid" | "text", label: string, helper?: string) => (
    <Controller key={name} control={control} name={name} render={({ field: input }) => (
      <AppInput label={label} value={input.value} onChangeText={input.onChange} onBlur={input.onBlur}
        editable={!pending} helperText={helper} multiline={name === "text"} maxLength={name === "text" ? 600 : name === "start" || name === "end" ? 5 : 1600}
        error={errors[name] ? name === "start" || name === "end" ? copy.timeError : copy.invalid : undefined} />
    )} />
  );
  return <View pointerEvents={pending ? "none" : "auto"} style={{ gap: theme.spacing.lg }}>
    <AppText tone="muted">{copy.intro}</AppText>
    <Controller control={control} name="originName" render={({ field: input }) => (
      <AppInput label={copy.origin} value={input.value} editable={!pending} helperText={copy.originHint}
        error={errors.origin ? copy.originError : undefined}
        onChangeText={text => { input.onChange(text); setValue("origin", null); setOriginSearch(text); }} />
    )} />
    {originSearch.length > 1 ? <View>
      {isDebouncing || search.isFetching ? <AppText tone="muted">{copy.searching}</AppText> : search.isError
        ? <AppText tone="error">{copy.searchError}</AppText> : matches.length === 0 ? <AppText tone="muted">{copy.searchEmpty}</AppText> : null}
      {matches.map((place, i) => <TripOriginOption key={place.id} place={place} selected={false} last={i === matches.length - 1}
        onChoose={p => {
          const parsed = planningOrigin.safeParse({ name: p.name[locale], ...p.location });
          if (parsed.success) { setValue("origin", parsed.data, { shouldValidate: true }); setValue("originName", parsed.data.name); setOriginSearch(""); Keyboard.dismiss(); }
          else setLocationError(true);
        }} />)}
    </View> : null}
    <AppButton variant="outline" disabled={pending} loading={locating} onPress={() => {
      if (locating) return;
      setLocating(true); setLocationError(false);
      void currentTripPosition(copy.current).then(place => {
        const origin = planningOrigin.safeParse({ name: copy.current, ...place.location });
        if (!origin.success) { setLocationError(true); return; }
        setValue("origin", origin.data, { shouldValidate: true }); setValue("originName", origin.data.name); setOriginSearch("");
      }).catch(() => setLocationError(true)).finally(() => setLocating(false));
    }}>{copy.current}</AppButton>
    {locationError ? <AppText tone="error" accessibilityRole="alert">{copy.locationError} {copy.originError}</AppText> : null}
    {selectedOrigin ? <AppText variant="caption" tone="muted">{selectedOrigin.name}</AppText> : null}
    {field("start", copy.start)}{field("end", copy.end)}
    <Controller control={control} name="textMode" render={({ field: input }) => <AppButton variant="outline" disabled={pending}
      onPress={() => input.onChange(!input.value)}>{input.value ? copy.formMode : copy.textMode}</AppButton>} />
    {textMode ? field("text", copy.text, copy.textHint) : <>
      {(["interests", "excluded"] as const).filter(name => name === "interests" || advanced).map(name => <View key={name} style={{ gap: theme.spacing.sm }}>
        <AppText variant="label">{name === "interests" ? copy.interests : copy.excluded}</AppText>
        <Controller control={control} name={name} render={({ field: input }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {planningTags.filter(tag => advanced || input.value.includes(tag) || ["MUSEUM", "CULTURE", "LOCAL", "BEACH", "SCENERY", "RELAX"].includes(tag)).map(tag => <AppButton key={tag} size="small" variant={input.value.includes(tag) ? "soft" : "outline"}
            accessibilityState={{ selected: input.value.includes(tag) }} disabled={pending || (!input.value.includes(tag) && input.value.length >= 10)}
            onPress={() => {
              input.onChange(input.value.includes(tag) ? input.value.filter(t => t !== tag) : [...input.value, tag]);
              if (!input.value.includes(tag)) {
                const other = name === "interests" ? "excluded" : "interests";
                setValue(other, getValues(other).filter(t => t !== tag));
              }
            }}>{tagLabels[tag][locale === "en" ? 1 : 0]}</AppButton>)}
        </View>} />
      </View>)}
      {errors.interests ? <AppText accessibilityRole="alert" tone="error">{copy.chooseInterest}</AppText> : null}
      <AppButton variant="outline" disabled={pending} accessibilityState={{ expanded: advanced }} onPress={() => setAdvanced(!advanced)}>{advanced ? copy.less : copy.advanced}</AppButton>
      {advanced ? <>{field("must", copy.must, copy.namesHint)}{field("avoid", copy.avoid, copy.namesHint)}</> : null}
    </>}
    <AppText variant="label">{copy.pace}</AppText>
    <Controller control={control} name="pace" render={({ field: input }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
      {(["RELAXED", "BALANCED", "ACTIVE"] as const).map(pace => <AppButton key={pace} size="small" disabled={pending}
        variant={input.value === pace ? "soft" : "outline"} accessibilityState={{ selected: input.value === pace }}
        onPress={() => input.onChange(pace)}>{pace === "RELAXED" ? copy.relaxed : pace === "BALANCED" ? copy.balanced : copy.active}</AppButton>)}
    </View>} />
    <Controller control={control} name="roundTrip" render={({ field: input }) => <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
      <AppText style={{ flex: 1 }}>{copy.return}</AppText><Switch accessibilityLabel={copy.return} disabled={pending} value={input.value} onValueChange={input.onChange} />
    </View>} />
    <AppText variant="caption" tone="muted">{copy.routing}</AppText>
    {pending ? <AppText accessibilityLiveRegion="polite">{copy.generating}</AppText> : null}
    <AppButton loading={pending} disabled={locating} onPress={() => { void handleSubmit(async values => {
      if (!values.origin || !trip.startDate) return;
      Keyboard.dismiss();
      const common = { origin: values.origin, startDate: trip.startDate, roundTrip: values.roundTrip, restMinutes: 45 };
      await onSubmit(values.textMode ? { ...common, text: `Tôi đi ${trip.destination.name} ${trip.dayCount} ngày, mỗi ngày từ ${values.start} đến ${values.end}. Nhịp độ ${values.pace === "RELAXED" ? "thong thả" : values.pace === "ACTIVE" ? "năng động" : "vừa phải"}.\n\n${values.text}` }
        : { ...common, preferences: { destination: trip.destination.name, numberOfDays: trip.dayCount,
          dailyStartTime: values.start, dailyEndTime: values.end, interests: values.interests, excludedTags: values.excluded,
          travelPace: values.pace, mustVisitNames: splitNames(values.must), excludedPlaceNames: splitNames(values.avoid) } });
    })(); }}>{copy.generate}</AppButton>
  </View>;
}
