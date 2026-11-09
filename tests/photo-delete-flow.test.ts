import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import * as tokens from "../src/theme/tokens.ts";
import { lightColors } from "../src/theme/colors.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function find(tree: unknown, type: string): Node | undefined {
  if (Array.isArray(tree))
    return tree.map((node) => find(node, type)).find(Boolean);
  if (!tree || typeof tree !== "object" || !("props" in tree)) return;
  const node = tree as Node;
  return node.type === type ? node : find(node.props.children, type);
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function fixture(canDelete = true) {
  const slots: unknown[] = [];
  let cursor = 0;
  let closed = 0;
  let deleted = 0;
  let failure: unknown;
  let resolve: () => void = () => {};
  let wait = false;
  const load = tripModuleLoader({
    react: {
      useState(initial: unknown) {
        const i = cursor++;
        if (!(i in slots))
          slots[i] = typeof initial === "function" ? initial() : initial;
        return [
          slots[i],
          (value: unknown) => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
      useRef(initial: unknown) {
        const i = cursor++;
        return (slots[i] ??= { current: initial });
      },
      useEffect() {},
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: unknown) => ({ type, props }),
      jsxs: (type: unknown, props: unknown) => ({ type, props }),
    },
    "react-native": {
      View: "View",
      Modal: "Modal",
      Pressable: "Pressable",
      ActivityIndicator: "Spinner",
      Platform: { OS: "web" },
      useWindowDimensions: () => ({ width: 390, height: 844 }),
      StyleSheet: { absoluteFill: {}, create: (value: unknown) => value },
    },
    "expo-image": { Image: "Image" },
    "expo-status-bar": { StatusBar: "StatusBar" },
    "react-native-gesture-handler": {
      GestureDetector: "Gesture",
      GestureHandlerRootView: "Root",
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "Animated.View" },
    },
    "@/hooks/use-screen-insets": {
      useScreenInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
    },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({ ...tokens, colors: lightColors }),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/services/api/api-error": { ApiError },
    "@/components/ui/app-text": { AppText: "Text" },
    "../hooks/use-photo-viewer-motion": {
      usePhotoViewerMotion: (options: { onDismiss: () => void }) => ({
        close: options.onDismiss,
        open() {},
        gesture: {},
      }),
    },
    "../hooks/use-photo-viewer-keyboard": { usePhotoViewerKeyboard() {} },
    "../services/journal-photo-actions": {
      saveJournalPhoto: async () => {},
      shareJournalPhoto: async () => {},
    },
    "./photo-viewer-toolbar": {
      PhotoViewerToolbar: "Toolbar",
      PhotoDeleteConfirmation: "Confirmation",
      PhotoInfoPanel: "Info",
    },
  });
  const { JournalPhotoViewer } = load<
    typeof import("../src/features/home/components/journal-photo-viewer.tsx")
  >("src/features/home/components/journal-photo-viewer.tsx");
  function render() {
    cursor = 0;
    return JournalPhotoViewer({
      memories: [
        {
          id: "photo",
          destination: "Đà Lạt",
          text: "",
          photo: "https://example.com/photo.jpg",
        },
      ],
      selection: {
        id: "photo",
        uri: "https://example.com/photo.jpg",
        size: { width: 800, height: 600 },
        origin: { x: 10, y: 100, width: 100, height: 100 },
      },
      getSelection: () => null,
      onActiveChange() {},
      onClose() {
        closed++;
      },
      canDelete: () => canDelete,
      onDelete: async () => {
        deleted++;
        if (wait)
          await new Promise<void>((done) => {
            resolve = done;
          });
        if (failure) throw failure;
      },
    });
  }
  function press(type: string, handler: string) {
    const node = find(render(), type);
    assert.ok(node);
    assert.equal(typeof node.props[handler], "function");
    (node.props[handler] as () => void)();
  }
  return {
    render,
    press,
    setFailure(value: unknown) {
      failure = value;
    },
    hold() {
      wait = true;
    },
    finish() {
      resolve();
    },
    get closed() {
      return closed;
    },
    get deleted() {
      return deleted;
    },
  };
}

test("photo deletion awaits success, blocks repeated taps/back/cancel and only then closes", async () => {
  const f = fixture();
  f.hold();
  f.press("Toolbar", "onDelete");
  assert.equal(f.deleted, 0);
  f.press("Confirmation", "onConfirm");
  f.press("Confirmation", "onConfirm");
  assert.equal(f.deleted, 1);
  assert.equal(f.closed, 0);
  assert.equal(find(f.render(), "Confirmation")?.props.busy, true);
  f.press("Confirmation", "onCancel");
  f.press("Modal", "onRequestClose");
  assert.ok(find(f.render(), "Confirmation"));
  f.finish();
  await flush();
  assert.equal(f.closed, 1);
  assert.equal(find(f.render(), "Confirmation"), undefined);
});

test("a network failure keeps the photo and confirmation available to retry", async () => {
  const f = fixture();
  f.setFailure(new ApiError("NETWORK"));
  f.press("Toolbar", "onDelete");
  f.press("Confirmation", "onConfirm");
  await flush();
  assert.equal(f.closed, 0);
  assert.match(
    String(find(f.render(), "Confirmation")?.props.error),
    /Kiểm tra kết nối/,
  );
  assert.equal(find(f.render(), "Confirmation")?.props.busy, false);
  f.setFailure(undefined);
  f.press("Confirmation", "onConfirm");
  await flush();
  assert.equal(f.deleted, 2);
  assert.equal(f.closed, 1);
});

test("pending storage cleanup and missing legacy identity have distinct feedback", async () => {
  for (const [code, text] of [
    ["MEDIA_002", /đã lưu yêu cầu/],
    ["MEDIA_003", /thiếu thông tin/],
  ]) {
    const f = fixture();
    f.setFailure(new ApiError(String(code)));
    f.press("Toolbar", "onDelete");
    f.press("Confirmation", "onConfirm");
    await flush();
    assert.equal(f.closed, 0);
    assert.match(
      String(find(f.render(), "Confirmation")?.props.error),
      text as RegExp,
    );
  }
});

test("canceling confirmation and viewing samples never sends a delete", () => {
  const f = fixture();
  f.press("Toolbar", "onDelete");
  f.press("Confirmation", "onCancel");
  assert.equal(f.deleted, 0);
  assert.equal(find(f.render(), "Confirmation"), undefined);
  const sample = fixture(false);
  assert.equal(find(sample.render(), "Toolbar")?.props.onDelete, undefined);
});
