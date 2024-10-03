import { cp, writeFile } from "fs/promises"
import path from "node:path"
import { esbuildConfig } from "../apps.backend.server/esbuild.config.mjs"
import packageJson from "../apps.backend.server/package.json" with { type: "json" }

const workspaceRoot = path.join(import.meta.dirname, "..", "..")
const distRoot = path.join(workspaceRoot, "dist")
await cp(
  path.join(distRoot, "apps.backend.server"),
  path.join(workspaceRoot, "dist", "@prigas.server", "apps.backend.server"),
  {
    recursive: true,
  },
)

await cp(
  path.join(distRoot, "apps.frontend"),
  path.join(distRoot, "@prigas.server", "apps.frontend"),
  {
    recursive: true,
  },
)

const dependenciesToKeep = esbuildConfig.external ?? []

const filteredDependencies = Object.fromEntries(
  Object.entries(packageJson.dependencies).filter(([dependency]) =>
    dependenciesToKeep.includes(dependency),
  ),
)
packageJson.dependencies = filteredDependencies

packageJson.name = "@prigas/server"
packageJson.main = "./apps.backend.server/src/index.js"

await writeFile(
  path.join(distRoot, "@prigas.server", "package.json"),
  JSON.stringify(packageJson, null, 2),
)
