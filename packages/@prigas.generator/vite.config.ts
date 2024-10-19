import path from "path"
import { UserConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig(() => {
  const config: UserConfig = {
    root: import.meta.dirname,
    plugins: [
      tsconfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
    build: {
      outDir: "../../dist/@prigas/generator",
      emptyOutDir: true,
      lib: {
        entry: "./src/index.ts",
        formats: ["es"],
        fileName: "src/index",
      },
      rollupOptions: {
        external: [],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      port: 8080,
    },
    test: {
      environment: "node",
      globals: true,
      root: import.meta.dirname,
      include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      setupFiles: ["./vitest.setup.ts"],
    },
  }

  return config
})
