import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const {
  transformSync,
}: {
  transformSync: (
    source: string,
    options: Record<string, unknown>,
  ) => { code: string | null } | null;
} = require("@babel/core");
const modules = new Map<string, { exports: Record<string, unknown> }>();

/** Execute the real preview store and fixtures; only bundled image imports are stubbed. */
function load(filename: string): Record<string, unknown> {
  const cached = modules.get(filename);
  if (cached) return cached.exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [
      "@babel/plugin-transform-typescript",
      "@babel/plugin-transform-modules-commonjs",
    ],
  });
  if (!compiled?.code) throw new Error(`Unable to compile ${filename}`);
  runInNewContext(
    compiled.code,
    {
      module,
      exports: module.exports,
      require: (id: string) => {
        if (id.startsWith("@/assets/")) return id;
        if (!id.startsWith(".")) return require(id);
        const base = resolve(dirname(filename), id);
        const target = [base, `${base}.ts`].find((file) => existsSync(file));
        if (!target) throw new Error(`Unable to resolve ${id}`);
        return load(target);
      },
    },
    { filename },
  );
  return module.exports;
}

export function loadHomePreview() {
  return load(
    fileURLToPath(
      new URL(
        "../../src/features/home/store/trip-preview-store.ts",
        import.meta.url,
      ),
    ),
  ) as typeof import("../../src/features/home/store/trip-preview-store.ts");
}
