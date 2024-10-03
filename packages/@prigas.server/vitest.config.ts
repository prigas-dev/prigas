import { fileURLToPath } from "node:url"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    root: fileURLToPath(new URL("./", import.meta.url)),
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
})
