import { PromiseExecutor, readJsonFile } from "@nx/devkit"
import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package"
import esbuild, { BuildOptions as EsbuildOptions } from "esbuild"
import assert from "node:assert"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { EsbuildExecutorOptions } from "./schema"

const runExecutor: PromiseExecutor<EsbuildExecutorOptions> = async (
  options,
  ctx,
) => {
  const projectName = ctx.projectName
  assert(projectName, "projectName not provided")

  const projectConfiguration =
    ctx.projectsConfigurations?.projects?.[projectName]
  assert(projectConfiguration, "projectConfiguration not provided")

  const projectRoot = path.join(ctx.root, projectConfiguration.root)
  const { esbuildConfig } = (await import(
    path.join(projectRoot, "esbuild.config.mjs")
  )) as {
    esbuildConfig: EsbuildOptions
  }

  await esbuild.build({
    ...esbuildConfig,
    absWorkingDir: projectRoot,
    minify: !options.dev,
  })

  const packageJson = readJsonFile<PackageJson>(
    path.join(projectRoot, "package.json"),
  )
  fixDependencies(packageJson, esbuildConfig)

  const distDir = path.join(ctx.root, "dist")
  const packageOutDir = path.join(distDir, projectName)
  await writeFile(
    path.join(packageOutDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  )

  return {
    success: true,
  }
}

/**
 * Remove bundled dependencies from package.json so consumers don't download
 * what is already bundled.
 *
 * @param packageJson the package.json object to update
 * @param esbuildConfig the esbuild options object used to determine which dependencies are kept
 * @returns
 */
function fixDependencies(
  packageJson: PackageJson,
  esbuildConfig: EsbuildOptions,
) {
  if (packageJson.dependencies == null) {
    return
  }

  const dependenciesToKeep = esbuildConfig.external ?? []
  const filteredDependencies = Object.fromEntries(
    Object.entries(packageJson.dependencies).filter(([dependency]) =>
      dependenciesToKeep.includes(dependency),
    ),
  )
  packageJson.dependencies = filteredDependencies
  packageJson.main = "./src/index.js"
}

export default runExecutor
