import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { AliasOptions, ConfigEnv, defineConfig, UserConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig((env) => {
  const config: UserConfig = {
    plugins: [tsconfigPaths(), TanStackRouterVite(), react()],
    build: {
      outDir: "../../dist/@prigas/server/frontend",
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        ...getAlias(env),
      },
    },
    server: {
      port: 8080,
    },
  }

  return config
})

function getAlias(env: ConfigEnv) {
  if (env.mode === "production") {
    const prodAlias: AliasOptions = {
      "@prigas/template": "@prigas/template",
    }
    return prodAlias
  }
  const devAlias: AliasOptions = {}
  return devAlias
}
