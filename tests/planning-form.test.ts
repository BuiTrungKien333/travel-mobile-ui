import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Element = { type: string; props: { children?: unknown; onPress?: () => void } };
function buttons(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(buttons);
  if (!node || typeof node !== "object") return [];
  const element = node as Element;
  return [...(element.type === "AppButton" ? [element] : []), ...buttons(element.props?.children)];
}
test("editing a natural-language draft restores the original request and regenerates with trip context", async () => {
  let defaults: Record<string, unknown> = {};
  let submitted: { text: string } | undefined;
  const tokens = tripModuleLoader()<Record<string, unknown>>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useState: (value: unknown) => [value, () => {}] },
    "react-hook-form": {
      Controller: "Controller",
      useWatch: ({ name }: { name: string }) => defaults[name],
      useForm: ({ defaultValues }: { defaultValues: Record<string, unknown> }) => {
        defaults = defaultValues;
        return { control: {}, formState: { errors: {} }, setValue: () => {}, getValues: (name: string) => defaults[name],
          handleSubmit: (handler: (value: unknown) => Promise<void>) => () => handler(defaults) };
      },
    },
    "react-native": { View: "View", Switch: "Switch", Keyboard: { dismiss() {} } },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-input": { AppInput: "AppInput" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "./trip-origin-option": { TripOriginOption: "TripOriginOption" },
    "../api/place-discovery-queries": { usePlaceDiscovery: () => ({ query: {}, isDebouncing: false }) },
    "../api/place-discovery-api": { discoveryStop: (value: unknown) => value },
  });
  const { TripPlanningForm } = load<{ TripPlanningForm: (props: unknown) => Element }>("src/features/trip/components/trip-planning-form.tsx");
  const tree = TripPlanningForm({
    trip: { id: "trip", destination: { name: "Đà Nẵng" }, dayCount: 2, startDate: "2027-01-10", preferences: [] },
    initial: { text: "Tôi đi Đà Nẵng 2 ngày, mỗi ngày từ 09:30 đến 18:30. Nhịp độ thong thả.\n\nThích lịch sử, không đi biển.",
      origin: { name: "Hotel", latitude: 16.06, longitude: 108.22 }, roundTrip: true },
    pending: false, onSubmit: async (value: { text: string }) => { submitted = value; },
  });
  assert.equal(defaults.textMode, true);
  assert.equal(defaults.text, "Thích lịch sử, không đi biển.");
  assert.equal(defaults.start, "09:30");
  assert.equal(defaults.end, "18:30");
  assert.equal(defaults.pace, "RELAXED");
  buttons(tree).find(button => button.props.children === "Tạo bản nháp")!.props.onPress!();
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.match(submitted?.text ?? "", /Đà Nẵng 2 ngày/);
  assert.match(submitted?.text ?? "", /Thích lịch sử, không đi biển\./);
  assert.equal((submitted?.text.match(/Tôi đi/g) ?? []).length, 1);
});
