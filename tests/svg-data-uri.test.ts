import assert from "node:assert/strict";
import { test } from "node:test";
import { svgDataUri } from "../src/utils/svg-data-uri.ts";

test("SVG image data is base64 for Android and preserves Vietnamese/emoji UTF-8", () => {
  for (const source of [
    "",
    "a",
    "ab",
    "abc",
    '<svg xmlns="http://www.w3.org/2000/svg"><text>Đà Lạt 🌦️ &amp; WeGo</text></svg>',
  ]) {
    const uri = svgDataUri(source);
    assert.ok(uri.startsWith("data:image/svg+xml;base64,"));
    assert.equal(
      Buffer.from(uri.split(",")[1], "base64").toString("utf8"),
      source,
    );
  }
});
