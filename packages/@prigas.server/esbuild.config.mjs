/**
 * @type {import('esbuild').BuildOptions}
 */
export const esbuildConfig = {
  entryPoints: ["./src/main.ts", "./src/index.ts"],
  outdir: "../../dist/@prigas/server/src",
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
  external: ["@homebridge/node-pty-prebuilt-multiarch"],
}
