import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(
  readFileSync(
    new URL("../src/hooks/use-screen-insets.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;

const cases = [
  {
    name: "Android protects the status bar when the reported top inset is zero",
    os: "android",
    top: 0,
    height: 28,
    y: 0,
    expected: 28,
  },
  {
    name: "a larger cutout inset takes priority over the status bar height",
    os: "android",
    top: 59,
    height: 28,
    y: 0,
    expected: 59,
  },
  {
    name: "status bar and safe area are not added together",
    os: "android",
    top: 28,
    height: 28,
    y: 0,
    expected: 28,
  },
  {
    name: "a provider already below the status bar does not add that space twice",
    os: "android",
    top: 0,
    height: 28,
    y: 28,
    expected: 0,
  },
  {
    name: "iOS retains the device notch inset",
    os: "ios",
    top: 59,
    height: undefined,
    y: 0,
    expected: 59,
  },
  {
    name: "web does not acquire an Android status bar inset",
    os: "web",
    top: 0,
    height: 28,
    y: 0,
    expected: 0,
  },
  {
    name: "an unknown status bar height does not invent a fixed offset",
    os: "android",
    top: 0,
    height: undefined,
    y: 0,
    expected: 0,
  },
];

for (const example of cases) {
  test(example.name, () => {
    const module = { exports: {} };
    runInNewContext(code, {
      module,
      exports: module.exports,
      require: (name: string) => {
        if (name === "react-native")
          return {
            Platform: { OS: example.os },
            StatusBar: { currentHeight: example.height },
          };
        if (name === "react-native-safe-area-context")
          return {
            useSafeAreaInsets: () => ({
              top: example.top,
              right: 4,
              bottom: 34,
              left: 2,
            }),
            useSafeAreaFrame: () => ({
              x: 0,
              y: example.y,
              width: 390,
              height: 844,
            }),
          };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    });
    const { useScreenInsets } =
      module.exports as typeof import("../src/hooks/use-screen-insets.ts");
    const insets = useScreenInsets();
    assert.equal(insets.top, example.expected);
    assert.equal(insets.right, 4);
    assert.equal(insets.bottom, 34);
    assert.equal(insets.left, 2);
  });
}
