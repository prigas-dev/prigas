/**
 * @type {import('esbuild').BuildOptions}
 */
export const esbuildConfig = {
  entryPoints: ["./src/**/*.ts"],
  outdir: "../../dist/prigas/src",
  bundle: true,
  format: "esm",
  platform: "node",
  tsconfig: "./tsconfig.app.json",
  target: "node20",
  loader: {
    ".ts": "ts",
  },
  splitting: true,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  external: ["@prigas/server", "@oclif/core"],
}
