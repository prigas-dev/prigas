import {
  ExecutorContext,
  logger,
  PromiseExecutor,
  readJsonFile,
} from "@nx/devkit"
import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package"
import assert from "assert"
import { execSync } from "child_process"
import { cp, rm, writeFile } from "fs/promises"
import path from "path"
import { copyDirectory } from "../../lib/copy-directory"
import { ViteBuildExecutorOptions } from "./schema"

const runExecutor: PromiseExecutor<ViteBuildExecutorOptions> = async (
  options,
  ctx,
) => {
  const projectName = ctx.projectName
  assert(projectName, "projectName not provided")

  const projectConfiguration =
    ctx.projectsConfigurations?.projects?.[projectName]
  assert(projectConfiguration, "projectConfiguration not provided")

  const projectRoot = path.join(ctx.root, projectConfiguration.root)
  const distDir = path.join(ctx.root, "dist")
  const projectDistDir = path.join(distDir, projectName)

  const vite = await import("vite")
  const viteConfigFile = path.join(projectRoot, "vite.config.ts")
  await vite.build({
    configFile: viteConfigFile,
  })

  logger.info("Generating declaration files")
  execSync("pnpm tsc --project tsconfig.app.json", { cwd: projectRoot })

  // because tsc generates .d.ts files at dist/{packageName}/{projectRoot}
  // we need to move files up
  await copyDirectory(
    path.join(projectDistDir, projectConfiguration.root),
    path.join(projectDistDir),
  )
  await rm(path.join(projectDistDir, "packages"), { recursive: true })

  const packageJson = readJsonFile<PackageJson>(
    path.join(projectRoot, "package.json"),
  )

  await fixDependencies(packageJson, viteConfigFile, ctx)
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
 * what is already bundled. And also add workspace dependencies with current
 * version.
 *
 * @param packageJson the package.json object to update
 * @param esbuildConfig the esbuild options object used to determine which dependencies are kept
 * @returns
 */
async function fixDependencies(
  packageJson: PackageJson,
  viteConfigFile: string,
  ctx: ExecutorContext,
) {
  if (packageJson.dependencies == null) {
    return
  }

  const vite = await import("vite")
  const viteConfig = await vite.loadConfigFromFile(
    {
      command: "build",
      mode: "production",
      isPreview: false,
      isSsrBuild: false,
    },
    viteConfigFile,
  )

  const projects = ctx.projectsConfigurations?.projects
  assert(projects, "projectConfiguration not provided")

  /**
   * We need to remove all dependencies from the
   * package.json except those declared on "external"
   * {@link:https://rollupjs.org/configuration-options/#external}
   *
   */
  const dependenciesToKeep =
    viteConfig?.config.build?.rollupOptions?.external ?? []

  if (Array.isArray(dependenciesToKeep)) {
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
