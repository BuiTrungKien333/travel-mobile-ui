import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const serviceUrl = new URL(
  "../src/features/home/services/journal-photo-actions.ts",
  import.meta.url,
);
const errorUrl = new URL(
  "../src/features/home/services/photo-action-error.ts",
  import.meta.url,
);
const compile = (url: URL) =>
  ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: url.pathname,
  }).outputText;
const serviceCode = compile(serviceUrl);
const errorCode = compile(errorUrl);
const anchor = { x: 0, y: 0, width: 48, height: 48 };

function fixture({
  modules = [
    "FileSystem",
    "ExpoMediaLibraryNext",
    "ExpoSharing",
    "ExpoImageManipulator",
  ],
  os = "android",
  version = 35,
  granted = true,
  sharingAvailable = true,
  deferCopy = false,
}: {
  modules?: string[];
  os?: string;
  version?: number;
  granted?: boolean;
  sharingAvailable?: boolean;
  deferCopy?: boolean;
} = {}) {
  const events: string[] = [];
  const loaded: string[] = [];
  let finishCopy = () => {};
  const copyGate = new Promise<void>((resolve) => {
    finishCopy = resolve;
  });
  const errorModule = { exports: {} };
  runInNewContext(errorCode, {
    exports: errorModule.exports,
    module: errorModule,
    Error,
  });
  class Directory {
    exists = false;
    uri: string;
    constructor(base: string, name: string) {
      this.uri = `${base}/${name}`;
    }
    create() {
      events.push("directory:create");
      this.exists = true;
    }
    delete() {
      events.push("directory:delete");
      this.exists = false;
    }
  }
  class File {
    exists = true;
    uri: string;
    type = "image/jpeg";
    constructor(base: string | Directory, name?: string) {
      this.uri = name
        ? `${typeof base === "string" ? base : base.uri}/${name}`
        : String(base);
    }
    async copy() {
      events.push("file:copy");
      if (deferCopy) {
        await copyGate;
        events.push("file:copied");
      }
    }
    delete() {
      events.push("file:delete");
      this.exists = false;
    }
  }
  const optional: Record<string, { nativeName: string; value: unknown }> = {
    "expo-file-system": {
      nativeName: "FileSystem",
      value: { Directory, File, Paths: { cache: "file:///cache" } },
    },
    "expo-media-library": {
      nativeName: "ExpoMediaLibraryNext",
      value: {
        requestPermissionsAsync: async (
          writeOnly: boolean,
          granular: string[],
        ) => {
          events.push(`permission:${writeOnly}:${granular.length}`);
          return { granted };
        },
        Asset: {
          create: async (uri: string) => {
            events.push(`save:${uri}`);
          },
        },
      },
    },
    "expo-image-manipulator": {
      nativeName: "ExpoImageManipulator",
      value: {
        SaveFormat: { PNG: "png" },
        ImageManipulator: {
          manipulate: () => ({
            renderAsync: async () => ({
              saveAsync: async () => ({ uri: "file:///cache/decoded.png" }),
              release: () => events.push("rendered:release"),
            }),
            release: () => events.push("context:release"),
          }),
        },
      },
    },
    "expo-sharing": {
      nativeName: "ExpoSharing",
      value: {
        isAvailableAsync: async () => sharingAvailable,
        shareAsync: async (uri: string) => {
          events.push(`share:${uri}`);
        },
      },
    },
  };
  const module = { exports: {} };
  runInNewContext(serviceCode, {
    exports: module.exports,
    module,
    require: (name: string) => {
      if (name === "expo")
        return {
          requireOptionalNativeModule: (id: string) =>
            modules.includes(id) ? {} : null,
        };
      if (name === "expo-image")
        return {
          Image: {
            loadAsync: async (uri: string) => {
              events.push(`decode:${uri}`);
              return { release: () => events.push("decoded:release") };
            },
          },
        };
      if (name === "react-native")
        return { Platform: { OS: os, Version: version } };
      if (name === "./photo-action-error") return errorModule.exports;
      const dependency = optional[name];
      if (!dependency) throw new Error(`Unexpected dependency: ${name}`);
      loaded.push(name);
      if (!modules.includes(dependency.nativeName))
        throw new Error(`Cannot find native module '${dependency.nativeName}'`);
      return dependency.value;
    },
  });
  return {
    actions:
      module.exports as typeof import("../src/features/home/services/journal-photo-actions.ts"),
    loaded,
    events,
    finishCopy,
  };
}

test("importing photo actions keeps Home loadable when optional native modules are absent", () => {
  const { actions, loaded } = fixture({ modules: [] });
  assert.equal(typeof actions.saveJournalPhoto, "function");
  assert.equal(typeof actions.shareJournalPhoto, "function");
  assert.deepEqual(loaded, []);
});

test("saving without MediaLibraryNext fails with an actionable error before importing or writing files", async () => {
  const { actions, loaded, events } = fixture({
    modules: ["FileSystem", "ExpoSharing"],
  });
  await assert.rejects(actions.saveJournalPhoto("file:///photo.jpg"), {
    code: "nativeBuildRequired",
  });
  assert.deepEqual(loaded, []);
  assert.deepEqual(events, []);
});

