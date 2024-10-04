import { ExecutorContext, PromiseExecutor, readJsonFile } from "@nx/devkit"
import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package"
import esbuild, { BuildOptions as EsbuildOptions } from "esbuild"
import assert from "node:assert"
import { cp, writeFile } from "node:fs/promises"
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
  fixDependencies(packageJson, esbuildConfig, ctx)

  const distDir = path.join(ctx.root, "dist")
  const projectDistDir = path.join(distDir, projectName)
  await writeFile(
    path.join(projectDistDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  )

  if (options.assets != null) {
    for (const asset of options.assets) {
      await cp(
        path.join(projectRoot, asset),
        path.join(projectDistDir, asset),
        {
          recursive: true,
        },
      )
    }
  }

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
  ctx: ExecutorContext,
) {
  if (packageJson.dependencies == null) {
    return
  }

  const projects = ctx.projectsConfigurations?.projects
  assert(projects, "projectConfiguration not provided")

  /**
   * When bundle is true, we need to remove all dependencies
   * from the package.json except those declared on "external"
   * {@link:https://esbuild.github.io/api/#external}
   *
   */
  if (esbuildConfig.bundle) {
    const dependenciesToKeep = esbuildConfig.external ?? []
    const filteredDependencies = filterObject(
      packageJson.dependencies,
      (dependency) => dependenciesToKeep.includes(dependency),
    )
    packageJson.dependencies = filteredDependencies
  }

  const workspaceDependencies = filterObject(
    packageJson.dependencies,
    (_, version) => version?.includes("workspace"),
  )
  for (const dependency of Object.keys(workspaceDependencies)) {
    const project = projects[dependency]
    if (project == null) {
      continue
    }

    const dependencyRoot = path.join(ctx.root, project.root)
    const dependencyPackageJson = readJsonFile<PackageJson>(
      path.join(dependencyRoot, "package.json"),
    )
    const version = dependencyPackageJson.version
    assert(version, `version must be specified for package ${dependency}`)
    workspaceDependencies[dependency] = `^${version}`
  }

  Object.assign(packageJson.dependencies, workspaceDependencies)
}

function filterObject<T extends Record<string, unknown>>(
  obj: T,
  predicate: (key: string, value: T[string]) => boolean | undefined,
): T {
  const filteredObject = Object.fromEntries(
    Object.entries(obj).filter(([key, value]) =>
      predicate(key, value as T[string]),
    ),
  )
  return filteredObject as T
}

export default runExecutor
