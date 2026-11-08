import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { PhotoSelection } from "../src/features/home/utils/photo-viewer-geometry.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function find(value: unknown, type: string): Node | undefined {
  if (Array.isArray(value))
    return value.map((item) => find(item, type)).find(Boolean);
  if (!value || typeof value !== "object" || !("props" in value)) return;
  const node = value as Node;
  return node.type === type ? node : find(node.props.children, type);
}

test("shared thumbnail opens the existing viewer only with real image dimensions and current screen bounds", () => {
  const state: unknown[] = [];
  const refs: { current: unknown }[] = [];
  let stateCursor = 0;
  let refCursor = 0;
  let read: (() => PhotoSelection | null) | undefined;
  let opened: PhotoSelection | undefined;
  const bounds = { x: 12, y: 180, width: 310, height: 310 };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const index = stateCursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (value: unknown) => {
            state[index] = value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const index = refCursor++;
        return (refs[index] ??= { current: initial });
      },
      useEffect: (effect: () => void) => effect(),
      useCallback: (callback: unknown) => callback,
    },
    "expo-image": { Image: "Image" },
    "react-native": {
      Pressable: "Pressable",
      View: "View",
      StyleSheet: { create: (value: unknown) => value, absoluteFill: {} },
    },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "../i18n/ongoing-copy": {
      useOngoingCopy: () => ({
        locale: "vi",
        copy: { photoUnavailable: "Unavailable", viewJournal: "View" },
      }),
    },
  });
  const { JournalPhotoThumbnail } = load<
    typeof import("../src/features/home/components/journal-photo-thumbnail.tsx")
  >("src/features/home/components/journal-photo-thumbnail.tsx");
  function render(hidden = false, grid = false) {
    stateCursor = 0;
    refCursor = 0;
    return JournalPhotoThumbnail({
      memory: {
        id: "photo",
        photo: "file:///photo.jpg",
        destination: "",
        text: "",
      },
      hidden,
      standalone: true,
      variant: grid ? "grid" : "framed",
      thumbnailSource: grid ? "file:///thumbnail.jpg" : undefined,
      onOpen: (value) => {
        opened = value;
      },
      registerPhoto: (_id, reader) => {
        read = reader;
        return () => {};
      },
    });
  }
  let tree = render();
  assert.equal(tree.props.disabled, true);
  assert.equal(read?.(), null);
  const frame = find(tree, "View");
  assert.ok(frame);
  (frame.props.ref as { current: unknown }).current = {
    getBoundingClientRect: () => bounds,
  };
  const image = find(tree, "Image");
  assert.ok(image);
  (image.props.onLoad as (event: unknown) => void)({
    source: { url: "file:///photo.jpg", width: 1600, height: 1200 },
  });
  tree = render();
  assert.equal(tree.props.disabled, false);
  tree.props.onPress?.();
  assert.ok(opened);
  assert.equal(opened.id, "photo");
  assert.equal(opened.size.width, 1600);
  assert.equal(opened.origin.x, 12);
  bounds.y = 70;
  assert.equal(read?.()?.origin.y, 70);
  const hiddenStyle = render(true).props.style({ pressed: false });
  assert.equal(hiddenStyle[1].opacity, 0);
  assert.equal(find(tree, "View")?.props.style[1].aspectRatio, 1);
  const grid = render(false, true);
  const gridStyle = grid.props.style({ pressed: false })[1];
  assert.equal(gridStyle.borderWidth, 0);
  assert.equal(gridStyle.boxShadow, undefined);
  const thumbnail = find(grid, "Image");
  assert.ok(thumbnail);
  assert.equal(thumbnail.props.source, "file:///thumbnail.jpg");
  (thumbnail.props.onLoad as (event: unknown) => void)({
    source: { url: "file:///thumbnail.jpg", width: 640, height: 480 },
  });
  render(false, true);
  assert.equal(read?.()?.uri, "file:///photo.jpg");
  (thumbnail.props.onError as () => void)();
  assert.equal(
    find(render(false, true), "Image")?.props.source,
    "file:///photo.jpg",
  );
});
