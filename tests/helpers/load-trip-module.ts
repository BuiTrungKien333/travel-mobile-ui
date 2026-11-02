import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../../", import.meta.url));

/** Execute project TS/TSX with explicit platform/hook doubles; no native runtime needed. */
export function tripModuleLoader(
  mocks: Record<string, unknown> = {},
  globals: Record<string, unknown> = {},
) {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  function load(path: string): Record<string, unknown> {
    const filename = [path, `${path}.ts`, `${path}.tsx`].find(existsSync);
    if (!filename) throw new Error(`Cannot resolve ${path}`);
    if (cache.has(filename)) return cache.get(filename)!.exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    runInNewContext(
      code,
      {
        ...globals,
        module,
        exports: module.exports,
        require: (id: string) => {
          if (id in mocks) return mocks[id];
          if (id.startsWith("@/assets/")) return id;
          if (id.startsWith("@/"))
            return load(resolve(root, "src", id.slice(2)));
          if (id.startsWith(".")) return load(resolve(dirname(filename), id));
          return require(id);
        },
        requestAnimationFrame: (callback: () => void) => callback(),
      },
      { filename },
    );
    return module.exports;
  }
  return <T>(relativePath: string) => load(resolve(root, relativePath)) as T;
}
