/**
 * Node test bootstrap for `npm test` (node --test).
 * Compiles TypeScript (incl. WatermelonDB legacy decorators) with Babel on
 * require and resolves the `@/` path alias to `src/`. No bundler, no Jest.
 */
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const APP_ADAPTER = path.join(SRC, "database", "adapter.ts");
const TEST_ADAPTER = path.join(__dirname, "adapter.ts");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolve(request, ...rest) {
  if (request.startsWith("@/")) {
    request = path.join(SRC, request.slice(2));
  }
  const resolved = originalResolve.call(this, request, ...rest);
  // Tests run against an in-memory database, never the app's IndexedDB adapter.
  return resolved === APP_ADAPTER ? TEST_ADAPTER : resolved;
};

const compile = (module, filename) => {
  const source = require("fs").readFileSync(filename, "utf8");
  const { code } = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: "inline",
    presets: [["@babel/preset-typescript", { allowDeclareFields: true }]],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-transform-class-properties", { loose: true }],
      "@babel/plugin-transform-modules-commonjs",
    ],
  });
  module._compile(code, filename);
};

Module._extensions[".ts"] = compile;
Module._extensions[".tsx"] = compile;

require("@nozbe/watermelondb/utils/common/logger").default.silence();

// Globals the app installs at startup.
globalThis.t = globalThis.t || ((key) => key);
