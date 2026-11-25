import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripStop } from "../src/features/home/types/home-types.ts";
import { tripDirectionsUrl } from "../src/features/home/utils/map-links.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const stop: TripStop = {
  id: "next",
  name: { vi: "Nhà mình & gia đình", en: "Home" },
  time: "",
  kind: { vi: "", en: "" },
  location: { latitude: 16.047, longitude: 108.206 },
};

test("directions use current GPS as origin and the actual next destination, preserving travel mode", () => {
  for (const [mode, expected] of [
    ["car", "driving"],
    ["walk", "walking"],
    ["bicycle", "bicycling"],
    ["motorcycle", "two-wheeler"],
  ] as const) {
    const url = new URL(tripDirectionsUrl(stop, "Đà Nẵng", mode));
    assert.equal(url.searchParams.get("api"), "1");
    assert.equal(url.searchParams.get("origin"), null);
    assert.equal(url.searchParams.get("destination"), "16.047,108.206");
    assert.equal(url.searchParams.get("travelmode"), expected);
    assert.equal(url.searchParams.get("dir_action"), "navigate");
  }
  const fallback = new URL(
    tripDirectionsUrl({ ...stop, location: undefined }, "Đà Nẵng"),
  );
  assert.equal(
    fallback.searchParams.get("destination"),
    "Nhà mình & gia đình, Đà Nẵng, Vietnam",
  );
});

test("duplicate directions presses open once, and a failed Maps launch is recoverable", async () => {
  const slots: unknown[] = [];
  let cursor = 0;
  let opens = 0;
  let fail = true;
  const load = tripModuleLoader({
    react: {
      useRef: (initial: unknown) => {
        const i = cursor++;
        return slots[i] ?? (slots[i] = { current: initial });
      },
      useState: (initial: unknown) => {
        const i = cursor++;
        if (!(i in slots)) slots[i] = initial;
        return [
          slots[i],
          (value: unknown) => {
            slots[i] = value;
          },
        ];
      },
    },
    "react-native": {
      Linking: {
        openURL: async () => {
          opens++;
          if (fail) throw new Error("No handler");
        },
      },
    },
    "@/features/home/i18n/ongoing-copy": {
      useOngoingCopy: () => ({ copy: { directionsError: "Try Maps again" } }),
    },
  });
  const { useTripDirections } = load<
    typeof import("../src/features/trip/hooks/use-trip-directions.ts")
  >("src/features/trip/hooks/use-trip-directions.ts");
  const render = () => {
    cursor = 0;
    return useTripDirections();
  };
  const actions = render();
  await Promise.all([
    actions.open(stop, "Đà Nẵng"),
    actions.open(stop, "Đà Nẵng"),
  ]);
  assert.equal(opens, 1);
  assert.equal(render().error, "Try Maps again");
  fail = false;
  await render().open(stop, "Đà Nẵng");
  assert.equal(opens, 2);
  assert.equal(render().error, undefined);
});

test("camera sync failures provide a normalized diagnostic without leaking raw error data", () => {
  const load = tripModuleLoader({
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
  });
  const { ApiError } = load<typeof import("../src/services/api/api-error.ts")>(
    "src/services/api/api-error.ts",
  );
  const { cameraApiErrorMessage } = load<
    typeof import("../src/features/camera/utils/camera-error-message.ts")
  >("src/features/camera/utils/camera-error-message.ts");
  const { useCameraCopy } = load<
    typeof import("../src/features/camera/i18n/camera-copy.ts")
  >("src/features/camera/i18n/camera-copy.ts");
  const copy = useCameraCopy().copy;
  assert.match(
    cameraApiErrorMessage(new ApiError("NETWORK"), copy),
    /Wi-Fi.*NETWORK/,
  );
  assert.match(
    cameraApiErrorMessage(new ApiError("UPLOAD_006", 503), copy),
    /Máy chủ chưa sẵn sàng.*HTTP 503/,
  );
  const message = cameraApiErrorMessage(
    new ApiError("file:///secret.jpg"),
    copy,
  );
  assert.match(message, /UNKNOWN/);
  assert.doesNotMatch(message, /secret|file:/);
});