test("sharing without its native module does not import it or create temporary files", async () => {
  const { actions, loaded, events } = fixture({ modules: [] });
  await assert.rejects(
    actions.shareJournalPhoto("file:///photo.jpg", "Share", anchor),
    { code: "nativeBuildRequired" },
  );
  assert.deepEqual(loaded, []);
  assert.deepEqual(events, []);
});

test("missing file-system support cannot report a successful save", async () => {
  const { actions, loaded, events } = fixture({
    modules: ["ExpoMediaLibraryNext"],
  });
  await assert.rejects(actions.saveJournalPhoto("file:///photo.jpg"), {
    code: "nativeBuildRequired",
  });
  assert.deepEqual(loaded, ["expo-media-library"]);
  assert.deepEqual(events, []);
});

test("modern Android saves and removes its temporary copy without requesting library read access", async () => {
  const { actions, loaded, events } = fixture();
  await actions.saveJournalPhoto("file:///photo.jpg");
  assert.deepEqual(loaded, ["expo-media-library", "expo-file-system"]);
  assert.equal(events[0], "directory:create");
  assert.equal(events[1], "file:copy");
  assert.match(
    events[2],
    /^save:file:\/\/\/cache\/wego-photo-\d+\/WeGo-\d+.jpg$/,
  );
  assert.equal(events[3], "directory:delete");
  assert.equal(events.length, 4);
});

test("denied iOS add-only permission does not create files or report a save", async () => {
  const { actions, events, loaded } = fixture({ os: "ios", granted: false });
  await assert.rejects(actions.saveJournalPhoto("file:///photo.jpg"), {
    code: "permission",
  });
  assert.deepEqual(events, ["permission:true:0"]);
  assert.deepEqual(loaded, ["expo-media-library"]);
});

test("an unavailable share sheet reports its existing error without preparing a photo", async () => {
  const { actions, events } = fixture({ sharingAvailable: false });
  await assert.rejects(
    actions.shareJournalPhoto("file:///photo.jpg", "Share", anchor),
    { code: "sharingUnavailable" },
  );
  assert.deepEqual(events, []);
});

test("sharing retains the temporary file while the recipient may still need it", async () => {
  const { actions, loaded, events } = fixture();
  await actions.shareJournalPhoto("file:///photo.jpg", "Share", anchor);
  assert.deepEqual(loaded, ["expo-sharing", "expo-file-system"]);
  assert.equal(events[0], "directory:create");
  assert.equal(events[1], "file:copy");
  assert.match(
    events[2],
    /^share:file:\/\/\/cache\/wego-photo-\d+\/WeGo-\d+.jpg$/,
  );
  assert.equal(events.length, 3);
});

test("bundled Android assets export pixels to PNG instead of copying a non-file URI", async () => {
  const { actions, events } = fixture();
  await actions.saveJournalPhoto("asset:/sample.jpg");
  assert.equal(events[0], "directory:create");
  assert.ok(events.includes("decode:asset:/sample.jpg"));
  assert.equal(events.filter((event) => event === "file:copy").length, 1);
  assert.ok(events.includes("file:delete"));
  assert.ok(events.includes("rendered:release"));
  assert.ok(events.includes("context:release"));
  assert.ok(events.includes("decoded:release"));
  assert.match(
    events.find((event) => event.startsWith("save:")) ?? "",
    /WeGo-\d+\.png$/,
  );
  assert.equal(events.at(-1), "directory:delete");
});

test("Android 10 requests add-only access before the legacy media writer runs", async () => {
  const { actions, events } = fixture({ version: 29 });
  await actions.saveJournalPhoto("file:///photo.jpg");
  assert.equal(events[0], "permission:true:0");
  assert.equal(events.at(-1), "directory:delete");
});

test("sample exports decode the original bundled source rather than the renderer's event URL", async () => {
  const { actions, events } = fixture();
  await actions.saveJournalPhoto("res:/2131234", 321);
  assert.ok(events.includes("decode:321"));
  assert.ok(!events.includes("decode:res:/2131234"));
  assert.match(
    events.find((event) => event.startsWith("save:")) ?? "",
    /WeGo-\d+\.png$/,
  );
});

test("gallery creation and temporary deletion wait for the SDK's asynchronous file copy", async () => {
  const { actions, events, finishCopy } = fixture({ deferCopy: true });
  const saving = actions.saveJournalPhoto("res:/2131234", 321);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.ok(events.includes("file:copy"));
  assert.ok(
    !events.includes("file:delete"),
    "never delete a source while it is still copying",
  );
  assert.ok(!events.some((event) => event.startsWith("save:")));
  finishCopy();
  await saving;
  assert.ok(events.indexOf("file:copied") < events.indexOf("file:delete"));
  assert.ok(
    events.indexOf("file:copied") <
      events.findIndex((event) => event.startsWith("save:")),
  );
});
